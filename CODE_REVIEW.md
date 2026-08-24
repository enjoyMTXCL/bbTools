# bbTools 项目代码审查报告

> 审查时间: 2026-08-24
> 项目: bb-tools v0.3.6 (Vue3 + Electron)
> 描述: 崩崩数据分析工具 — 米游社崩坏学园2团战/团本数据分析桌面应用

## 处理状态 (2026-08-24 已完成整改)

在**不更改原有功能与逻辑**的前提下，以下问题已修复并通过 `vue-tsc` 类型检查与 `vite build` 构建验证：

- ✅ #1 open-win IPC 已移除（渲染层无任何调用）
- ✅ #2 Cookie 改为主进程 safeStorage 加密存储（`src/utils/cookieStorage.ts`），旧版 localStorage 明文自动迁移
- ✅ #3 DS salt 抽离至 `electron/utils/config.ts` 集中管理
- ✅ #4 fs 假依赖已从 package.json 移除
- ✅ #6 #7 提取 `src/composables/useAnalysis.ts` 与 `useGroupTabs.ts`，消除重复代码
- ✅ #8 PeopleData 统一定义至 `src/types/analysis.ts`（含 ProfileData/ApiResult）
- ✅ #9 路由懒加载 + vite 显式 `base: './'`（保证 file:// 下分包可加载）
- ✅ #10 mergeConfigs/getGroupData/getBB 等核心函数补齐类型
- ✅ #11 空 catch 补充注释（用户取消）或 console.error（真实错误）
- ✅ #12 saveFile 的 `new Promise(async executor)` 反模式已修复
- ✅ #13 `setTimeout(fn, 1)` 改为 `await nextTick()`
- ✅ #14 批量获取成员数据增加并发限制（每批 5 个）
- ✅ #18 移除 axios/lodash/md5（md5 改用 Node 内置 crypto），显式声明 @vueuse/core
- ✅ #19 CHANGELOG 已补充本轮改动记录
- ✅ #20 main.ts/typeIn.vue 注释残留代码已清理，新增 `.prettierrc.json`
- ⏸ #5 Vuex→Pinia：需先安装 pinia 依赖（`pnpm i pinia`），暂保留 Vuex
- ⏸ #15 groupList deep watch：替换为手动标记需覆盖全部变更入口，回归风险高，保持现状
- ⏸ #16 ESLint：需安装依赖并逐项校验，建议后续单独处理
- ⏸ #17 单元测试：建议后续为 ds.ts / mergeConfigs / handleExcelData 补充 vitest 用例

## 审查范围

全量阅读了以下文件:
- `package.json`, `vite.config.ts`, `electron-builder.json5`, `tsconfig.json`, `tsconfig.node.json`
- `electron/` 下全部 7 个 TS 文件 (main/preload/api/utils)
- `src/` 下全部 35 个文件 (10 .vue + 9 .ts + 2 .css + 图片资源)
- `CHANGELOG.md`, `UNIAPP_MIGRATION.md`, `index.html`

## 改进点汇总 (按优先级)

### P0 安全问题 (4项)

| # | 问题 | 文件位置 | 风险 |
|---|------|---------|------|
| 1 | open-win IPC 创建窗口时 nodeIntegration:true + contextIsolation:false | electron/main/index.ts:156-170 | 任意脚本可执行系统命令 |
| 2 | Cookie 明文存储在 localStorage | src/views/data/typeIn.vue:280 | 凭据泄露 |
| 3 | DS salt 硬编码在源码 | electron/utils/ds.ts:31 | 密钥暴露 |
| 4 | fs 假依赖包 (0.0.1-security) 在 dependencies | package.json:47 | 无用打包风险 |

### P1 架构与代码组织 (5项)

| # | 问题 | 文件位置 | 影响 |
|---|------|---------|------|
| 5 | 使用 Vuex 而非 Pinia (Vuex 已进入维护模式) | src/store/index.ts | 技术债 |
| 6 | battle.vue 与 level.vue 代码重复约 80% | src/views/analysis/ | 维护成本翻倍 |
| 7 | userInfo.vue 与 userEchart.vue 重复逻辑 (getGroupData/letter/nowTabs) | src/components/ | 同上 |
| 8 | PeopleData 类型定义冲突 (types/analysis.ts vs utils/getData.ts) | 两处 | 类型安全失效 |
| 9 | 路由全量静态导入，无懒加载 | src/router/index.ts:2-6 | 首屏加载慢 |

### P2 代码质量 (3项)

| # | 问题 | 典型位置 | 影响 |
|---|------|---------|------|
| 10 | 大量 any 类型 (store mutations, mergeConfigs, chartData 等) | 全局 | TS 类型安全形同虚设 |
| 11 | 错误静默吞没 (.catch(() => {})) | typeIn.vue:348,364,380,588; layout.vue:108 | 排查困难 |
| 12 | new Promise(async executor) 反模式 | electron/utils/index.ts:229 | 异常不可捕获 |

### P2 性能优化 (3项)

| # | 问题 | 文件位置 | 影响 |
|---|------|---------|------|
| 13 | setTimeout(fn, 1) 替代 nextTick 处理状态时序 | userEchart.vue:98 | 潜在竞态条件 |
| 14 | 批量获取数据无并发限制 (Promise.all 全量并发) | typeIn.vue:519-533 | 触发 API 频率限制 |
| 15 | deep watch 大对象 (groupList 含完整 profile) | typeIn.vue:289-291 | 遍历开销大 |

### P3 工程化与清理 (5项)

| # | 问题 | 说明 |
|---|------|------|
| 16 | 无 ESLint/Prettier 配置 | 代码风格无保障 |
| 17 | 无测试框架 | ds.ts/mergeConfigs 等纯逻辑适合单测 |
| 18 | 未使用依赖: axios(用fetch), lodash(仅用divide), md5(可用crypto) | 增加 bundle 体积 |
| 19 | CHANGELOG.md 停更于 2022 年 | 版本 0.3.6 无记录 |
| 20 | 冗余文件: vite.config.flat.txt, 注释代码块 | 代码整洁度 |

## 建议改进顺序

1. P0 安全修复 (删 fs 依赖、修 open-win、cookie 加密) — 快速高收益
2. 提取 composable 消除 battle/level 重复 — 代码量减半
3. 统一类型定义 — 让 TS 真正发挥作用
4. 加 ESLint 清理 console.log 和空 catch — 提升基线
5. setTimeout -> nextTick, Promise 并发限制 — 性能优化
