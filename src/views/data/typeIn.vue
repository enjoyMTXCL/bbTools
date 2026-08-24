<template>
  <el-scrollbar v-loading="fullLoading">
    <div class="home-box">
      <div class="title-box">
        <h2>米游社 cookie</h2>
        <el-tooltip class="box-item" content="输入从米游社获取的cookie，详情请查看帮助" placement="right">
          <el-icon size="18px" color='#f56c6c'><question-filled /></el-icon>
        </el-tooltip>
      </div>
      <el-row align="middle" style="margin-bottom: 60px;position: relative;">
        <el-col :span="22">
          <el-input v-model="cookie" clearable autosize :disabled="cookieDisabled" placeholder="请输入米游社cookie" />
          <div v-if="!cookieDisabled && cookieMissingFields.length" class="cookie-error-tip">
            <p v-for="field in cookieMissingFields" :key="field" class="cookie-error-line">
              <el-icon :size="13"><warning-filled /></el-icon>
              <span>缺少 {{ field }}（或 {{ field }}_v2），请使用完整 cookie，详见帮助</span>
            </p>
          </div>
        </el-col>
        <el-col :span="1" :offset="1">
          <el-icon :size="22" @click="cookieLock">
            <lock v-if="cookieDisabled" />
            <Unlock v-else />
          </el-icon>
        </el-col>
      </el-row>
      <!-- 空状态引导：还没有任何成员时展示使用步骤 -->
      <el-card v-if="!hasAnyPeople" shadow="never" class="guide-card">
        <template #header>
          <span class="guide-title">新手引导：三步完成数据录入</span>
        </template>
        <el-steps :active="3" align-center>
          <el-step title="填入 Cookie" description="在上方输入米游社完整 cookie（需含 ltoken 与 cookie_token），点击锁图标锁定" />
          <el-step title="添加成员" description="手动添加 / 批量粘贴 UID / 下载模板导入 Excel" />
          <el-step title="获取并保存" description="点击「获取数据」，等待完成后点「保存分组数据」，再前往图表分析" />
        </el-steps>
      </el-card>
      <div class="flex-between">
        <div class="title-box">
          <h2>分组信息 <span v-show="isModify" class="modify-tip">*</span></h2>
          <el-button type="primary" size='small' circle class="add-btn" @click="beforeAddGroup()"><el-icon
              style="font-size: 14px;">
              <plus />
            </el-icon></el-button>
        </div>
        <div>
          <el-input v-model="searchKeyword" clearable placeholder="搜索成员昵称 / UID" style="width: 200px;"
            class="search-input" />
          <el-link type="primary" class="down-template" @click="downloadTemplate" :icon="Download">下载成员名单模板</el-link>
          <el-button type="primary" @click="uploadExcel" :icon="Upload">导入成员信息
            <el-tooltip content="下载名单模板，然后按照帮助：二-4 填写信息并导入" placement="top">
              <el-icon size="18px" class="right-icon"><question-filled /></el-icon>
            </el-tooltip></el-button>
        </div>
      </div>
      <el-row :gutter="20">
        <el-col :lg="8" :xs="24" :sm="12" v-for="fg in filteredGroupList" :key="fg.origin">
          <div class="group-title">
            <div class="group-name">
              <h3>{{ fg.group.groupName }}</h3>
              <el-button type="primary" size="small" circle
                @click="editGroupName(fg.origin)"><el-icon><edit-pen /></el-icon></el-button>
            </div>
            <el-button type="danger" size="small" circle @click="deleteGroup(fg.origin, fg.group.groupName)"><el-icon>
                <Close />
              </el-icon></el-button>
          </div>
          <!-- 优化1：增加编辑分队和增加删除 -->
          <!-- <input type="text" class="my-input"> -->
          <el-scrollbar max-height="600px">
            <div class="list-group">
              <!-- 此处为表头 -->
              <div class="list-title">
                <el-row align="middle">
                  <el-col :span="2">
                    <p style="font-size: 12px;">移动</p>
                  </el-col>
                  <el-col :span="6">
                    <p>昵称</p>
                  </el-col>
                  <el-col :span="7">
                    <p>uid</p>
                  </el-col>
                  <el-col :span="2">
                    <p class="state">状态</p>
                  </el-col>
                  <el-col :span="7">
                    <p>操作</p>
                  </el-col>
                </el-row>
              </div>
              <draggable group="people" itemKey="uid" handle=".rank-col" @start="startDrag" @add="addDrag"
                :list="fg.group.group">
                <transition-group>
                  <template v-for="(element, index) in fg.group.group" :key="index">
                    <div v-if="element.hasEdit == 0">
                      <el-row align="middle" class="list-item">
                        <el-col :span="2" class="rank-col">
                          <el-icon>
                            <expand />
                          </el-icon>
                        </el-col>
                        <el-col :span="6">
                          <p>{{ element.name }}</p>
                        </el-col>
                        <el-col :span="7">
                          <p>{{ element.uid }}</p>
                        </el-col>
                        <el-col :span="2">
                          <p class="state" v-if="!element.profile && !element.message">未获取</p>
                          <p class="state" v-else-if="element.profile && !element.message">已获取</p>
                          <el-tooltip class="box-item" :content="element.message || '数据异常'" placement="top" v-else>
                            <el-icon color="#f56c6c" class="col-warning">
                              <warning />
                            </el-icon>
                          </el-tooltip>
                        </el-col>
                        <el-col :span="7" class="operation-btn">
                          <el-tooltip class="box-item" content="单独获取本成员数据" placement="top">
                            <el-icon @click="refreshPeople(element)" style="cursor: pointer">
                              <refresh />
                            </el-icon>
                          </el-tooltip>

                          <el-icon @click="editPeople(fg.origin, index)" style="cursor: pointer"><edit-pen /></el-icon>
                          <el-icon @click="deletePeople(fg.origin, index, element.name)"
                            style="cursor: pointer"><delete-filled /></el-icon>
                        </el-col>
                      </el-row>
                    </div>
                    <div v-else class="operation-box">
                      <el-row align="middle">
                        <el-col :span="2" class="rank-col">
                          <el-icon>
                            <expand />
                          </el-icon>
                        </el-col>
                        <el-col :span="6">
                          <input type="text" v-model="nowPeopleName" placeholder="请输入昵称" class="my-input">
                        </el-col>
                        <el-col :span="7">
                          <input type="number" v-model="nowPeopleUid" placeholder="请输入uid" class="my-input">
                        </el-col>
                        <el-col :span="2">
                          <p class="state">状态</p>
                        </el-col>
                        <el-col :span="7" class="operation-btn">
                          <el-button type="warning" size="small" @click="cancelEdit(fg.origin, index)">取消</el-button>
                          <el-button type="primary" size="small" @click="saveEdit(fg.origin, index)">保存</el-button>
                        </el-col>
                      </el-row>
                    </div>

                  </template>
                </transition-group>
              </draggable>
              <div class="add-box">
                <div class="list-add justify-center" v-if="fg.group.hasAdd == 0">
                  <el-button type="primary" @click="addPeople(fg.origin)"><el-icon class="el-icon--left">
                      <Plus />
                    </el-icon>添加成员</el-button>
                  <el-button type="success" plain @click="openBatchAdd(fg.origin)"><el-icon class="el-icon--left">
                      <DocumentAdd />
                    </el-icon>批量添加</el-button>
                </div>
                <div v-else class="operation-box">
                  <el-row align="middle">
                    <el-col :span="2" class="rank-col">
                    </el-col>
                    <el-col :span="6">
                      <input type="text" v-model="nowPeopleName" placeholder="请输入昵称" class="my-input">
                    </el-col>
                    <el-col :span="7">
                      <input type="number" v-model="nowPeopleUid" placeholder="请输入uid" class="my-input">
                    </el-col>
                    <el-col :span="2">
                      <p class="state">状态</p>
                    </el-col>
                    <el-col :span="7" class="operation-btn">
                      <el-button type="warning" size="small" @click="cancelAdd(fg.origin)">取消</el-button>
                      <el-button type="primary" size="small" @click="saveAdd(fg.origin)">保存</el-button>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </el-col>
      </el-row>

      <h2 style="margin-top: 50px;"> </h2>
      <el-button @click="getUserGroupData">获取数据</el-button>
      <el-button type="danger" plain v-if="hasFailedPeople" @click="retryFailedPeople"><el-icon class="el-icon--left">
          <Refresh />
        </el-icon>重试失败成员</el-button>
      <el-button type="primary" @click="saveGroupAndEditChart"><el-icon
          class="el-icon--left"><document-add /></el-icon>保存分组数据</el-button>
      <el-button type="warning" @click="clearGroupData"><el-icon class="el-icon--left">
          <Delete />
        </el-icon>清空已获取数据</el-button>
      <el-button @click="openBackupDialog"><el-icon class="el-icon--left">
          <Refresh />
        </el-icon>备份管理</el-button>
    </div>
    <!-- 批量添加成员对话框 -->
    <el-dialog v-model="batchAddDialogVisible" title="批量添加成员" width="520px" align-center>
      <el-input v-model="batchInput" type="textarea" :rows="10"
        placeholder="每行一个成员，支持格式：&#10;uid&#10;uid 昵称&#10;uid,昵称&#10;例如：&#10;123456789&#10;987654321 小明" />
      <p class="batch-tip">重复或格式错误的行会被跳过，并给出提示</p>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchAddDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmBatchAdd">添加</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- 备份管理对话框 -->
    <el-dialog v-model="backupDialogVisible" title="备份管理" width="560px" align-center>
      <p class="batch-tip">每次保存分组数据时自动生成备份，保留最近 20 份。点击「还原」可恢复历史数据，可手动删除不需要的备份。</p>
      <el-table :data="backupList" size="small" max-height="360">
        <el-table-column label="备份时间" min-width="200">
          <template #default="{ row }">
            {{ new Date(row.time).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="备份文件" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="130">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="restoreBackup(row.name)">还原</el-button>
            <el-button type="danger" link size="small" @click="removeBackup(row.name)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="backupDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- 离开页面确认对话框 -->
    <el-dialog v-model="showLeaveDialog" title="警告" width="410px" align-center>
      <p class="dialog-content">
        <el-icon size="24" class="dialog-icon">
          <WarningFilled />
        </el-icon>
        当前信息未保存，离开此页面将不做保存，是否离开？
      </p>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showLeaveDialog = false">取消</el-button>
          <el-button type="warning" @click="saveAndConfirm">保存并离开</el-button>
          <el-button type="primary" @click="confirmLeave">离开</el-button>
        </div>
      </template>
    </el-dialog>
  </el-scrollbar>
</template>

<script setup lang="ts">
/**
 * import 组件和库
 */
import { ref, onMounted, watch, computed } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { ElMessageBox, ElMessage, ElLoading } from 'element-plus';
import { getUserSingleData } from '@/utils/getData';
import type { ApiResult } from '@/utils/getData';
import type { PeopleData } from '@/types/analysis';
import { loadCookie, saveCookie } from '@/utils/cookieStorage';
import { loadData, saveData, listBackups, restoreData, deleteBackup } from '@/utils/dataStorage';
import loadExcel from '@/utils/loadExcel';

import {
  VueDraggableNext as draggable
} from 'vue-draggable-next'
import {
  Lock,
  Unlock,
  Upload,
  QuestionFilled,
  DocumentAdd,
  DeleteFilled,
  Download,
  Delete,
  EditPen,
  Plus,
  Close,
  Refresh,
  Expand,
  Warning,
  WarningFilled
} from "@element-plus/icons-vue";

/**
 * 定义响应式数据
 */
let serverName = '';
const groupList = ref([
  { groupName: '分队 1', hasAdd: 0, group: <any>[] },
  { groupName: '分队 2', hasAdd: 0, group: <any>[] },
  { groupName: '分队 3', hasAdd: 0, group: <any>[] },
]);

const isModify = ref(false);
const nowPeopleName = ref('');
const nowPeopleUid = ref();
const groupIndex = ref(-1);
const peopleIndex = ref(-1);

const cookieDisabled = ref(false);
const cookie = ref('');
const fullLoading = ref(false);

// cookie 完整性校验：必须同时包含 ltoken 与 cookie_token（子串匹配，兼容 v2/v3）
const cookieMissingFields = computed(() => {
  if (!cookie.value) return [];
  const missing = [];
  if (!cookie.value.includes('ltoken')) missing.push('ltoken');
  if (!cookie.value.includes('cookie_token')) missing.push('cookie_token');
  return missing;
});

const showLeaveDialog = ref(false);
let pendingNavigation: any = null;

/**
 * 生命周期钩子
 */
onMounted(() => {
  serverName = <any>window.localStorage.getItem('serverName');
  const cL = <any>window.localStorage.getItem('cookieLock');
  cookieDisabled.value = cL == 'true';
  // cookie 由主进程加密存储，异步加载（旧版 localStorage 明文 cookie 会自动迁移）
  loadCookie().then((c) => {
    if (c) cookie.value = c;
  });
  // 分组数据由主进程文件化存储（异步加载，旧 localStorage 数据自动迁移）
  loadData().then((d) => {
    if (d) {
      try {
        groupList.value = JSON.parse(d);
      } catch (error) {
        console.error('解析分组数据失败:', error);
      }
    }
    // 初始数据赋值完成后才开始监听用户修改，避免加载数据被误判为"已修改"
    watch(groupList, () => {
      isModify.value = true;
    }, { deep: true, immediate: false });
  });
});

onBeforeRouteLeave((to, from, next) => {
  if (!isModify.value) {
    next();
    return;
  }
  pendingNavigation = next;
  showLeaveDialog.value = true;
});

// 保存并离开页面
const saveAndConfirm = () => {
  showLeaveDialog.value = false;
  saveGroupAndEditChart();
  if (pendingNavigation) {
    pendingNavigation();
    pendingNavigation = null;
  }
}

// 确认离开页面
const confirmLeave = () => {
  showLeaveDialog.value = false;
  if (pendingNavigation) {
    pendingNavigation();
    pendingNavigation = null;
  }
};

/**
 * 方法逻辑
 */
// 保存groupList数据（写入主进程文件存储，自动备份）
const saveGroupAndEditChart = async () => {
  try {
    await saveData(JSON.stringify(groupList.value));
    isModify.value = false;
    ElMessage({ type: 'success', message: '保存成功' });
  } catch (error) {
    console.error('保存分组数据失败:', error);
    ElMessage({ type: 'error', message: `保存失败，${error}` });
  }
};

// 编辑分组名称
const editGroupName = (index: number) => {
  ElMessageBox.prompt('请输入要修改的分组名称', 'Tip', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })
    .then(({ value }) => {
      groupList.value[index].groupName = value;
    })
    .catch(() => {
      // 用户取消输入，无需处理
    });
};

// 删除分组
const deleteGroup = (index: number, groupName: string) => {
  ElMessageBox.confirm(`确认要删除分组：${groupName}吗？`, 'Warning', {
    title: '警告',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      groupList.value.splice(index, 1);
      ElMessage({ type: 'success', message: `已删除分组：${groupName}` });
    })
    .catch(() => {
      // 用户取消删除，无需处理
    });
};

// 添加分组
const beforeAddGroup = () => {
  ElMessageBox.prompt('请输入要添加的分组名称', 'Tip', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })
    .then(({ value }) => {
      if (value) {
        groupList.value.push({ groupName: value, hasAdd: 0, group: [] });
        ElMessage({ type: 'success', message: '添加分组成功' });
      }
    })
    .catch(() => {
      // 用户取消输入，无需处理
    });
};

