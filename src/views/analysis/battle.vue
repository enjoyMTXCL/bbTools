<template>
  <el-scrollbar v-loading="fullLoading">
    <div class="analysis-box">
      <el-row align="middle" justify="space-between">
        <el-col :lg="10" :xs="24">
          <div class="map-box">
            <div class="select-box">
              <el-select v-model="historyId" placeholder="请选择团战信息" @change="checkHistory" style="width: 300px;">
                <el-option v-for="item in historyArr" :key="item.value" :label="item.label" :value="item.value">
                </el-option>
              </el-select>
              <el-link type="primary" @click="downloadDataToExcel(historyId)" :icon="Download">下载团战数据</el-link>
            </div>
            <p class="map-name">
              {{ mapName }}<span v-if="battleTime" class="time">（{{ battleTime }}）</span>
              <span v-if="resultStatus == 1">胜利</span>
              <span v-else class="fail">失败</span>
            </p>
            <div class="square">
              <p class="red">{{ redSquare }}</p>
              <p>{{ blueSquare }}</p>
            </div>
            <img :src="mapUrl" alt="团战地图" style="width:100%;" v-show="mapUrl">
          </div>
        </el-col>
        <el-col :lg="13" :xs="24">
          <user-info :groupList="groupList" :historyId="historyId" :startTime="startTime" v-model="nowTabs" groupType="battle" @tabClick="tabClick" />
        </el-col>
      </el-row>
      <user-echart :groupList="groupList" :mapName="mapName" :historyId="historyId" :startTime="startTime"
      :redSquare="redSquare" :blueSquare="blueSquare" :battleTime="battleTime" groupType="battle"
      v-model="nowTabs" @tabClick="tabClick" @getMapInfo="getMapInfo" ref="userEchartRef" />
    </div>
  </el-scrollbar>

  <div class="fixed-bug" @click="solveTimeBug">起 始</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Download
} from "@element-plus/icons-vue";
import userInfo from '@/components/userInfo.vue';
import userEchart from '@/components/userEchart.vue';

import type { GroupItem, HistoryArrItem } from '@/types/analysis'
import { useAnalysis } from '@/composables/useAnalysis'
import { formatDateTime } from '@/utils/index'

// ========== 团战页独有状态 ==========
const historyId = ref();
const historyArr = ref<HistoryArrItem[]>([])

// 获取团战历史场次列表（类似获取地图信息，获取的是第一个角色的团战数据）
const getHistoryArr = (list: GroupItem[]) => {
  if (list && list.length > 0) {
    const historyObj = list[0].group[0]?.profile?.battle_info?.history || []
    for (let i = 0; i < historyObj.length; i++) {
      // endtime 为 22 点结束时间，减 2 小时统一显示 20 点开始时间
      const endtime = historyObj[i].endtime
      const time = formatDateTime(endtime ? endtime - 2 * 60 * 60 : undefined)
      const name = `${historyObj[i].name1} VS ${historyObj[i].name2}${time ? '（' + time + '）' : ''}`
      historyArr.value.push({
        label: name,
        value: i
      })
      if (historyId.value === undefined) {
        historyId.value = i
      }
    }
  }
}

// ========== 公共逻辑（含 onMounted 数据加载） ==========
const {
  groupList, mapUrl, mapName, resultStatus, redSquare, blueSquare, battleTime,
  startTime, fullLoading, nowTabs, userEchartRef,
  solveTimeBug, tabClick, getMapInfo, downloadDataToExcel
} = useAnalysis({
  onLoaded: getHistoryArr
})

// 切换历史场次
const checkHistory = () => {
  // 地图信息清空
  fullLoading.value = true
  mapUrl.value = ''
  mapName.value = ''
  resultStatus.value = ''
  redSquare.value = ''
  blueSquare.value = ''
  battleTime.value = ''
  userEchartRef.value.showChart()
  // 500ms后关闭loading，给用户一个视觉提示
  setTimeout(() => {
    fullLoading.value = false
  }, 500)
}
</script>

<style scoped lang="scss">
.analysis-box {
  margin: 16px 30px;

  .map-box {
    background-color: var(--color-background-soft);
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 5px;

    .select-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .map-name {
      font-weight: bold;
      margin: 12px 0 8px 5px;
      font-size: 16px;

      span {
        color: var(--el-color-success);

        &.fail {
          color: var(--el-color-danger);
        }

        &.time {
          color: var(--el-text-color-secondary);
          font-weight: 400;
          font-size: 12px;
        }
      }
    }

    .square {
      display: flex;
      gap: 16px;
      justify-content: space-between;
      width: 100%;
      padding: 0 20px;
      margin-bottom: 6px;
      font-size: 16px;
      p{
        color: #1D6FC8;
        &.red{
          color: #C81D1D;
        }
      }
    }
  }
}

.fixed-bug {
  position: fixed;
  bottom: 100px;
  right: 50px;
  background-color: var(--el-color-primary);
  color: #fff;
  width: 50px;
  height: 50px;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 50%;
}
</style>
