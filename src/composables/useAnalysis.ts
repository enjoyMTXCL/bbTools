import { ref, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import type { TabsPaneContext } from 'element-plus'
import { handleExcelData, formatDateTime } from '@/utils/index'
import { loadData } from '@/utils/dataStorage'
import type { GroupItem, BattleInfo } from '@/types/analysis'

interface UseAnalysisOptions {
  /**
   * 本地分组数据加载完成后的回调。
   * 团战页（battle.vue）用它构建历史场次下拉，团本页（level.vue）不需要。
   */
  onLoaded?: (groupList: GroupItem[]) => void
}

/**
 * 团战/团本分析页公共逻辑：
 * 读取本地分组数据、起始时间修正、图表切换、地图信息提取、Excel 下载。
 */
export function useAnalysis(options: UseAnalysisOptions = {}) {
  const groupList = ref<GroupItem[]>()
  const mapUrl = ref('')
  const mapName = ref('')
  const resultStatus = ref<number | string>('')
  const redSquare = ref('')
  const blueSquare = ref('')
  const battleTime = ref('')
  const startTime = ref(0)
  const fullLoading = ref(false)
  const nowTabs = ref(0)

  // 图表显示配置
  const userEchartRef = ref()

  // ========== 功能函数 ==========
  const solveTimeBug = () => {
    const regPos = /^[0-9]+.?[0-9]*/
    ElMessageBox.prompt('解决官方时间超长bug，这里输入初始时间（单位：分钟）。详见：帮助-常见问题-5', '解决官方时间超长问题', {
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    }).then(({ value }) => {
      if (value && regPos.test(value)) {
        startTime.value = Number(value) * 60
        userEchartRef.value.showChart()
      }
    }).catch(() => {
      // 用户取消操作，不做处理
    })
  }

  // ========== 事件函数 ==========

  // 切换图表
  const tabClick = (tab: TabsPaneContext) => {
    nowTabs.value = Number(tab.props.name)
    userEchartRef.value.showChart()
  }

  // 获取地图信息
  const getMapInfo = (historyObj: BattleInfo) => {
    if (
      historyObj &&
      historyObj.history &&
      Array.isArray(historyObj.history) &&
      !mapUrl.value
    ) {
      try {
        mapUrl.value = historyObj.map_figure_url || ''
        mapName.value = historyObj.map_name || ''
        resultStatus.value = historyObj.status || ''
        redSquare.value = historyObj.name1 || ''
        blueSquare.value = historyObj.name2 || ''
        // 团战用 endtime（22 点结束）→ 统一减 2 小时显示 20 点开始时间；团本用 begin_time
        const raw = (historyObj as any).endtime
          ? (historyObj as any).endtime - 2 * 60 * 60
          : (historyObj as any).begin_time || 0
        battleTime.value = formatDateTime(raw)
      } catch (error) {
        mapUrl.value = ''
        mapName.value = ''
        resultStatus.value = ''
        redSquare.value = ''
        blueSquare.value = ''
        battleTime.value = ''
      }
    }
  }

  // 下载团战/团本数据到 excel（battle 页传 historyId，level 页不传）
  const downloadDataToExcel = (historyId?: number) => {
    if (groupList.value && groupList.value.length > 0) {
      const { data, name } = handleExcelData(groupList.value, startTime.value, historyId)
      window.ipcRenderer.send('saveExcel', data, name)
    }
  }

  onMounted(() => {
    // 分组数据由主进程文件化存储（异步加载，旧 localStorage 数据自动迁移）
    loadData().then((groupDataString) => {
      if (groupDataString) {
        try {
          const parsed: GroupItem[] = JSON.parse(groupDataString)
          groupList.value = parsed
          options.onLoaded?.(parsed)
        } catch (error) {
          console.error('解析分组数据失败:', error)
        }
      }
      if (groupList.value && groupList.value.length > 0) {
        userEchartRef.value.showChart()
      }
    })
  })

  return {
    groupList,
    mapUrl,
    mapName,
    resultStatus,
    redSquare,
    blueSquare,
    battleTime,
    startTime,
    fullLoading,
    nowTabs,
    userEchartRef,
    solveTimeBug,
    tabClick,
    getMapInfo,
    downloadDataToExcel
  }
}