// 还原上一操作状态
const restore = () => {
  if (groupIndex.value > -1) {
    if (peopleIndex.value > -1) {
      groupList.value[groupIndex.value].group[peopleIndex.value].hasEdit = 0;
    } else {
      groupList.value[groupIndex.value].hasAdd = 0;
    }
  }
};

const startDrag = () => {
  restore();
  groupIndex.value = -1;
  peopleIndex.value = -1;
};

const addDrag = () => {
  isModify.value = true;
};

const addPeople = (index: number) => {
  restore();
  groupIndex.value = index;
  peopleIndex.value = -1;
  nowPeopleName.value = '';
  nowPeopleUid.value = '';
  groupList.value[index].hasAdd = 1;
};

const cancelAdd = (index: number) => {
  groupList.value[index].hasAdd = 0;
};

// uid 校验与跨分组查重：返回错误信息字符串，空串表示通过
// excludeGroup/excludeIndex 用于编辑场景跳过成员自身
const validateUid = (uid: string, excludeGroup?: number, excludeIndex?: number): string => {
  if (!uid) return '成员uid不能为空';
  if (!/^\d+$/.test(uid)) return `uid「${uid}」格式不正确，应为纯数字`;
  for (let g = 0; g < groupList.value.length; g++) {
    for (let p = 0; p < groupList.value[g].group.length; p++) {
      if (String(groupList.value[g].group[p].uid) === uid) {
        if (excludeGroup === g && excludeIndex === p) continue;
        return `uid ${uid} 已存在于分组「${groupList.value[g].groupName}」的成员 ${groupList.value[g].group[p].name}`;
      }
    }
  }
  return '';
};

