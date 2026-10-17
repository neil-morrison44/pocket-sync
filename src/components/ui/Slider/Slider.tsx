import React, { ReactNode, useId } from "react"

import * as RadixSlider from "@radix-ui/react-slider"
import clsx from "clsx"

import "./Slider.css"

export interface SliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  /** Shown above the track, with the value at its end. */
  label: ReactNode
  /** How the value reads next to the label, e.g. "45°"; the number by default. */
  formatValue?: (value: number) => ReactNode
  disabled?: boolean
  className?: string
}

/**
 * A labelled range, e.g. a layer's scale: the label and value on top, a
 * track with a square thumb below. Arrow keys move it by `step`.
 */
const Slider = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  formatValue = (v) => v,
  disabled = false,
  className,
}: SliderProps) => {
  const labelId = useId()
  return (
    <div
      className={clsx("slider", disabled && "slider--is-disabled", className)}
    >
      <div className="slider__header">
        <span id={labelId}>{label}</span>
        <span className="slider__value">{formatValue(value)}</span>
      </div>
      <RadixSlider.Root
        className="slider__root"
        value={[value]}
        onValueChange={([next]) => onChange(next)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      >
        <RadixSlider.Track className="slider__track">
          <RadixSlider.Range className="slider__range" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className="slider__thumb"
          aria-labelledby={labelId}
        />
      </RadixSlider.Root>
    </div>
  )
}

export default React.memo(Slider)
