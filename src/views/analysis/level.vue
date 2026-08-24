<template>
  <el-scrollbar v-loading="fullLoading">
    <div class="analysis-box">
      <el-row align="middle" justify="space-between">
        <el-col :lg="10" :xs="24">
          <div class="map-box">
            <div class="select-box">
              <p>{{ mapName }}<span v-if="battleTime" class="time">（{{ battleTime }}）</span></p>
              <el-link type="primary" @click="downloadDataToExcel()" :icon="Download">下载团本数据</el-link>
            </div>
            <img :src="mapUrl" alt="团本地图" style="width:100%;" v-show="mapUrl">
          </div>
        </el-col>
        <el-col :lg="13" :xs="24">
          <user-info :groupList="groupList" :startTime="startTime" v-model="nowTabs" groupType="level" @tabClick="tabClick" />
        </el-col>
      </el-row>
      <user-echart :groupList="groupList" :mapName="mapName" :startTime="startTime" :battleTime="battleTime" groupType="level"
      v-model="nowTabs" @tabClick="tabClick" @getMapInfo="getMapInfo" ref="userEchartRef" />
    </div>
  </el-scrollbar>

  <div class="fixed-bug" @click="solveTimeBug">起 始</div>
</template>

<script setup lang="ts">
import {
  Download
} from "@element-plus/icons-vue";
import userInfo from '@/components/userInfo.vue';
import userEchart from '@/components/userEchart.vue';

import { useAnalysis } from '@/composables/useAnalysis'

// ========== 公共逻辑（含 onMounted 数据加载） ==========
const {
  groupList, mapUrl, mapName, battleTime, startTime, fullLoading, nowTabs, userEchartRef,
  solveTimeBug, tabClick, getMapInfo, downloadDataToExcel
} = useAnalysis()
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
      margin-bottom: 10px;
      padding: 0 4px;
      p{
        font-weight: bold;

        .time {
          color: var(--el-text-color-secondary);
          font-weight: 400;
          font-size: 12px;
        }
      }
    }

    .map-name {
      font-weight: bold;
      margin-bottom: 8px;

      span {
        color: var(--el-color-success);

        &.fail {
          color: var(--el-color-danger);
        }
      }
    }

    .square {
      display: flex;
      gap: 16px;
      justify-content: space-between;
      width: 100%;
      padding: 0 20px;
      margin-bottom: 4px;
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
