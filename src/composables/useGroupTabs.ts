import { computed } from 'vue'
import type { TabsPaneContext } from 'element-plus'
import type { PeopleData, BattleInfo, LevelInfo } from '@/types/analysis'
import { battleLetter, levelLetter } from '@/utils/index'

interface GroupTabsProps {
  groupType: string
  historyId: number
  modelValue: number
}

/**
 * userInfo / userEchart 公共逻辑：
 * 按 groupType（battle/level）取成员数据、点位字母映射、tabs 的 v-model 与点击事件转发。
 */
export function useGroupTabs(
  props: GroupTabsProps,
  emit: (event: 'tabClick' | 'update:modelValue', ...args: unknown[]) => void
) {
  // 无数据时的空数组占位在运行时返回，类型上统一为 BattleInfo / LevelInfo
  const getGroupData = (people: PeopleData): BattleInfo | LevelInfo => {
    if (props.groupType === 'battle') {
      return (people.profile?.battle_info?.history[props.historyId] || []) as BattleInfo
    } else {
      return (people.profile?.level_info || []) as LevelInfo
    }
  }

  const letter = computed(() => {
    if (props.groupType === 'battle') {
      return battleLetter
    } else {
      return levelLetter
    }
  })

  const nowTabs = computed({
    get: () => props.modelValue,
    set: val => {
      emit('update:modelValue', val)
    }
  })

  const tabClick = (tab: TabsPaneContext) => {
    emit('tabClick', tab)
  }

  return {
    getGroupData,
    letter,
    nowTabs,
    tabClick
  }
}
