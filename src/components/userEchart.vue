<template>
  <el-card class="box-card" shadow="never">
    <template #header>
      <div class="chart-title">
        <span class="chart-name">{{ chartOptions[nowCharts].name }}</span>
        <span class="chart-desc">{{ chartOptions[nowCharts].desc }}</span>
      </div>
      <div class="card-header">
        <el-select v-model="nowCharts" class="m-2" placeholder="请选择图表" size="large" @change="showChart" style="width: 200px;">
          <el-option v-for="(item, index) in chartOptions" :key="index" :label="item.name" :value="index" />
        </el-select>
        <el-button type="primary" @click="downloadChart" :icon="Download">图表下载</el-button>
      </div>
    </template>
    <el-tabs type="border-card" @tab-click="tabClick" v-model="nowTabs">
      <el-tab-pane :label="item.groupName" :name="gIndex" v-for="(item, gIndex) in groupList" :key="gIndex" />
      <charts :initOption="option" v-if="groupList && groupList.length > 0" ref="chartRef" />
      <el-empty description="请前往数据管理添加用户数据" v-else style="height:350px;" />
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import charts from './echarts.vue'
import { Download } from '@element-plus/icons-vue'
import { GroupItem, ChartOptionItem } from '@/types/analysis'
import { formatTime, contributeCompute } from '@/utils/index'
import { useGroupTabs } from '@/composables/useGroupTabs'
import { settings, isWatermarkEnabled, getWatermarkText } from '@/utils/settings'

const props = defineProps({
  groupList: {
    type: Array as () => GroupItem[],
    default: () => []
  },
  mapName: {
    type: String,
    default: ''
  },
  historyId: {
    type: Number,
    default: 0
  },
  startTime: {
    type: Number,
    default: 0
  },
  redSquare: {
    type: String,
    default: ''
  },
  blueSquare: {
    type: String,
    default: ''
  },
  battleTime: {
    type: String,
    default: ''
  },
  modelValue: {
    type: Number,
    default: 0
  },
  groupType: {
    type: String,
    default: 'battle'
  }
})

const emit = defineEmits(['tabClick', 'update:modelValue', 'getMapInfo'])

const { getGroupData, letter, nowTabs, tabClick } = useGroupTabs(props, emit)

// 显示图表
const showChart = async () => {
  // 等待响应式状态（v-model/props）更新完成后再取值渲染图表
  await nextTick()
  option.value = null
  if (!props.groupList || props.groupList.length === 0) return
  let chartData
  if (nowCharts.value === 'bar') {
    chartData = showBarChart(props.groupList[nowTabs.value])
  } else if (nowCharts.value === 'heatmap') {
    chartData = showHeatmapChart(props.groupList[nowTabs.value])
  } else {
    chartData = showLineChart(props.groupList[nowTabs.value])
  }
  option.value = chartData
}
// showChart开放给父组件
defineExpose({ showChart })

// 水印开关/文字修改后立即刷新图表（无需重新进入页面）
watch(
  () => [settings.value.watermarkEnabled, settings.value.watermarkText],
  () => {
    showChart()
  }
)


const option = ref()
const chartRef = ref()
const nowCharts = ref<'bar' | 'line' | 'heatmap'>('line')
const chartOptions = ref<Record<string, ChartOptionItem>>({
  bar: {
    name: '柱状图',
    desc: 'X轴为小队成员；Y轴为所用总时间；可查看成员贡献效率'
  },
  line: {
    name: '折线图',
    desc: 'X轴为进点时间；Y轴为进攻点位；可对比成员打点情况'
  },
  heatmap: {
    name: '点位热力图',
    desc: 'X轴为小队成员；Y轴为进攻点位；颜色深浅代表该点位同步率多少'
  }
})
// 图表水印（由设置控制开关与文字，关闭时返回空数组）
const buildGraphic = () => {
  if (!isWatermarkEnabled()) return []
  return [{
    type: 'group',
    left: 50,
    bottom: 40,
    z: 100,
    children: [
      {
        type: 'rect',
        left: 'center',
        top: 'center',
        z: 100,
        shape: {
          width: 200,
          height: 30
        },
        style: {
          fill: 'rgba(0,0,0,0.3)'
        }
      },
      {
        type: 'text',
        left: 'center',
        top: 'center',
        z: 100,
        style: {
          fill: '#fff',
          text: getWatermarkText(),
          font: 'bold 14px sans-serif'
        }
      }
    ]
  }]
}
// 图表选项
const chartGrid = {
  left: 30,
  right: 70,
  top: 100,
  bottom: 100
}



