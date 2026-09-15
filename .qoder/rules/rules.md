# recipe-admin-react 工程规范与评审清单

> 面向：人工 CR / AI 生成与改码约束  
> 原则：规范必须与仓库现状一致；新增约定先落地代码再写进本文档  
> 目标：可阅读、可维护、健壮、性能合理、工程规范、业务表达清晰、可测试、可迭代

## 技术栈（以 `package.json` 为准）

| 层级 | 选型 |
| --- | --- |
| 运行时 | React 19 + TypeScript + Vite 8 + pnpm |
| 路由 | React Router DOM 7（`BrowserRouter` + `useRoutes`） |
| UI | Ant Design 6 + `@ant-design/icons` + SCSS（就近 `index.scss`） |
| 请求 | Axios（`@/utils/request.ts`） |
| 服务端状态 | TanStack React Query 5（`@/utils/queryClient.ts`） |
| 客户端状态 | Zustand（目前仅 TagsView：`@/store/tags.ts`） |
| 表单 | **Ant Design Form**（当前页面统一写法） |
| 保活 | react-activation（TagsView + `KeepAlive`） |
| 拖拽 | `@dnd-kit`（TagsView 排序、TableToolbar 列设置） |
| 工程 | ESLint + Prettier + Husky + lint-staged |

说明：`react-hook-form` / `zod` 已在依赖中但业务页尚未采用；**新增表单默认跟现有 Antd Form**。若引入 RHF+Zod，需整页迁移并同步更新本文档，禁止同一功能混用两套方案。

后端联调：开发态由 Vite 代理 `/api` → `http://localhost:3002`（见 `vite.config.ts`），业务代码不写死后端域名。尚无 `.env` / `VITE_*` 时，不要虚构环境变量用法。

---

## 0. 目录与模块边界（可阅读 / 可维护）

```
src/
  api/           # 跨页面共享接口（如 category）
  components/    # 跨页面通用 UI（SmartTable、TableToolbar、PageToolbar）
  hooks/         # 跨页面 hooks（如 useCategoryTree）
  layouts/       # BasicLayout、TagsView
  pages/         # 业务页；子目录含 index.tsx + index.scss + api.ts + model.ts
  router/        # 路由树与标签元信息
  store/         # Zustand（仅客户端全局 UI，如页签）
  utils/         # 纯工具 + request / queryClient
```

| 检查项 | 规范要求 | 反面示例 |
| --- | --- | --- |
| 包管理 | 只用 pnpm；禁止提交 `package-lock.json` / `yarn.lock` | 混用 npm/yarn 并提交锁文件 |
| 路径别名 | 跨目录导入用 `@/`；同目录可用 `./` | `import x from '../../../utils/x'` |
| 页面模块 | 列表/详情/新增等功能页：`index.tsx` + `api.ts` + `model.ts` + `index.scss` 同目录 | 类型、请求、样式散落无约定 |
| 接口归属 | **页面私有接口**放该页 `api.ts`；**多页复用**才进 `@/api` | 全部接口硬塞 `@/api`，或页面内直接 `axios.get` |
| 组件归属 | 仅跨页复用进 `@/components`；单页弹窗/区块放该页 `components/` | 业务弹窗扔进全局 components |
| 常量 | 魔法值先就近抽到同目录或 `utils`；出现跨页再考虑 `config/`（目录未建则先别空建） | 到处写死 `status === 1` |
| 样式 | BEM 风格块名（如 `home-page__search`）；Ant 控件宽度等可用少量 inline；禁止用 inline 堆布局与主题色 | 整页 `style={{}}` 堆砌 |
| 滚动条 | 全局滚动条与虚拟列表滚动条样式维护在 `src/index.scss`，不各自为政 | 每个下拉复制一套 scrollbar CSS |

---

## 1. TypeScript（健壮 / 可维护）

