import { app, BrowserWindow, shell, ipcMain, session, dialog, safeStorage } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import { sendMsg, getServerList, loadExcelData, saveExcelData } from '../utils/index'
import getBBData from '../api/index'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

// 关闭图片不安全提示
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';


async function createWindow() {
  win = new BrowserWindow({
    title: '崩崩团战工具',
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    icon: path.join(process.env.VITE_PUBLIC, 'logo.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })



  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
    //隐藏顶部菜单
    win.setMenu(null)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
  // 下载提示
  win.webContents.session.on('will-download', (event, item, webContents) => {
    item.once('done', (event, state) => {
      if (state === 'completed') {
        sendMsg(win, '下载完成', 'success')
      } else if (state !== 'cancelled') {
        sendMsg(win, '下载失败:' + state, 'error')
      }
    })
  })
  // 关闭提示
  win.on('close', e => {
    e.preventDefault(); //先阻止一下默认行为，不然直接关了，提示框只会闪一下
    dialog.showMessageBox({
      type: 'info',
      title: '提示',
      message: '确认关闭？',
      buttons: ['确认', '取消'],   //选择按钮，点击确认则下面的idx为0，取消为1
      cancelId: 1, //这个的值是如果直接把提示框×掉返回的值，这里设置成和“取消”按钮一样的值，下面的idx也会是1
    }).then(idx => {
      if (idx.response == 1) {
        e.preventDefault();
      } else {
        win = null
        app.exit();
      }
    })
  });
}

app.whenReady().then(() => {
  // 拦截请求并修改 header
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  createWindow();
});

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// cookie 加密存储路径（随用户数据目录，不进 asar）
const cookieFilePath = path.join(app.getPath('userData'), 'cookie.bin')
// 文件首字节标记：1 = safeStorage 加密，0 = 降级明文（safeStorage 没有 isEncrypted 之类的判断 API，用标记位区分）
const COOKIE_ENC_FLAG = Buffer.from([1])
const COOKIE_PLAIN_FLAG = Buffer.from([0])

// 保存 cookie：使用 safeStorage 加密后落盘，加密不可用时降级为普通文件（仍优于 localStorage 明文）
ipcMain.handle('cookie:save', (_, cookie: string) => {
  try {
    if (cookie && safeStorage.isEncryptionAvailable()) {
      fs.writeFileSync(cookieFilePath, Buffer.concat([COOKIE_ENC_FLAG, safeStorage.encryptString(cookie)]))
    } else {
      fs.writeFileSync(cookieFilePath, Buffer.concat([COOKIE_PLAIN_FLAG, Buffer.from(cookie, 'utf8')]))
    }
    return true
  } catch (error) {
    console.error('保存 cookie 失败:', error)
    return false
  }
})

// 读取 cookie：按首字节标记自动识别加密内容并解密；无标记的旧格式文件先按旧密文尝试解密，失败再按明文返回
ipcMain.handle('cookie:load', () => {
  try {
    if (!fs.existsSync(cookieFilePath)) return ''
    const buffer = fs.readFileSync(cookieFilePath)
    if (buffer.length === 0) return ''
    const flag = buffer[0]
    if (flag === COOKIE_ENC_FLAG[0] || flag === COOKIE_PLAIN_FLAG[0]) {
      // 新格式：首字节为标记位
      return flag === COOKIE_ENC_FLAG[0]
        ? safeStorage.decryptString(buffer.subarray(1))
        : buffer.subarray(1).toString('utf8')
    }
    // 旧格式（无标记）：可能是 safeStorage 裸密文，也可能是降级明文
    if (safeStorage.isEncryptionAvailable()) {
      try {
        return safeStorage.decryptString(buffer)
      } catch {
        // 非法密文，按明文处理
      }
    }
    return buffer.toString('utf8')
  } catch (error) {
    console.error('读取 cookie 失败:', error)
    return ''
  }
})

// 读取服务器列表
ipcMain.on('getServer', (event, arg) => {
  const serverList = getServerList();
  event.reply('getServer-reply', serverList)
})

// ========== 分组数据文件化存储（userData 目录，不进 asar） ==========
// 保存时自动生成带时间戳备份，保留最近 BACKUP_KEEP 份
const dataFilePath = path.join(app.getPath('userData'), 'groupData.json')
const BACKUP_PREFIX = 'groupData-'
const BACKUP_KEEP = 20

const formatStamp = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

// 自动备份：复制当前数据文件为带时间戳的备份，并清理超出保留份数的旧备份
const backupDataFile = () => {
  try {
    if (!fs.existsSync(dataFilePath)) return
    const backupDir = app.getPath('userData')
    fs.copyFileSync(dataFilePath, path.join(backupDir, `${BACKUP_PREFIX}${formatStamp(new Date())}.json`))
    const backups = fs.readdirSync(backupDir)
      .filter((f) => f.startsWith(BACKUP_PREFIX) && f.endsWith('.json'))
      .sort()
      .reverse()
    for (const old of backups.slice(BACKUP_KEEP)) {
      fs.rmSync(path.join(backupDir, old), { force: true })
    }
  } catch (error) {
    console.error('自动备份失败:', error)
  }
}

// 保存分组数据（保存前自动备份）
ipcMain.handle('data:save', (_, data: string) => {
  try {
    if (fs.existsSync(dataFilePath)) backupDataFile()
    fs.writeFileSync(dataFilePath, data, 'utf8')
    return true
  } catch (error) {
    console.error('保存分组数据失败:', error)
    return false
  }
})

// 读取分组数据
ipcMain.handle('data:load', () => {
  try {
    if (!fs.existsSync(dataFilePath)) return ''
    return fs.readFileSync(dataFilePath, 'utf8')
  } catch (error) {
    console.error('读取分组数据失败:', error)
    return ''
  }
})

// 列出所有备份（名称 + 修改时间，按时间倒序）
ipcMain.handle('data:listBackups', () => {
  try {
    const dir = app.getPath('userData')
    return fs.readdirSync(dir)
      .filter((f) => f.startsWith(BACKUP_PREFIX) && f.endsWith('.json'))
      .map((f) => {
        const stat = fs.statSync(path.join(dir, f))
        return { name: f, time: stat.mtime.getTime() }
      })
      .sort((a, b) => b.time - a.time)
  } catch (error) {
    console.error('列出备份失败:', error)
    return []
  }
})

// 还原指定备份
ipcMain.handle('data:restore', (_, name: string) => {
  try {
    const file = path.join(app.getPath('userData'), name)
    if (!fs.existsSync(file)) return ''
    return fs.readFileSync(file, 'utf8')
  } catch (error) {
    console.error('还原备份失败:', error)
    return ''
  }
})

// 删除指定备份（仅允许删除备份前缀文件，防止任意路径删除）
ipcMain.handle('data:deleteBackup', (_, name: string) => {
  try {
    if (!name.startsWith(BACKUP_PREFIX) || !name.endsWith('.json')) {
      console.error('非法备份文件名:', name)
      return false
    }
    const file = path.join(app.getPath('userData'), name)
    if (!fs.existsSync(file)) return false
    fs.rmSync(file, { force: true })
    return true
  } catch (error) {
    console.error('删除备份失败:', error)
    return false
  }
})

// 获取崩崩数据
ipcMain.on('getBBData', async (event, messageId, arg, cookie) => {
  try {
    const data = await getBBData(arg, cookie);
    // event.returnValue = data;
    event.reply(messageId, { data });
  } catch (error) {
    event.reply(messageId, { error });
  }
})

// 加载本地excel
ipcMain.on('loadExcel', (event, arg) => {
  // 加载并解析excel，返回数据
  const data = loadExcelData()
  // console.log(data)
  // event.reply('loadExcel-reply', result)
  event.returnValue = data
  if (data && data.length > 0) {
    sendMsg(win, '加载完成，数据已替换', 'success')
  }
})

// 保存excel
ipcMain.on('saveExcel', (event, arg, fileName) => {
  // 保存excel
  // saveExcel(arg)
  saveExcelData(arg, fileName).then(() => {
    sendMsg(win, '保存成功', 'success')
  }).catch((error) => {
    if (error !== 'canceled') {
      console.error('保存 excel 失败:', error)
      sendMsg(win, '保存失败', 'error')
    }
  })
})

// 下载本地文件
ipcMain.on('downloadTemplateFile', () => {
  // 下载文件
  let teamObj = {
    name: '分队',
    data: [['UID', 'UserName']],
    options: {'!cols': [{ wch: 20 }, { wch: 20 }]}
  }
  let data = []
  for (let i = 1; i <= 3; i++) {
    data.push({
      ...teamObj,
      name: `分队${i}`
    })
  }
  saveExcelData(data, '社团成员名单模板.xls').then(() => {
    sendMsg(win, '保存成功', 'success')
  }).catch((error) => {
    if (error !== 'canceled') {
      console.error('下载模板失败:', error)
      sendMsg(win, '保存失败', 'error')
    }
  })
})
