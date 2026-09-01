import {
  DownOutlined,
  RedoOutlined,
  SearchOutlined,
  UpOutlined,
} from '@ant-design/icons'
import { Button, Form, type FormProps } from 'antd'
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import './index.scss'

const ROW_H = 46

export type QueryFilterProps = Omit<FormProps, 'layout' | 'onReset'> & {
  children?: ReactNode
  /** 收起时露出的行数，默认 1 */
  row?: number
  /** fixed：展开为浮层；push：撑开下方内容 */
  type?: 'fixed' | 'push'
  /** 按钮垂直位置：top 贴右上；bottom 贴右下（多行/展开时） */
  searchPosition?: 'top' | 'bottom'
  /** 查询后是否自动收起，默认 true */
  searchClose?: boolean
  /** 标签宽，默认 100 */
  labelWidth?: number
  /** 控件宽，默认 230 */
  itemWidth?: number
  onReset?: () => void
}

function applyMaskRect(
  mask: HTMLElement,
  rect: { top: number; left: number; width: number; height: number } | null,
) {
  if (!rect) {
    mask.style.display = 'none'
    return
  }
  mask.style.display = ''
  mask.style.top = `${rect.top}px`
  mask.style.left = `${rect.left}px`
  mask.style.width = `${rect.width}px`
  mask.style.height = `${rect.height}px`
}

export default function QueryFilter({
  row = 1,
  type = 'fixed',
  searchPosition = 'bottom',
  searchClose = true,
  labelWidth = 100,
  itemWidth = 230,
  children,
  className,
  onReset,
  onFinish,
  style,
  ...formProps
}: QueryFilterProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const maskRef = useRef<HTMLButtonElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflow, setOverflow] = useState(false)

  const visibleRows = Math.max(1, row)
  const collapsedH = visibleRows * ROW_H
  const open = expanded && overflow
  const isOverlay = type === 'fixed' && open
  const actionsBottom =
    open || (searchPosition === 'bottom' && visibleRows > 1)

  useLayoutEffect(() => {
    const el = optionsRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const next = el.scrollHeight > collapsedH + 1
      setOverflow(next)
      if (!next) setExpanded(false)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [collapsedH, children])

  useLayoutEffect(() => {
    if (!isOverlay) return

    const update = () => {
      const mask = maskRef.current
      const root = rootRef.current
      if (!mask || !root) return
      const panel = root.querySelector<HTMLElement>('.query-filter__panel')
      const content = root.closest('.basic-layout__content')
      const contentRect = content?.getBoundingClientRect()
      const panelRect = panel?.getBoundingClientRect()
      if (!contentRect || !panelRect) {
        applyMaskRect(mask, null)
        return
      }
      const top = panelRect.bottom
      const height = contentRect.bottom - top
      if (height <= 0) {
        applyMaskRect(mask, null)
        return
      }
      applyMaskRect(mask, {
        top,
        left: contentRect.left,
        width: contentRect.width,
        height,
      })
    }

    update()
    const root = rootRef.current
    const content = root?.closest('.basic-layout__content')
    const panel = root?.querySelector('.query-filter__panel')
    const ro = panel ? new ResizeObserver(update) : null
    if (panel) ro?.observe(panel)
    window.addEventListener('resize', update)
    content?.addEventListener('scroll', update)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', update)
      content?.removeEventListener('scroll', update)
    }
  }, [isOverlay])

  const handleFinish: FormProps['onFinish'] = (values) => {
    onFinish?.(values)
    if (searchClose) setExpanded(false)
  }

  const vars = {
    '--qf-row-h': `${ROW_H}px`,
    '--qf-collapsed-h': `${collapsedH}px`,
    '--qf-label-w': `${labelWidth}px`,
    '--qf-item-w': `${itemWidth}px`,
  } as CSSProperties

  return (
    <div
      ref={rootRef}
      className={[
        'query-filter',
        open ? 'is-open' : '',
        isOverlay ? 'is-overlay' : '',
        type === 'push' && open ? 'is-push' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...vars, ...style }}
    >
      {isOverlay ? (
        <button
          ref={maskRef}
          type="button"
          className="query-filter__mask"
          aria-label="收起搜索"
          onClick={() => setExpanded(false)}
        />
      ) : null}
      <Form
        {...formProps}
        layout="inline"
        labelAlign="right"
        colon
        className="query-filter__panel"
        onFinish={handleFinish}
      >
        <div ref={optionsRef} className="query-filter__options">
          {children}
        </div>
        <div
          className={[
            'query-filter__right',
            actionsBottom ? 'is-bottom' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {overflow ? (
            <Button
              htmlType="button"
              className="query-filter__toggle"
              onClick={() => setExpanded((v) => !v)}
            >
              <span className="query-filter__toggle-inner">
                {open ? '收起' : '展开'}
                {open ? <UpOutlined /> : <DownOutlined />}
              </span>
            </Button>
          ) : null}
          <Button htmlType="button" icon={<RedoOutlined />} onClick={onReset}>
            重置
          </Button>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            查询
          </Button>
        </div>
      </Form>
    </div>
  )
}