| 检查项 | 规范要求 | 反面示例 |
| --- | --- | --- |
| `any` | 尽量不用；边界用 `unknown` 再收窄 | `const res: any = await fetch...` |
| 领域类型 | 列表项、详情、表单、请求参数写在页面 `model.ts`（或共享 `api` 旁） | 组件内隐式 `any` / 解构无类型 |
| Props | 显式 `interface` / `type`；慎用 `!` | `user!.name` 掩盖空值 |
| 请求泛型 | `request.post<T>` / `useQuery` 结果类型与 `model` 对齐 | 调用方当 `unknown` 硬猜字段 |
| 枚举语义 | 业务模式用字面量联合 + `as const`（如 `SearchMode = 'exact' \| 'fuzzy'`） | 字符串散落各处 |

---

## 2. React 组件与状态分层（可阅读 / 性能）

| 检查项 | 规范要求 | 反面示例 |
| --- | --- | --- |
| 组件形态 | 函数组件 + `.tsx`；页面/通用组件 **default export**（与现仓库一致）；hooks **named export** | 小驼峰组件名；hooks 默认导出 |
| Hooks 规则 | 禁止在条件/循环中调用 Hook | `if (x) useQuery(...)` |
| 状态分层 | 服务端数据 → React Query；页签等跨页 UI → Zustand；筛选草稿/弹窗显隐 → `useState` | 列表接口结果塞进 Zustand |
| 列表筛选 | 「输入态」与「已生效查询态」分离（如 `keywordInput` / `keyword`），点查询再写入 queryKey | 输入框 onChange 直接打接口无防抖/无提交语义 |
| 性能 | 列配置等稳定引用可用 `useMemo`；**禁止默认包一层 useMemo/useCallback**「预防优化」 | 每个回调都 useCallback |
| 副作用 | 定时器、订阅、Abort 必须清理 | `setInterval` 无 clear |
| 边界 UI | loading / 无数据 / 错误用 Spin、Empty、Result 等表达 | `list[0].title` 无保护 |
| DOM | 优先组件 API；避免 `document.querySelector` 驱动业务 | 组件内大量直操 DOM |

---

## 3. 路由与 TagsView / KeepAlive（健壮 / 业务表达）

| 检查项 | 规范要求 | 反面示例 |
| --- | --- | --- |
| 路由配置 | 集中在 `src/router/index.tsx` + `routes.ts`；页面内不散落 `<Routes>` | 页面里再挂一套 Routes |
| 跳转 | `useNavigate` / `<Link>`；详情用查询参数 `/recipe/detail?id=`（与现实现一致） | `window.location.href`；随意改成 `/recipe/detail/:id` 却不改 TagsView |
| 保活范围 | 仅 TagsView 体系内页面包 `KeepAlive`，不全局乱包 | 所有路由无脑 KeepAlive |
| 缓存键契约 | **`KeepAlive` 的 `name` 必须等于页签 `path`**；详情为 `` `/recipe/detail?id=${id}` `` | name 与 path 不一致导致关标签清不掉缓存 |
| 关标签 | 删 Zustand 标签同时 `drop(path)` 清缓存 | 只删标签不 drop，或 path 拼错 |
| 表格保活 | 列表用 `SmartTable`；激活后需重算布局时走已有 `useActivate` 模式 | 保活恢复后高度错乱却硬改 DOM |

---

## 4. 请求层：Axios + React Query（健壮 / 可迭代）

| 检查项 | 规范要求 | 反面示例 |
| --- | --- | --- |
| 实例 | 只用 `@/utils/request.ts`；成功 `code === 200` 解包 `result`；Blob 等无 `code` 原样返回 | 页面 `new axios`；当响应仍是 `{ code, result }` 再解一层 |
| 错误提示 | 网络错误默认 toast；可用 `errToast: false` 关闭；业务 `code !== 200` 当前为 `reject`（调用方按需提示） | 静默失败或重复 toast |
| 查询 | 读数据用 `useQuery`；queryKey 含全部筛选维度（含分页、食材模式等） | `useEffect` + 手写请求拉列表 |
| 变更 | 写操作优先 `useMutation`，成功后 `invalidateQueries`；若暂用手写 `await`，须自管 loading/错误且成功后刷新相关 query | 创建成功不刷新列表缓存 |
| 缓存策略 | 默认跟随 `queryClient`（`staleTime` 1min，不因切窗 refetch）；共享数据可提高 `staleTime`（如分类树） | 每次挂载狂打分类接口 |
| 竞态 | 列表查询把 `signal` 传给 request；不业务侧到处手写 Abort 除非有特殊需求 | 每个输入框自己 AbortController 一团 |

