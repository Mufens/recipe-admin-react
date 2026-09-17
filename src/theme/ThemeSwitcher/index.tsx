import { Button, ColorPicker, Popover, Tooltip } from 'antd'
import {
  forwardRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useThemeStore } from '@/store/theme'
import { themePresets } from '../presets'
import './index.scss'

type SwatchItemProps = {
  label: string
  color: string
  active: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>

const SwatchItem = forwardRef<HTMLButtonElement, SwatchItemProps>(
  function SwatchItem({ label, color, active, className, style, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={`theme-switcher__item${active ? ' is-active' : ''}${className ? ` ${className}` : ''}`}
        aria-label={label}
        aria-pressed={active}
        style={
          {
            '--swatch-color': color,
            ...style,
          } as CSSProperties
        }
        {...rest}
      >
        <span className="theme-switcher__swatch">
          <span
            className="theme-switcher__swatch-color"
            style={{ background: color }}
          />
        </span>
        <span className="theme-switcher__label">{label}</span>
      </button>
    )
  },
)

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const themeKey = useThemeStore((s) => s.themeKey)
  const customColor = useThemeStore((s) => s.customColor)
  const setPreset = useThemeStore((s) => s.setPreset)
  const setCustom = useThemeStore((s) => s.setCustom)

  const panel: ReactNode = (
    <div className="theme-switcher__list">
      {themePresets.map((preset) => (
        <SwatchItem
          key={preset.key}
          label={preset.label}
          color={preset.colorPrimary}
          active={preset.key === themeKey}
          onClick={() => setPreset(preset.key)}
        />
      ))}

      <ColorPicker
        value={customColor}
        open={pickerOpen}
        onOpenChange={(next) => {
          setPickerOpen(next)
          if (next) setCustom()
        }}
        onChangeComplete={(color) => setCustom(color.toHexString())}
        arrow={false}
        placement="bottomRight"
        getPopupContainer={(node) => node.parentElement ?? document.body}
      >
        <SwatchItem
          label="自定义"
          color={customColor}
          active={themeKey === 'custom'}
        />
      </ColorPicker>
    </div>
  )

  return (
    <Popover
      content={panel}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      open={open}
      onOpenChange={(next) => {
        if (!next && pickerOpen) return
        setOpen(next)
      }}
    >
      <Tooltip title="主题" open={open ? false : undefined}>
        <Button
          type="text"
          className={open ? 'is-active' : undefined}
          icon={<span className="theme-switcher__icon" aria-hidden />}
          aria-label="切换主题"
          aria-expanded={open}
        />
      </Tooltip>
    </Popover>
  )
}
