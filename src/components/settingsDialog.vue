<template>
  <el-dialog v-model="visible" title="设置" width="760px" align-center class="settings-dialog">
    <!-- 外观 -->
    <el-card shadow="never" class="setting-card">
      <template #header><span class="card-title">外观</span></template>
      <div class="setting-item">
        <div class="setting-label">主题模式</div>
        <el-radio-group v-model="settings.themeMode">
          <el-radio-button value="light">浅色</el-radio-button>
          <el-radio-button value="dark">深色</el-radio-button>
          <el-radio-button value="auto">跟随系统</el-radio-button>
        </el-radio-group>
      </div>
    </el-card>

    <!-- 图表 -->
    <el-card shadow="never" class="setting-card">
      <template #header><span class="card-title">图表</span></template>
      <div class="setting-item">
        <div class="setting-label">图表水印</div>
        <el-switch v-model="settings.watermarkEnabled" />
        <span class="setting-desc">关闭后图表不再显示水印</span>
      </div>
      <div class="setting-item" v-if="settings.watermarkEnabled">
        <div class="setting-label">水印文字</div>
        <el-input v-model="settings.watermarkText" style="width: 320px" maxlength="30" show-word-limit />
      </div>
    </el-card>

    <!-- 错误日志 -->
    <el-card shadow="never" class="setting-card">
      <template #header><span class="card-title">错误日志</span></template>
      <p class="log-desc">
        成员数据获取出错时自动记录到日志文件（包含时间与失败原因）。日志文件超过 5M 时自动滚动，
        保留最近一份历史（error-old.log），方便排查问题。
      </p>
      <div class="setting-item">
        <el-button size="small" @click="onOpenDir">打开日志目录</el-button>
        <el-button size="small" type="primary" plain @click="onExport">导出日志</el-button>
      </div>
    </el-card>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onReset">恢复默认设置</el-button>
        <el-button type="primary" @click="visible = false">完成</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { settings, resetSettings } from '@/utils/settings'
import { openLogDir, exportLog } from '@/utils/logger'

const visible = ref(false)

// 供外部控制开关
defineExpose({ open: () => { visible.value = true } })

const onOpenDir = () => {
  openLogDir()
}

const onExport = async () => {
  const res = await exportLog()
  if (res.ok) {
    ElMessage({ type: 'success', message: '日志已导出' })
  } else if (!res.canceled) {
    ElMessage({ type: 'error', message: '日志导出失败' })
  }
}

const onReset = () => {
  ElMessageBox.confirm('确认恢复所有设置为默认值？', 'Warning', {
    confirmButtonText: '恢复默认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      resetSettings()
      ElMessage({ type: 'success', message: '已恢复默认设置' })
    })
    .catch(() => { })
}
</script>

<style scoped lang="scss">
/* 弹窗限高：不超出屏幕高度，内容在弹窗内滚动 */
:deep(.settings-dialog) {
  display: flex;
  flex-direction: column;
  max-height: 85vh;

  .el-dialog__body {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }
}

.setting-card {
  margin-bottom: 12px;

  .card-title {
    font-weight: 500;
  }

  .setting-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;

    &:last-child {
      margin-bottom: 0;
    }

    .setting-label {
      width: 140px;
      font-size: 14px;
      color: var(--el-text-color-primary);
      flex-shrink: 0;
    }

    .setting-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      max-width: 380px;
    }
  }

  .log-desc {
    font-size: 13px;
    color: var(--el-text-color-regular);
    margin-bottom: 12px;
    line-height: 1.7;
  }
}
</style>
