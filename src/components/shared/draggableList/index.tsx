import {
  Children,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

type DraggableListProps = {
  children: ReactNode[]
  onMove: (startIndex: number, endIndex: number) => void
}

export const DraggableList = ({ children }: DraggableListProps) => {
  const wrappedChildren = Children.map(children, (child, index) => (
    <DragWrappper index={index}>{child}</DragWrappper>
  ))

  return <DndProvider backend={HTML5Backend}>{wrappedChildren}</DndProvider>
}

const DragWrappper = ({
  children,
  index,
}: {
  children: ReactNode
  index: number
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!ref.current) return

    ref.current.addEventListener("dragover", (ev) => {
      console.log("ref dragover")
    })

    ref.current.addEventListener("drop", (ev) => {
      console.log("ref drop")
    })
  })

  return (
    <div
      ref={ref}
      draggable
      onDragStart={(ev) => {
        console.log("onDragStart", index)
        ev.dataTransfer.setData("text/plain", `${index}`)
        ev.dataTransfer.dropEffect = "move"
      }}
      onDragEnd={(ev) => {
        console.log("onDragEnd", index)
        console.log({ ev })
      }}
      onDragOver={(ev) => {
        console.log("onDragOver", index)
        ev.preventDefault()
        ev.dataTransfer.dropEffect = "move"
      }}
      onDrop={(ev) => {
        console.log("onDrop", index)
        ev.preventDefault()
        // Get the id of the target and add the moved element to the target's DOM
        const data = ev.dataTransfer.getData("text/plain")
        console.log("drop data", data)
        // ev.target.appendChild(document.getElementById(data));
      }}
    >
      {children}
    </div>
  )
}