const saveAdd = (index: number) => {
  if (!nowPeopleName.value) {
    ElMessage({ type: 'error', message: '成员名不能为空' });
    return;
  }
  const uidErr = validateUid(String(nowPeopleUid.value));
  if (uidErr) {
    ElMessage({ type: 'error', message: uidErr });
    return;
  }
  groupList.value[index].group.push({
    name: nowPeopleName.value,
    uid: nowPeopleUid.value,
    hasEdit: 0,
  });
  groupList.value[index].hasAdd = 0;
  // isModify.value = true;
};

// 获取用户数据，refreshPeople和getUserGroupData两个方法使用，返回promise供getUserGroupData全量获取使用
const getUserData = (userData: PeopleData) => {
  return getUserSingleData({ uid: userData.uid, server: serverName }).then(
    (res: ApiResult) => {
      if (res && res.data && res.retcode == 0) {
        cookieDisabled.value = true;
        const singleData = res.data.profile;
        return singleData;
      } else {
        cookieDisabled.value = false;
        throw new Error(res.message || '获取数据失败');
      }
    }
  )
}

// 刷新单个用户数据
const refreshPeople = (
  userData: PeopleData
) => {
  if (!cookie.value) {
    ElMessage({ type: 'error', message: '请输入cookie' });
    return;
  }
  ElMessageBox.confirm(`确认要单独获取成员 ${userData.name} 的团战数据吗？`, 'Warning', {
    title: '确认',
    confirmButtonText: '获取',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      fullLoading.value = true;
      return getUserData(userData);
    })
    .then((res) => {
      fullLoading.value = false;
      userData.message = '';
      if (res) {
        userData.profile = res || null;
        ElMessage({ type: 'success', message: '获取成功' });
      }
    })
    .catch((error) => {
      fullLoading.value = false;
      userData.message = error.message;
      userData.profile = null;
      if (error !== 'cancel') {
        ElMessage({ type: 'error', message: error.message });
      }
    });
};

