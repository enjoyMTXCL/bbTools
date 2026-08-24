/**
 * Cookie 存取封装：
 * 通过 IPC 交由主进程使用 safeStorage 加密后落盘，避免明文存储于 localStorage。
 * 兼容旧版本：检测到 localStorage 中残留的明文 cookie 时自动迁移到加密存储。
 */

export function loadCookie(): Promise<string> {
  const legacyCookie = window.localStorage.getItem('cookie')
  if (legacyCookie !== null) {
    // 迁移旧明文 cookie：从 localStorage 移除并写入加密存储
    window.localStorage.removeItem('cookie')
    return window.ipcRenderer
      .invoke('cookie:save', legacyCookie)
      .then(() => legacyCookie)
  }
  return window.ipcRenderer.invoke('cookie:load').then((cookie) =>
    typeof cookie === 'string' ? cookie : ''
  )
}

export function saveCookie(cookie: string): Promise<unknown> {
  return window.ipcRenderer.invoke('cookie:save', cookie)
}
