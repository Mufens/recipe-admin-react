# TagsView 组件优化日志

> 优化时间：2026-08-20
> 涉及文件：`src/layouts/TagsView/index.tsx`、`src/layouts/TagsView/index.scss`

---

## 一、优化前存在的问题

### 1. `DraggableTag` 未使用 `React.memo`

**问题描述**：`DraggableTag` 作为列表中的子组件，每次父组件 `TagsView` 因 `tags` 数组或 `offset` 变化重渲染时，所有标签都会重新执行 render，即使其 props 没有变化。

**影响**：拖拽时 `transform` 高频变化 → `TagsView` 重渲染 → 全部标签重渲染，标签数量多时性能损耗明显。

---

### 2. `handleDragEnd` 每次渲染创建新函数

**问题描述**：`handleDragEnd` 直接在组件体中定义（无 `useCallback`），每次渲染生成新引用传给 `DndContext`，导致 dnd-kit 内部做无效 diff。

```tsx
// 优化前
const handleDragEnd = ({ active, over }: DragEndEvent) => {
  if (!over || active.id === over.id) return
  const oldIndex = tags.findIndex((t) => t.path === active.id)
  // ...
}
```

**额外隐患**：内部通过闭包读取 `tags`，如果 `DndContext` 异步回调，`tags` 可能是陈旧值。

---

### 3. `style` 对象每次渲染重建

**问题描述**：`DraggableTag` 中的 `style` 对象在每次渲染时都是新引用，即使 `isDragging`、`transform`、`transition` 都没有变化，也会触发 React 的 DOM diff。

```tsx
// 优化前
const style: CSSProperties = {
  cursor: isDragging ? 'grabbing' : 'grab',
  // ...
}
```

---

### 4. `Dropdown` 的 `menu` 内联对象每次渲染重建

**问题描述**：`menu={{ items: [...] }}` 是内联字面量，每次渲染都创建新对象，触发 `Dropdown` 做不必要的浅比较更新。

---

### 5. `tags.map()` 每次渲染创建新数组

**问题描述**：`SortableContext` 的 `items={tags.map((t) => t.path)}` 每次渲染都生成新数组引用，dnd-kit 内部会重新计算排序位置。

---

### 6. `update` 函数未包裹 `useCallback`，闭包陈旧

**问题描述**：`update` 在组件体中直接定义，`useEffect(() => {...}, [])` 的空依赖数组只捕获首次渲染的 `update`。虽然内部调用的 `setScrollable`/`setOffset` 是稳定引用所以实际不会出 bug，但：
- ESLint `exhaustive-deps` 规则会报警告
- 如果未来 `update` 内部逻辑变更，可能引入难以排查的陈旧闭包 bug

```tsx
// 优化前
const update = () => { /* ... */ }
useEffect(() => {
  const ro = new ResizeObserver(update) // 捕获的是首次渲染的 update
  // ...
}, []) // ← ESLint 会警告缺少 update 依赖
```

---

### 7. `handlePrev` / `handleNext` 未包裹 `useCallback`

**问题描述**：与 `update` 同理，每次渲染创建新函数传给 `onClick`，导致箭头按钮不必要的重渲染。

---

### 8. `wrapRef` 声明但从未使用（死代码）

**问题描述**：

```tsx
const wrapRef = useRef<HTMLDivElement>(null)   // .tags-view__nav-wrap
```

该 ref 在整个组件中从未被读取或传递给子组件，属于无效代码。

---

### 9. `activeRef` 跨标签共享，模式脆弱

**问题描述**：所有 `DraggableTag` 都通过条件渲染挂载 `<span ref={activeRef}>`，依靠"只有一个 active 标签"来保证 ref 指向正确元素。

```tsx
// 优化前 - 每个标签都渲染此 span，只有 active 的那个实际挂载
{active && <span ref={activeRef} aria-hidden style={{ position: 'absolute', width: 0, overflow: 'hidden' }} />}
```

**风险**：
- 若出现两个 `active` 为 true 的标签（逻辑 bug），ref 指向不确定
- 需要 `__sortable` 设置 `position: relative` 来配合绝对定位的 span
- 在 `useEffect` 中通过 `activeEl.parentElement` 间接获取宽度，链路较长

---

### 10. SCSS 中 `position: relative` 仅为 `activeRef` span 服务

**问题描述**：`__sortable` 的 `position: relative` 是为了让内部绝对定位的 `activeRef` span 不溢出。移除 span 后此属性也不再需要。

---

## 二、具体改进措施

| # | 改进项 | 具体做法 |
|---|--------|----------|
| 1 | `memo` 包裹 `DraggableTag` | `memo()` 避免 props 不变时的无效重渲染 |
| 2 | `handleDragEnd` 用 `useCallback` + `getState()` | 稳定函数引用；通过 `useTagsStore.getState().tags` 读取最新 tags，彻底消除闭包陈旧风险 |
| 3 | `style` 用 `useMemo` 缓存 | 依赖 `[isDragging, transform, transition]`，非拖拽时不会重建 |
| 4 | `menuItems` 用 `useMemo` 缓存 | 依赖 `[tag.path, active, activeKey, ...]`，避免 Dropdown 无效 diff |
| 5 | `tagPaths` 用 `useMemo` 缓存 | `tags.map((t) => t.path)` 只在 `tags` 变化时重新计算 |
| 6 | `update` 用 `useCallback` 包裹 | 加入 `useEffect` 依赖数组，消除闭包陈旧隐患和 ESLint 警告 |
| 7 | `handlePrev`/`handleNext` 用 `useCallback` | 稳定引用，避免箭头按钮无效重渲染 |
| 8 | 删除 `wrapRef` | 移除未使用的 ref 声明 |
| 9 | 用 `data-active` 属性 + `querySelector` 替代 `activeRef` | 在 `__sortable` div 上设置 `data-active={active \|\| undefined}`，父组件通过 `listEl.querySelector('[data-active]')` 查找激活标签，逻辑更清晰、更健壮 |
| 10 | `navigate`/`drop` 回调提升到父组件 | 通过 `onNavigate`/`onDrop` props 传入子组件，避免每个子组件都调用 `useNavigate()`/`useAliveController()` |
| 11 | SCSS 移除 `position: relative` | `__sortable` 不再需要绝对定位子元素 |

---

## 三、优化效果对比

| 维度 | 优化前 | 优化后 |
|------|--------|--------|
| 拖拽时非拖拽标签重渲染 | 全部重渲染 | `memo` 跳过，仅拖拽标签更新 |
| `handleDragEnd` 引用稳定性 | 每次渲染新引用 | `useCallback` 稳定引用 |
| `style` 对象创建频率 | 每次渲染 | 仅拖拽状态/变换变化时 |
| `menu` 对象创建频率 | 每次渲染 | 仅依赖项变化时 |
| `SortableContext items` | 每次渲染新数组 | `useMemo` 缓存，仅 tags 变化时重建 |
| `ResizeObserver` 闭包 | 陈旧闭包（首次渲染） | 稳定 `useCallback` 引用 |
| ESLint 警告 | `exhaustive-deps` 告警 | 全部消除 |
| 死代码 | `wrapRef` 未使用 | 已清理 |
| `activeRef` 模式 | 多标签共享 ref，条件渲染控制 | `data-active` 属性查找，更健壮 |
| SCSS 冗余 | `position: relative` 为废弃 span 保留 | 已移除 |