// 是否有获取失败的成员（用于显示"重试失败成员"按钮）
const hasFailedPeople = computed(() =>
  groupList.value.some((g) => g.group.some((p: PeopleData) => p.message))
);

// 分批并发获取成员数据（每批 5 个，避免触发服务器频率限制），返回成功/失败统计
const fetchPeopleBatch = async (targets: PeopleData[], prefix: string) => {
  const loading = ElLoading.service({
    lock: true,
    text: `${prefix} 0/${targets.length}...`,
    background: 'rgba(0, 0, 0, 0.7)'
  });
  let success = 0;
  let failed = 0;
  const failedNames: string[] = [];
  const CONCURRENCY = 5;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (pData) => {
      try {
        const res = await getUserData(pData);
        pData.message = '';
        pData.profile = res || null;
        success++;
      } catch (error) {
        pData.message = (error as Error)?.message || String(error);
        pData.profile = null;
        failed++;
        failedNames.push(pData.name);
      }
    }));
    const done = Math.min(i + CONCURRENCY, targets.length);
    loading.setText(`${prefix} ${done}/${targets.length}（成功 ${success} / 失败 ${failed}）`);
  }
  loading.close();
  return { success, failed, failedNames };
};

// 批量获取用户数据（跳过已有数据的成员）
const getUserGroupData = async () => {
  if (!cookie.value) {
    ElMessage({ type: 'error', message: '请输入cookie' });
    return;
  }
  let hasPeople = false;
  for (const g of groupList.value) {
    if (g.group.length) {
      hasPeople = true;
      break;
    }
  }
  if (!hasPeople) {
    ElMessage({ type: 'error', message: '请输入至少一个成员' });
    return;
  }
  // cookie 通过主进程加密保存（替代原先的 localStorage 明文存储）
  await saveCookie(cookie.value);
  // 只获取还没有数据的成员
  const targets: PeopleData[] = [];
  for (const gData of groupList.value) {
    for (const pData of gData.group) {
      if (!pData.profile) targets.push(pData);
    }
  }
  if (!targets.length) {
    ElMessage({ type: 'info', message: '所有成员都已有数据，无需重新获取' });
    return;
  }
  const { success, failed, failedNames } = await fetchPeopleBatch(targets, '正在获取');
  if (success > 0) cookieDisabled.value = true;
  if (failed > 0) {
    ElMessage({ type: 'warning', message: `获取完成：成功 ${success} 名，失败 ${failed} 名` });
    ElMessageBox.alert(
      `成功 ${success} 名，失败 ${failed} 名。\n失败成员：${failedNames.join('、')}\n可点击「重试失败成员」重新获取。`,
      '获取结果',
      { confirmButtonText: '知道了', type: 'warning' }
    ).catch(() => { });
  } else {
    ElMessage({ type: 'success', message: `获取成功：${success} 名成员，请保存后前往图表分析查看` });
  }
}

