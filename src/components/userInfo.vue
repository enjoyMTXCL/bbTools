<template>
  <el-tabs type="border-card" v-model="nowTabs" @tab-click="tabClick">
    <el-tab-pane :label="item.groupName" :name="gIndex" v-for="(item, gIndex) in groupList" :key="gIndex"
      v-if="groupList && groupList.length > 0">
      <div class="view-switch">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button value="detail">成员详情</el-radio-button>
          <el-radio-button value="rank">贡献排名</el-radio-button>
        </el-radio-group>
      </div>
      <el-tabs tab-position="left" style="height: 350px;" v-if="item.group && item.group.length > 0 && viewMode === 'detail'"
        :stretch="false">        <el-tab-pane v-for="(people, pIndex) in item.group" :key="pIndex">
          <template #label>
            <p v-if="people" class="fixed-width">{{ people.name }}</p>
            <el-tooltip v-else class="box-item" content="此位置有成员但未获取数据" placement="top">
              <p class="fixed-width">成员占位 <el-icon><question-filled /></el-icon></p>
            </el-tooltip>
          </template>
          <el-scrollbar height="350px">
            <p v-for="(battle, bIndex) in getGroupData(people)?.history" :key="bIndex"
              v-if="people && getGroupData(people).history && getGroupData(people).history.length > 0">
              在{{ formatTime(battle.enter_time - startTime) }}进入了{{ letter[battle.level_id] }}点，
              通关时间{{ battle.pass_time }}秒，贡献了{{ contributeCompute(battle.contribute_rate) }}%同步率
            </p>
            <p v-else-if="people && people.message">{{`请求报错：${people.message}`}}</p>
            <p
              v-else>
              暂无参团数据或数据报错
            </p>
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
      <el-table v-if="viewMode === 'rank' && item.group && item.group.length > 0" :data="rankData" size="small" max-height="350" stripe>
        <el-table-column type="index" label="排名" width="60" />
        <el-table-column prop="name" label="昵称" min-width="110" show-overflow-tooltip />
        <el-table-column prop="count" label="打点数" width="80" sortable />
        <el-table-column prop="totalRate" label="总同步率" width="100" sortable />
        <el-table-column prop="avgRate" label="平均同步率" width="100" sortable />
        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">
            <span v-if="row.message" style="color: var(--el-color-danger)">{{ row.message }}</span>
            <span v-else-if="!row.hasData" style="color: var(--el-text-color-secondary)">暂无数据</span>
            <span v-else style="color: var(--el-color-success)">已获取</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="viewMode === 'rank'" description="暂无本分组数据" style="height:350px;" />
      <el-empty v-if="viewMode === 'detail' && (!item.group || item.group.length === 0)" description="暂无本分组数据" style="height:350px;" />
    </el-tab-pane>
    <el-empty description="请前往数据管理添加用户数据" v-else style="height:350px;" />
  </el-tabs>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import { GroupItem } from '@/types/analysis'
import { formatTime, contributeCompute } from '@/utils/index'
import { useGroupTabs } from '@/composables/useGroupTabs'

const props = defineProps({
  groupList: {
    type: Array as () => GroupItem[],
    default: () => []
  },
  historyId: {
    type: Number,
    default: 0
  },
  startTime: {
    type: Number,
    default: 0
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

const emit = defineEmits(['tabClick', 'update:modelValue'])

const { getGroupData, letter, nowTabs, tabClick } = useGroupTabs(props, emit)

// 成员详情 / 贡献排名 视图切换
const viewMode = ref<'detail' | 'rank'>('detail')

// 当前分组按总同步率降序的成员排名
const rankData = computed(() => {
  const group = props.groupList?.[nowTabs.value]
  if (!group) return []
  return group.group
    .map((people) => {
      const history = getGroupData(people)?.history || []
      // contribute_rate 为十分比（如 50 = 5%），展示时统一除以 10 并保留 1 位小数
      const totalRaw = history.reduce((sum, h) => sum + h.contribute_rate, 0)
      const round1 = (n: number) => Math.round(n * 10) / 10
      return {
        name: people.name,
        count: history.length,
        totalRate: round1(totalRaw / 10),
        avgRate: history.length ? round1(totalRaw / history.length / 10) : 0,
        message: people.message || '',
        hasData: history.length > 0
      }
    })
    .sort((a, b) => b.totalRate - a.totalRate)
})
</script>

<style scoped lang="scss">
.view-switch {
  margin-bottom: 8px;
}
</style>
