import { ReactNode } from "react"

type ControlsGroupProps = {
  title: string
  children: ReactNode
}

export const ControlsGroup = ({ title, children }: ControlsGroupProps) => {
  return (
    <div className="controls__group">
      <div className="controls__group-title">{title}</div>
      <div className="controls__group-items">{children}</div>
    </div>
  )
}