// 一键重试获取失败的成员
const retryFailedPeople = async () => {
  if (!cookie.value) {
    ElMessage({ type: 'error', message: '请输入cookie' });
    return;
  }
  const targets: PeopleData[] = [];
  for (const gData of groupList.value) {
    for (const pData of gData.group) {
      if (pData.message) targets.push(pData);
    }
  }
  if (!targets.length) {
    ElMessage({ type: 'info', message: '没有需要重试的成员' });
    return;
  }
  const { success, failed, failedNames } = await fetchPeopleBatch(targets, '正在重试');
  if (success > 0) cookieDisabled.value = true;
  if (failed > 0) {
    ElMessage({ type: 'warning', message: `重试完成：成功 ${success} 名，仍有 ${failed} 名失败` });
    ElMessageBox.alert(
      `成功 ${success} 名，仍有 ${failed} 名失败。\n失败成员：${failedNames.join('、')}`,
      '重试结果',
      { confirmButtonText: '知道了', type: 'warning' }
    ).catch(() => { });
  } else {
    ElMessage({ type: 'success', message: `重试成功：${success} 名成员已获取` });
  }
}

const editPeople = (index: number, people: number) => {
  restore();
  groupIndex.value = index;
  peopleIndex.value = people;
  nowPeopleName.value = groupList.value[index].group[people].name;
  nowPeopleUid.value = groupList.value[index].group[people].uid;
  groupList.value[index].group[people].hasEdit = 1;
};

