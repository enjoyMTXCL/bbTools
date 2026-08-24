# Changelog

## 2026-08-24（未发布）

代码质量与安全改进，功能与逻辑不变：

- 安全：移除 `open-win` IPC（未使用且关闭了 contextIsolation）；cookie 改由主进程 safeStorage 加密存储（自动迁移旧版 localStorage 明文）；DS salt 抽离至 `electron/utils/config.ts` 集中管理；移除 `fs` 占位假依赖包
- 重构：提取 `useAnalysis` / `useGroupTabs` composable，消除团战/团本分析页与图表组件间约 80% 的重复代码；统一 `PeopleData` 类型定义至 `src/types/analysis.ts`
- 质量：修复 `new Promise(async executor)` 反模式；空 catch 补充注释与错误日志；`setTimeout(fn, 1)` 改为 `nextTick`
- 性能：路由改为懒加载；批量获取成员数据增加并发限制（每批 5 个），避免触发接口频率限制
- 依赖：移除未使用的 axios / lodash / md5（md5 改用 Node 内置 crypto）；显式声明实际使用的 @vueuse/core
- 清理：删除 main.ts / typeIn.vue 中的注释残留代码；新增 `.prettierrc.json`

## 2022-10-03

[v2.1.0](https://github.com/electron-vite/electron-vite-vue/pull/267)

- `vite-electron-plugin` is Fast, and WYSIWYG. 🌱
- last-commit: db2e830 v2.1.0: use `vite-electron-plugin` instead `vite-plugin-electron`

## 2022-06-04

[v2.0.0](https://github.com/electron-vite/electron-vite-vue/pull/156)

- 🖖 Based on the `vue-ts` template created by `npm create vite`, integrate `vite-plugin-electron`
- ⚡️ More simplify, is in line with Vite project structure
- last-commit: a15028a (HEAD -> main) feat: hoist `process.env`

## 2022-01-30

[v1.0.0](https://github.com/electron-vite/electron-vite-vue/releases/tag/v1.0.0)

- ⚡️ Main、Renderer、preload, all built with vite

## 2022-01-27
- Refactor the scripts part.
- Remove `configs` directory.

## 2021-11-11
- Refactor the project. Use vite.config.ts build `Main-process`, `Preload-script` and `Renderer-process` alternative rollup.
- Scenic `Vue>=3.2.13`, `@vue/compiler-sfc` is no longer necessary.
- If you prefer Rollup, Use rollup branch.

```bash
Error: @vitejs/plugin-vue requires vue (>=3.2.13) or @vue/compiler-sfc to be present in the dependency tree.
```
