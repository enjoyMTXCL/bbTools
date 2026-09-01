import { app, dialog, BrowserWindow } from 'electron'
// const { app } = window.require('electron');
// const fs = require("fs") as typeof import('fs');
// const fs = require("fs");
import fs from 'fs'
import { loadExcel, saveExcel } from './excel'

// 配置文件相关类型
interface ServerConfig {
  name: string
  value: string
  display?: boolean
}

interface AppConfig {
  version: string
  servers: ServerConfig[]
}

// 获取配置文件地址
let userData = app ? app.getPath('userData') : ''
const filePath = `${userData}\\serverData.json`

// 默认服务器配置（带版本号）
// 获取项目版本号
const defaultConfig = {
  version: app.getVersion(), // 配置文件版本
  servers: [
    { name: '混服S1', value: 'hun01', display: true },
    { name: '混服S2', value: 'hun02', display: true },
    { name: '国服', value: 'gf01', display: true },
    // B服服务器标识已更新为 bb01/bb02（旧值 bilibili01/bilibili02 已失效），老用户配置按名称自动迁移
    { name: 'B服01', value: 'bb01', display: true },
    { name: 'B服02', value: 'bb02', display: true },
    { name: 'UC服01', value: 'uc01', display: true },
    { name: 'UC服02', value: 'uc02', display: true },
    // { name: '当乐服', value: 'dangle01', display: true }
  ]
}

// 判断文件是否存在
const isFileExist = (path: string) => {
  try {
    fs.accessSync(path, fs.constants.F_OK);
  } catch (e) {
    return false;
  }
  return true;
}

// 发送消息给渲染进程，只想到了win.webContents.send发送，之后有空再看看别的
const sendMsg = (win: BrowserWindow, msg: string, type: string) => {
  // console.log(msg)
  win.webContents.send('message', msg, type)
}

const getServerList = () => {
  let bExistsSync = isFileExist(filePath);
  let userConfig = null;

  if (bExistsSync) {
    try {
      let data = fs.readFileSync(filePath, 'utf8');
      userConfig = JSON.parse(data);
    } catch (error) {
      console.log('配置文件解析失败:', error);
      userConfig = null;
    }
  }

  // 如果没有用户配置或版本不匹配，需要合并配置
  if (!userConfig || !userConfig.version || userConfig.version !== defaultConfig.version) {
    const mergedConfig = mergeConfigs(userConfig, defaultConfig);
    
    // 保存合并后的配置
    try {
      fs.writeFileSync(filePath, JSON.stringify(mergedConfig, null, 2));
      return mergedConfig.servers;
    } catch (error) {
      console.log('保存配置文件失败:', error);
      return defaultConfig.servers;
    }
  }

  return userConfig.servers || defaultConfig.servers;
}

// 配置合并策略：按服务器「名称」匹配（旧逻辑按 value 去重，会在服务器标识更新时产生重复项）。
// - 名称与新版默认配置一致（如 B服01）→ 采用新版默认配置（value 同步更新，bilibili01 → bb01），display 仍尊重用户的隐藏选择
// - 名称是用户自定义的（默认配置里没有）→ 保留用户配置（自定义服务器，如手动加进 serverData.json 的）
// - 默认配置有而用户没有的 → 补全
const mergeConfigs = (userConfig: Partial<AppConfig> | null, defaultConfig: AppConfig): AppConfig => {
  if (!userConfig) {
    return defaultConfig;
  }

  const userServers = userConfig.servers || [];
  const defaultServers = defaultConfig.servers || [];

  const mergedServers: ServerConfig[] = [];
  const usedNames = new Set<string>();

  // 1. 用户配置：名称匹配默认配置的用新版默认（value 更新），未匹配的保留自定义
  for (const userServer of userServers) {
    const defaultServer = defaultServers.find((s) => s.name === userServer.name);
    if (defaultServer) {
      mergedServers.push({
        ...defaultServer,
        display: (userServer.display === false || defaultServer.display === false) ? false : true
      });
    } else {
      mergedServers.push({ ...userServer, display: userServer.display ?? true });
    }
    usedNames.add(userServer.name);
  }

  // 2. 默认配置补全：用户没有的项直接添加
  for (const defaultServer of defaultServers) {
    if (!usedNames.has(defaultServer.name)) {
      mergedServers.push({ ...defaultServer, display: defaultServer.display ?? true });
    }
  }

  return {
    ...defaultConfig,
    servers: mergedServers,
    version: defaultConfig.version
  };
}

// 加载excel文件，获取多个sheet，然后对数据的id进行去重
const loadExcelData = () => {
  try {
    const filePaths = dialog.showOpenDialogSync({
      properties: ['openFile'],
      filters: [
        { name: 'Excel', extensions: ['xls', 'xlsx'] }
      ]
    })
    if (!filePaths || filePaths.length === 0) {
      // 用户取消选择：返回 null 与"选了文件但无数据（[]）"区分开，渲染层据此静默处理
      return null
    }
    const path = filePaths[0]
    const workSheetsFromFile = loadExcel(path)
    // 去重并生成根据sheet的多维数组
    let groupData = []
    workSheetsFromFile.forEach(sheet => {
      let group = sheet.data
      let groupObj = {
        groupName: sheet.name,
        group: [],
        hasAdd: 0
      }
      group.forEach((item, index) => {
        if (index > 0 && item[0]) {
          // 去重
          for (let i in groupData) {
            if (groupData[i].group.find((v) => v.uid === item[0])) {
              return
            }
          }
          if (groupObj.group.find((v) => v.uid === item[0])) {
            return
          }

          if (item[0] === 'uid') {
            return
          }

          if (!item[0] || isNaN(item[0])) {
            return
          }

          if (!item[1]) {
            item[1] = '默认帕鲁'
          }
  
          let obj = {
            uid: item[0],
            name: item[1],
            hasEdit: 0,
            message: '',
            profile: null
          }
          groupObj.group.push(obj)
        }
      })
      groupData.push(groupObj)
    })
    return groupData
  } catch (error) {
    console.log(error)
    return []
  }
}

// 保存文件，调用showSaveDialog获取保存路径，然后将文件流写入
const saveFile = async (
  dataBuffer: Buffer,
  fileName: string,
  extensions: string[] | string
): Promise<void> => {
  if (!Array.isArray(extensions)) {
    extensions = [extensions];
  }
  const result = await dialog.showSaveDialog({
    title: '保存文件',
    defaultPath: fileName,
    filters: [{ name: 'Excel', extensions }]
  });
  if (result.canceled || !result.filePath) {
    // 与旧版行为保持一致：取消时以 'canceled' 拒绝，调用方据此区分用户取消
    throw 'canceled';
  }
  await fs.promises.writeFile(result.filePath, dataBuffer);
};

// 保存excel
const saveExcelData = (data: any, fileName: string) => {
  const buffer = saveExcel(data)
  return saveFile(buffer, fileName, ['xls', 'xlsx'])
}

export {
  sendMsg,
  getServerList,
  loadExcelData,
  saveExcelData
}