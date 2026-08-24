import { defineStore } from 'pinia'

// 更新信息（来自 GitHub releases 接口）
export interface UpdateInfo {
  version: string
  downloadUrl: string
  body: string
  code: number
}

export const useAppStore = defineStore('app', {
  state: () => ({
    cookie: '',
    teamName: '',
    serverName: '',
    // null: 未检查或报错；或更新信息对象（code 0 = 有新版本，code 1 = 无新版本）
    isUpdate: null as UpdateInfo | null
  }),
  actions: {
    setCookie(value: string) {
      this.cookie = value
    },
    setTeamName(value: string) {
      this.teamName = value
    },
    setServerName(value: string) {
      this.serverName = value
    },
    setIsUpdate(value: UpdateInfo | number | null) {
      // 原 vuex 用数字 0 表示"未检查/报错"，此处归一化为 null（模板仅做 truthy 判断，行为等价）
      this.isUpdate = value && typeof value === 'object' ? value : null
    }
  }
})

export default useAppStore