### 菜谱列表业务约定（业务表达）

| 能力 | 约定 |
| --- | --- |
| 菜谱名称 `keyword` | **始终模糊**：同义词扩展 + 标题/食材联合命中；**不做**精确/模糊 UI 切换 |
| 食材筛选 | 支持 `ingredientMode`: `exact` \| `fuzzy`；模式控件与 Select 内嵌（`Space.Compact`），勿再拆独立「匹配模式」表单项冒充名称搜索 |
| 同义词 | 前后端词典需同步维护（前端 `utils/searchSynonyms.ts`，后端 `food-serve/utils/searchSynonyms.js`）；改一侧必须改另一侧 |
| 导出 | 导出参数与当前**已生效**筛选一致，不要只用输入框草稿态 |

---

## 5. 表单（可维护 / 健壮）

| 检查项 | 规范要求 | 反面示例 |
| --- | --- | --- |
| 方案 | 新增/编辑页用 `Form.useForm` + `Form.Item` / `Form.List` + `rules` | 每个字段独立 `useState` 拼提交体 |
| 提交 | `validateFields` 通过后再请求；按钮 `loading` 绑定提交中状态 | 未校验直接 post；可连点多次提交 |
| 动态项 | 食材/步骤等用 `Form.List`，与后端字段结构在 `model.ts` 对齐 | 提交前手动 map 一堆无类型对象 |
| 未来 RHF | 仅在明确重构时引入，禁止同一页 Antd Form 与 RHF 混用 | 半页 Form、半页 useForm |

---

## 6. Ant Design 与表格（可阅读 / 性能）

| 检查项 | 规范要求 | 反面示例 |
| --- | --- | --- |
| 导入 | `antd` 按需具名导入；图标从 `@ant-design/icons` | `import * as Antd from 'antd'` |
| 列表页 | 优先 `SmartTable` + `TableToolbar`（刷新 / 列设置 / 全屏）；列类型用 `SmartColumn` | 再引入与 antd6 不兼容的 ProTable 方案 |
| 列定义 | 列配置抽 `useMemo` 或常量；拖拽列设置走现有 `@dnd-kit` 封装 | 手写拖拽；列 render 内请求接口 |
| 空态/加载 | 用 Table/`loading`、Result、Empty | 自制转圈与空文案不统一 |
| 弹窗 | 复杂弹窗独立组件，控制单文件体量 | 单文件 Modal 内堆上千行 JSX |

---

## 7. Zustand（可维护）

| 检查项 | 规范要求 | 反面示例 |
| --- | --- | --- |
| 用途 | 仅跨页客户端 UI（页签列表等） | 把菜谱列表、详情塞进 store |
| 选择器 | `useTagsStore(s => s.xxx)` 精细订阅 | `useTagsStore()` 取整个 state 导致无关渲染 |
| 拆分 | 新全局 UI 能力新文件，不堆进无关 store | 单一上帝 store |

---

## 8. Hooks / Utils（可测试 / 可迭代）

| 检查项 | 规范要求 | 反面示例 |
| --- | --- | --- |
| 自定义 Hook | `use` 前缀；复用请求/订阅逻辑；有副作用必须清理 | 多页复制同一段 query + toast |
| Utils | **纯函数、无 UI、无请求**（请求放 `api.ts`）；便于日后单测 | `utils` 里调 axios 又改 DOM |
| 职责 | 函数单一职责；复杂 handler 拆「组参 / 请求 / 副作用」 | 一个 `handleOk` 里校验+请求+跳转+改十个 state |
| 分支 | 早 return；映射表优于深层 if-else | 嵌套超过三层仍继续堆 |

### 可测试（当前无测试框架时的底线）