const cancelEdit = (index: number, people: number) => {
  groupList.value[index].group[people].hasEdit = 0;
};

const saveEdit = (index: number, people: number) => {
  if (!nowPeopleName.value) {
    ElMessage({ type: 'error', message: '成员名不能为空' });
    return;
  }
  const uidErr = validateUid(String(nowPeopleUid.value), index, people);
  if (uidErr) {
    ElMessage({ type: 'error', message: uidErr });
    return;
  }
  const gp = groupList.value[index].group[people];
  gp.name = nowPeopleName.value;
  gp.uid = nowPeopleUid.value;
  gp.hasEdit = 0;
  gp.battle_info = null;
  gp.message = '';
  // isModify.value = true;
};

const deletePeople = (index: number, people: number, peopleName: string) => {
  ElMessageBox.confirm(`确认要删除成员：${peopleName}吗？`, 'Warning', {
    title: '警告',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      restore();
      groupList.value[index].group.splice(people, 1);
    })
    .catch(() => {
      // 用户取消删除，无需处理
    });
};

const cookieLock = () => {
  cookieDisabled.value = !cookieDisabled.value;
  window.localStorage.setItem('cookieLock', String(cookieDisabled.value));
  if (cookieDisabled.value) {
    // 锁定时将 cookie 保存到主进程加密存储
    saveCookie(cookie.value);
  }
};

