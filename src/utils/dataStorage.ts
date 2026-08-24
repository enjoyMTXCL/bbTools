/**
 * 分组数据存取封装：
 * 通过 IPC 交由主进程文件化存储（userData/groupData.json），保存时主进程自动生成带时间戳备份。
 * 兼容旧版本：检测到 localStorage 中残留的 groupData 时自动迁移到文件存储。
 */

export function loadData(): Promise<string> {
  const legacy = window.localStorage.getItem('groupData')
  if (legacy !== null) {
    // 迁移旧 localStorage 数据：写入文件存储并移除旧数据
    window.localStorage.removeItem('groupData')
    return window.ipcRenderer.invoke('data:save', legacy).then(() => legacy)
  }
  return window.ipcRenderer.invoke('data:load').then((data) =>
    typeof data === 'string' ? data : ''
  )
}

export function saveData(data: string): Promise<unknown> {
  return window.ipcRenderer.invoke('data:save', data)
}

export interface BackupItem {
  name: string
  time: number
}

export function listBackups(): Promise<BackupItem[]> {
  return window.ipcRenderer.invoke('data:listBackups').then((list) =>
    Array.isArray(list) ? list : []
  )
}

export function restoreData(name: string): Promise<string> {
  return window.ipcRenderer.invoke('data:restore', name).then((data) =>
    typeof data === 'string' ? data : ''
  )
}

export function deleteBackup(name: string): Promise<boolean> {
  return window.ipcRenderer.invoke('data:deleteBackup', name).then((ok) => ok === true)
}