// 图表下载
const downloadChart = () => {
  if (option.value && props.groupList) {
    // 文件名中不能含 Windows 非法字符（如冒号），时间里的 : 替换为下划线（20:00 → 20_00）
    const timeSuffix = props.battleTime ? ' ' + props.battleTime.replace(/:/g, '_') : ''
    let picName = `${props.redSquare} VS ${props.blueSquare} ${props.mapName}${timeSuffix}-${props.groupList[nowTabs.value].groupName}`
    chartRef.value.downloadChart(picName)
  }
}

// 柱状图
const showBarChart = (res: GroupItem) => {
  const barColor: Record<string, string> = {
    A: '#5470c6',
    B: '#91cc75',
    C: '#fac858',
    D: '#ee6666',
    E: '#73c0de',
    F: '#3ba272',
    G: '#fc8452',
    H: '#9a60b4',
    I: '#ea7ccc',
    '1': '#5470c6',
    '2': '#91cc75',
    '3': '#fac858',
    '4': '#ee6666',
    '5': '#73c0de',
    '6': '#3ba272',
    '7': '#fc8452',
  }

  const labelOption = {
    show: true,
    fontSize: 10,
    formatter(params: any) {
      if (params.data?.message) {
        return '{message|错误...}'
      } else {
        return `${params.data?.pass_time}秒 ${params.name}点`
      }
    },
    rich: {
      message: {
        fontSize: 12
      }
    }
  }

  const barTooltip = {
    formatter(params: any) {
      if (!params.data) return ''
      return params.data.message
        ? params.data.message
        : `用时${params.data.pass_time}秒 攻占${params.name}点，获得${contributeCompute(params.data.contribute_rate)}% 同调率`
    }
  }

  const groupData: any = {
    // backgroundColor: '#fff',
    grid: chartGrid,
    dataZoom: {
      type: 'inside'
    },
    xAxis: {
      name: '成员',
      axisLabel: {
        interval: 0,
        rotate: 45
      },
      data: []
    },
    yAxis: {
      name: '总参与时间（单位：秒）'
    },
    tooltip: barTooltip,
    series: [],
    graphic: buildGraphic()
  }

  for (let i = 0; i < res.group.length; i++) {
    const oneMember = res.group[i]
    // const historyObj = oneMember.profile?.battle_info?.history[props.historyId] || { history: [] }
    const historyObj = getGroupData(oneMember)
    groupData.xAxis.data.push(oneMember?.name || '成员占位')

    // 获取地图信息
    // getMapInfo(historyObj)
    emit('getMapInfo', historyObj)

    if (historyObj.history && historyObj.history.length > 0) {
      for (let j = 0; j < historyObj?.history.length; j++) {
        if (!groupData.series[j]) {
          groupData.series[j] = {
            data: [],
            type: 'bar',
            barGap: '20%',
            barCategoryGap: '30%',
            label: labelOption,
            barMinHeight: 10,
            itemStyle: {
              color(params: any) {
                return barColor[params.name] || '#5470c6'
              },
              borderType: 'solid',
              borderRadius: [4, 4, 0, 0],
              // borderColor: '#fff'
            },
            stack: 'x'
          }
        }
        const historyItem = historyObj?.history[j]
        const level_id = letter.value[historyItem.level_id]

        groupData.series[j].data[i] = {
          name: level_id,
          value:
            historyObj?.history[j + 1]
              ? historyObj?.history[j + 1].enter_time - historyItem.enter_time
              : 30,
          contribute_rate: historyItem.contribute_rate,
          enter_time: historyItem.enter_time - props.startTime,
          pass_time: historyItem.pass_time
        }
      }
    } else {
      if (!groupData.series[0]) {
        groupData.series[0] = {
          data: [],
          type: 'bar',
          barGap: '20%',
          barCategoryGap: '30%',
          label: labelOption,
          itemStyle: {
            color(params: any) {
              return barColor[params.name] || '#5470c6'
            },
            borderType: 'solid',
            borderRadius: [4, 4, 0, 0],
            // borderColor: '#fff'
          },
          stack: 'x'
        }
      }
      groupData.series[0].data[i] = {
        value: 30,
        message: oneMember.message
          ? `请求报错：${oneMember.message}`
          : '暂无参团数据或数据报错'
      }
    }
  }
  return groupData
}