// 清空已获取缓存数据
const clearGroupData = () => {
  ElMessageBox.confirm('确认要清空已获取的成员缓存数据吗？（清空后需重新请求获取）', 'Warning', {
    title: '警告',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      for (const gData of groupList.value) {
        for (const pData of gData.group) {
          pData.message = '';
          pData.profile = null;
        }
      }
      ElMessage({ type: 'success', message: '已清空全部成员缓存数据' });
    })
    .catch(() => {
      // 用户取消清空，无需处理
    });
};

// ========== 批量添加成员 ==========
const batchAddDialogVisible = ref(false);
const batchAddGroupIndex = ref(-1);
const batchInput = ref('');

const openBatchAdd = (index: number) => {
  batchAddGroupIndex.value = index;
  batchInput.value = '';
  batchAddDialogVisible.value = true;
};

const confirmBatchAdd = () => {
  const lines = batchInput.value.split(/[\n;；]+/).map((s) => s.trim()).filter(Boolean);
  if (!lines.length) {
    ElMessage({ type: 'error', message: '请输入至少一个UID' });
    return;
  }
  const target = groupList.value[batchAddGroupIndex.value];
  if (!target) return;
  let ok = 0;
  const errors: string[] = [];
  for (const line of lines) {
    // 支持格式：uid / uid 名字 / uid,名字 / uid<Tab>名字
    const parts = line.split(/[\s,，\t]+/).filter(Boolean);
    const uid = parts[0];
    const name = parts.slice(1).join(' ') || uid;
    if (!/^\d+$/.test(uid)) {
      errors.push(`「${line}」：uid 不是纯数字`);
      continue;
    }
    const uidErr = validateUid(uid);
    if (uidErr) {
      errors.push(uidErr);
      continue;
    }
    target.group.push({ name, uid: Number(uid), hasEdit: 0 });
    ok++;
  }
  batchAddDialogVisible.value = false;
  if (errors.length) {
    ElMessageBox.alert(errors.join('\n'), `添加完成：成功 ${ok} 名，失败 ${errors.length} 名（格式错误或重复）`, {
      confirmButtonText: '知道了',
      type: 'warning'
    }).catch(() => { });
  } else {
    ElMessage({ type: 'success', message: `已批量添加 ${ok} 名成员` });
  }
};

// ========== 备份管理 ==========
const backupDialogVisible = ref(false);
const backupList = ref<{ name: string; time: number }[]>([]);

const openBackupDialog = async () => {
  backupList.value = await listBackups();
  backupDialogVisible.value = true;
};

const restoreBackup = (name: string) => {
  ElMessageBox.confirm(`还原备份「${name}」？当前未保存的修改将被覆盖。`, 'Warning', {
    confirmButtonText: '还原',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      const data = await restoreData(name);
      if (!data) {
        ElMessage({ type: 'error', message: '备份读取失败' });
        return;
      }
      try {
        groupList.value = JSON.parse(data);
      } catch (error) {
        console.error('解析备份失败:', error);
        ElMessage({ type: 'error', message: '备份文件解析失败' });
        return;
      }
      isModify.value = true;
      ElMessage({ type: 'success', message: '已还原备份，请确认后保存' });
    })
    .catch(() => {
      // 用户取消还原
    });
};

// 删除指定备份
const removeBackup = (name: string) => {
  ElMessageBox.confirm(`确认删除备份「${name}」？删除后不可恢复。`, 'Warning', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      const ok = await deleteBackup(name);
      if (ok) {
        backupList.value = backupList.value.filter((b) => b.name !== name);
        ElMessage({ type: 'success', message: '备份已删除' });
      } else {
        ElMessage({ type: 'error', message: '备份删除失败' });
      }
    })
    .catch(() => {
      // 用户取消删除
    });
};

// ========== 成员搜索过滤 ==========
const searchKeyword = ref('');
// 过滤时保留分组原始索引，避免过滤后操作错位
const filteredGroupList = computed(() => {
  const kw = searchKeyword.value.trim();
  return groupList.value
    .map((g, origin) => ({
      group: kw
        ? { ...g, group: g.group.filter((p: PeopleData) => p.name.includes(kw) || String(p.uid).includes(kw)) }
        : g,
      origin
    }))
    .filter((fg) => !kw || fg.group.group.length > 0 || fg.group.groupName.includes(kw));
});

