import { loadCookie } from './cookieStorage'

/** 米游社接口查询参数 */
interface BBQuery {
  role_id: number
  server: string
}

/** 米游社接口返回结构 */
export interface ApiResult {
  retcode?: number
  message?: string
  data?: {
    profile?: import('@/types/analysis').ProfileData
  }
}

const getBB = (query: BBQuery): Promise<ApiResult> => {
  return loadCookie().then((cookie) => {
    // 生成一个唯一的消息ID
    const messageId = `getBBData-${Math.random()}-${Date.now()}`

    return new Promise((resolve, reject) => {
      // 监听主进程的响应
      window.ipcRenderer.once(messageId, (event, result) => {
        if (result.error) {
          reject(result.error)
        } else {
          resolve(result.data)
        }
      })

      // 发送消息到主进程
      window.ipcRenderer.send('getBBData', messageId, query, cookie)
    })
  })
}

export interface PostData {
  uid: number
  server: string
}

export async function getUserSingleData(postData: PostData): Promise<ApiResult> {
  const query = {
    role_id: postData.uid,
    server: postData.server
  }
  return getBB(query)
}