// 折线图
const showLineChart = (res: GroupItem) => {
  const lineTooltip = {
    trigger: 'axis',
    formatter(params: any) {
      let text = ''
      for (const item of params) {
        if (!item.data) return ''
        if (!text) text += `<p>${formatTime(item.axisValue)}</p>`
        if (item.data.message) {
          text += item.data.message
        } else {
          text += `<p style="color: ${item.color}">
            ${item.seriesName}：用时${item.data.pass_time}秒
            攻占${item.name}点，获得${contributeCompute(item.data.contribute_rate)}% 同调率
          </p>`
        }
      }
      return text
    }
  }

  const lineData: any = {
    // backgroundColor: '#fff',
    grid: chartGrid,
    // 30 色循环配色，成员超过 30 名时自动从头循环
    color: [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#e06343',
      '#37a354', '#b55cba', '#2c9f5e', '#c8506e', '#5b9bd5', '#7f7f7f', '#bc80bd', '#8dd3c7', '#bebada', '#fb8072',
      '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#ccebc5', '#ffed6f', '#a6cee3', '#1f78b4', '#33a02c'
    ],
    legend: {
      data: <string[]>[],
      top: '4%',
      textStyle: {
        color: '#1FC3CE',
        fontSize: 14
      }
    },
    tooltip: lineTooltip,
    xAxis: {
      type: 'value',
      name: '进点时间',
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '进攻点位',
      boundaryGap: false,
      splitLine: {
        show: true
      },
      alignTicks: true,
      splitNumber: 14,
      max: 11,
      axisLabel: {
        formatter(value: number) {
          let dataMap = []
          if (props.groupType === 'battle') {
            dataMap = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
          } else {
            dataMap = ['', '1', '2', '3', '4', '5', '6', '7']
          }
          return dataMap[value] || ''
        }
      }
    },
    series: <any>[],
    graphic: buildGraphic()
  }

  for (let i = 0; i < res.group.length; i++) {
    const peopleData = res.group[i]
    const historyObj = getGroupData(peopleData)
    lineData.legend.data[i] = peopleData.name

    // 初始化地图信息
    // getMapInfo(historyObj)
    emit('getMapInfo', historyObj)

    const line: any[] = []
    if (historyObj.history && historyObj?.history.length > 0) {
      for (const historyData of historyObj?.history) {
        const level_id = letter.value[historyData.level_id]
        let yValue = props.groupType === 'battle' ? level_id.charCodeAt(0) - 64 : Number(level_id)
        line.push({
          name: level_id,
          value: [historyData.enter_time - props.startTime, yValue],
          contribute_rate: historyData.contribute_rate,
          enter_time: historyData.enter_time - props.startTime,
          pass_time: historyData.pass_time
        })
      }
    }

    lineData.series[i] = {
      name: peopleData.name,
      type: 'line',
      data: line,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { width: 2.5 },
      areaStyle: { opacity: 0.12 },
      emphasis: { focus: 'series' }
    }
  }

  return lineData
}

// 点位热力图：X 轴为成员（名称过长时旋转展示），Y 轴为点位，颜色深浅代表该点位总同步率
const showHeatmapChart = (res: GroupItem) => {
  const members: string[] = []
  const points: string[] = []
  const heatData: [string, string, number][] = []

  for (const people of res.group) {
    const historyObj = getGroupData(people)
    const memberName = people.name || '成员占位'
    members.push(memberName)
    const history = historyObj?.history
    if (!history || !history.length) continue
    // 按点位聚合：该成员在每个点位的总同步率（contribute_rate 为十分比，展示统一除以 10）
    const rateMap: Record<string, number> = {}
    for (const h of history) {
      const lv = letter.value[h.level_id]
      if (!lv) continue
      rateMap[lv] = (rateMap[lv] || 0) + h.contribute_rate
    }
    for (const lv in rateMap) {
      if (!points.includes(lv)) points.push(lv)
      heatData.push([memberName, lv, contributeCompute(rateMap[lv])])
    }
  }

  const heatmapTooltip = {
    formatter(params: any) {
      if (!params.data) return ''
      return `${params.data[0]} 在 ${params.data[1]} 点，总同步率 ${params.data[2]}%`
    }
  }

  // 同步率为十分比换算后范围 0-10，max 取数据最大值上浮，保证色带对比明显
  const maxRate = Math.max(10, ...heatData.map((d) => d[2]))

  return {
    grid: chartGrid,
    tooltip: heatmapTooltip,
    xAxis: {
      type: 'category',
      name: '成员',
      data: members,
      splitArea: { show: true },
      axisLabel: { interval: 0, rotate: 45, fontSize: 11 }
    },
    yAxis: {
      type: 'category',
      name: '点位',
      data: points,
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: maxRate,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      text: ['同步率高', '低'],
      textStyle: { fontSize: 11 },
      inRange: { color: ['#d0e1f9', '#1e6fb9'] }
    },
    series: [{
      type: 'heatmap',
      data: heatData,
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 2,
        borderRadius: 4
      },
      label: {
        show: true,
        fontSize: 10,
        formatter: (params: any) => (params.data ? `${params.data[2]}%` : '')
      },
      emphasis: {
        itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.4)' }
      }
    }],
    graphic: buildGraphic()
  }
}

</script>

<style scoped lang="scss">
.box-card {
  margin-top: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chart-title {
    margin-bottom: 6px;
  }
}
</style>