// ========== 空状态引导 ==========
const hasAnyPeople = computed(() => groupList.value.some((g) => g.group.length > 0));

// 上传
const uploadExcel = () => {
  fullLoading.value = true;
  loadExcel().then((res: any) => {
    fullLoading.value = false;
    // 用户取消选择文件：静默返回，不提示错误
    if (res === null || res === undefined) {
      return;
    }
    if (!res.length) {
      ElMessage({ type: 'error', message: '数据为空或不符要求' });
      return;
    }
    groupList.value = res;
  }).catch((error) => {
    console.error('导入 excel 失败:', error);
    fullLoading.value = false;
    ElMessage({ type: 'error', message: '上传失败' });
  });
};

// 下载模板
const downloadTemplate = () => {
  // 改为主进程下载
  window.ipcRenderer.send('downloadTemplateFile');
}
</script>
<style scoped lang="scss">
.home-box {
  padding: 20px 50px 10px;

  .guide-card {
    margin-bottom: 16px;

    .guide-title {
      font-weight: 500;
    }
  }

  .search-input {
    margin-right: 12px;
  }

  .batch-tip {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .cookie-error-tip {
    margin: 6px 0 0 2px;
    position: absolute;
    color: var(--el-color-danger);
    font-size: 12px;

    .cookie-error-line {
      display: flex;
      align-items: center;
      gap: 4px;
      line-height: 1.6;
    }
  }

  .flex-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .right-icon {
    margin-left: 4px;
  }

  .title-box {
    margin-bottom: 10px;
    display: flex;
    align-items: center;

    h2 {
      margin-right: 10px;
    }
  }

  .down-template {
    margin-right: 10px;
    margin-top: 12px;
  }

  .group-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    margin-top: 20px;
    margin-bottom: 10px;

    .group-name {
      display: flex;
      align-items: center;

      h3 {
        max-width: 220px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-right: 15px;
      }
    }
  }

  .list-group {
    display: flex;
    flex-direction: column;
    padding-left: 0;
    margin-bottom: 0;
    border-radius: 5px;

    .list-title {
      width: 100%;
      background: var(--color-background);

      .el-col {
        border: 1px solid var(--el-border-color);

        &+.el-col {
          border-left-width: 0;
        }

        p {
          height: 48px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;

          &.state {
            font-size: 12px;
          }
        }
      }
    }

    .list-item {
      background: var(--color-background);

      .rank-col {
        cursor: move;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .el-col {
        border: 1px solid var(--el-border-color);
        border-top-width: 0;
        min-height: 49px;

        &+.el-col {
          border-left-width: 0;
        }

        p {
          width: 100%;
          height: 49px;
          text-align: center;
          line-height: 49px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          &.state {
            font-size: 12px;
          }
        }
      }

    }

    .operation-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-around;
    }

    .operation-box {
      .el-col {
        border: 1px solid var(--el-border-color);
        border-top-width: 0;
        min-height: 50px;

        &+.el-col {
          border-left-width: 0;
        }

        input {
          margin-left: 5px;
          border: none;
          height: 48px;
          width: 93%;
          outline: none;
        }

        .state {
          width: 100%;
          height: 50px;
          text-align: center;
          line-height: 50px;
          white-space: nowrap;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .el-button+.el-button {
          margin-left: 6px;
        }
      }
    }
  }

  .modify-tip {
    color: #f56c6c;
  }

  .list-add {
    position: relative;
    display: block;
    background-color: var(--color-background);
    border: 1px solid var(--el-border-color);
    border-top-width: 0;
    height: 55px;
    align-items: center;
  }

  .add-box {
    .operation-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-around;
    }
  }

  .justify-center {
    display: flex;
    justify-content: center;
  }

  .fixed-width {
    width: 100px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .add-card {
    padding: 20px 0;
    text-align: center;

    .add-btn {
      margin: 35px auto 0;
    }
  }

  .col-warning {
    font-size: 20px;
    display: block;
    margin: 0 auto;
    height: 50px;
    line-height: 50px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .my-input {
    background: var(--color-background);
  }
}

.dialog-content {
  display: flex;
  align-items: center;
  gap: 12px;

  .dialog-icon {
    color: var(--el-color-warning);
  }
}
</style>
