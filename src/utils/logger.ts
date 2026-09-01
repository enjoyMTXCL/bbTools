/**
 * 错误日志封装：请求出错时记录到主进程文件（userData/logs/error.log，超 5M 自动滚动）
 */

export const logError = (text: string): Promise<unknown> => {
  return window.ipcRenderer.invoke('log:error', text)
}

export const openLogDir = (): Promise<unknown> => {
  return window.ipcRenderer.invoke('log:openDir')
}

export const exportLog = (): Promise<{ ok: boolean; canceled?: boolean }> => {
  return window.ipcRenderer.invoke('log:export')
}
