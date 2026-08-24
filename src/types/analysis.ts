// ========== interface 定义 ==========
export interface HistoryItem {
  level_id: number
  enter_time: number
  pass_time: number
  contribute_rate: number
}

export interface BattleInfo {
  map_figure_url?: string
  map_name?: string
  status?: number | string
  name1?: string
  name2?: string
  /** 战斗结束时间（unix 秒） */
  endtime?: number
  history: HistoryItem[]
}

export interface LevelInfo {
  map_figure_url?: string
  map_name?: string
  /** 团本开始时间（unix 秒） */
  begin_time?: number
  /** 团本结束时间（unix 秒） */
  end_time?: number
  history: HistoryItem[]
}

/** 米游社接口返回的玩家档案 */
export interface ProfileData {
  name?: string
  battle_info?: {
    history: BattleInfo[]
  }
  level_info?: LevelInfo
}

/**
 * 分组成员（统一类型定义）：
 * - profile 在未获取数据时为 null，获取失败时置为 null 并记录 message
 * - retcode 为接口返回码，仅批量请求场景使用
 */
export interface PeopleData {
  name: string
  uid: number
  hasEdit?: number
  message?: string
  retcode?: number
  profile?: ProfileData | null
}

export interface GroupItem {
  groupName: string
  group: PeopleData[]
}

export interface ChartOptionItem {
  name: string
  desc: string
}

export interface HistoryArrItem {
  label: string
  value: number
}