仓库尚未接入 Vitest/Jest。在引入之前：

1. 业务规则优先落在 **纯函数**（如难度色值、同义词扩展、媒体 URL 解析），避免写死在 JSX。
2. 请求与 UI 分离：`api.ts` / `model.ts` 不依赖 React。
3. 引入测试时优先覆盖：`utils/*`、同义词、`model` 类型边界；再补关键用户流。  
   **未接入测试跑通前，不要在 MR 中声称「已有单测规范」。**

---

## 9. 工程化（工程规范）

| 检查项 | 规范要求 | 反面示例 |
| --- | --- | --- |
| 格式 | ESLint + Prettier（singleQuote、无分号等以仓库配置为准） | 提交纯格式噪声 diff |
| 钩子 | Husky + lint-staged；不默认 `--no-verify` | 为过钩子跳过检查留下错误 |
| 关闭规则 | 禁止文件级 `/* eslint-disable */`；行级关闭须注释原因 | 文件头一刀切 disable |
| 提交内容 | 不提交 `console` 调试、大段注释废代码、无关锁文件 | TSX 里大段注释掉的旧实现 |
| 提交说明 | 中文、说清「为什么」；类型：功能 / 修复 / 重构 / 样式 / 文档 | `update` / `fix` 无语义 |

---

## 10. 健壮性与安全

| 检查项 | 规范要求 | 反面示例 |
| --- | --- | --- |
| 空值 | 可选链、空数组兜底（`data ?? []`） | `data.items.map` 不判空 |
| XSS | 原则上不用 `dangerouslySetInnerHTML`；必须时先消毒并注释风险 | 直接渲染用户 HTML |
| 重复提交 | 按钮 loading / mutation pending | 可连点创建多个菜谱 |
| 鉴权 | token 注入在 `request` 拦截器统一做（现状为 TODO）；页面不各自拼 Header | 每个 api 函数手写 Authorization |
| 媒体 | 封面等走 `resolveMediaUrl` / `imageProps`，不假设本地 `/static` 可用 | 硬拼错误 CDN 路径 |

---

## 11. 可迭代约定

1. **先对齐现有模式再扩展**：新列表页抄 `Home/list`（Query + SmartTable + 筛选双态）；新表单页抄 `Home/add`（Antd Form）。
2. **规则与代码同步**：改架构（路由形态、表单方案、请求解包）必须改本文档，避免文档漂移。
3. **小步 MR**：一页一类改动；不把「重构 + 新功能 + 样式」捆成一个提交。
4. **删除与依赖**：移除功能时删净空目录与死代码；长期不用的依赖应从 `package.json` 移除或明确「计划采用」并立项。
5. **占位页**（如 `Access`、`Table`）不作为范例引用。

---

## AI 生成 / 改码约束（粘贴用）

```
你必须遵守 recipe-admin-react 现行规范（以仓库代码为准，勿按过时文档臆造）：

技术栈：React19 + TS + Vite8 + pnpm；React Router（BrowserRouter + useRoutes）；Ant Design6 + SCSS；
Axios（@/utils/request.ts，code===200 解包 result）；TanStack Query5；Zustand 仅页签等客户端 UI；
表单用 Ant Design Form；保活 react-activation（KeepAlive name === 页签 path）；拖拽用现有 @dnd-kit 封装。

目录：页面私有逻辑放 pages/<Feature>/{index,api,model,index.scss}；跨页 API 才进 @/api；跨页组件才进 @/components。
列表：useQuery + queryKey 含全部已生效筛选；写操作优先 useMutation + invalidateQueries。
菜谱名称搜索始终模糊，不要加精确/模糊切换；食材筛选可用 exact/fuzzy。
导入用 @/；少 any；处理 loading/空/错；对象用 ?.；样式以 SCSS 为主。
不要把接口数据放进 Zustand；不要输出大段废弃注释和 console；不要引入与 antd6 冲突的 Pro 表格方案。
KeepAlive/TagsView：详情缓存键为 /recipe/detail?id=xxx，关标签必须 drop 同名缓存。
```
