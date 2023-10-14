import { useRecoilState, useRecoilValue } from "recoil"
import { Modal } from "../../../modal"
import {
  platformListPocketSelector,
  platformsListMiSTerSelector,
} from "../recoil/selectors"
import {
  Dispatch,
  SetStateAction,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import "./index.css"
import { DEFAULT_MISTER_SAVE_MAPPING, saveMappingAtom } from "../recoil/atoms"

type SaveMappingProps = {
  onClose: () => void
}

export const SaveMapping = ({ onClose }: SaveMappingProps) => {
  const [joins, setJoins] = useRecoilState(saveMappingAtom)

  return (
    <Modal className="mister-sync__mapping">
      <Suspense>
        <div className="mister-sync__mapping-platform-list-header">
          <div>Pocket</div>
          <div>MiSTer</div>
        </div>
        <PlatformsList joins={joins} setJoins={setJoins} />
      </Suspense>
      <button onClick={() => setJoins(DEFAULT_MISTER_SAVE_MAPPING)}>
        Reset To Default
      </button>
      <button onClick={() => setJoins([])}>clear</button>
      <button onClick={onClose}>closed</button>
    </Modal>
  )
}

type SourceAndPlatform = {
  from: "MiSTer" | "Pocket"
  platform: string
}

type PlatformsListProps = {
  joins: { pocket: string; mister: string }[]
  setJoins: Dispatch<SetStateAction<{ pocket: string; mister: string }[]>>
}

const PlatformsList = ({ joins, setJoins }: PlatformsListProps) => {
  const misterPlatforms = useRecoilValue(platformsListMiSTerSelector)
  const pocketPlatforms = useRecoilValue(platformListPocketSelector)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const canvasMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const [newJoinOrigin, setNewJoinOrigin] = useState<SourceAndPlatform | null>(
    null
  )

  const hoveredRef = useRef<SourceAndPlatform | null>(null)

  const [pocketPositions, setPocketPositions] = useState<
    Record<string, number>
  >({})
  const [misterPositions, setMiSTerPositions] = useState<
    Record<string, number>
  >({})

  useLayoutEffect(() => {
    const setPositions = () => {
      const container = document.querySelector(
        ".mister-sync__mapping-platform-list"
      )
      const gridRect = container?.getBoundingClientRect()
      const startY = (gridRect?.y ?? 0) - (container?.scrollTop ?? 0)

      setPocketPositions(
        Object.fromEntries(
          Array.from(
            document.querySelectorAll(".mister-sync__mapping-platform--pocket")
          ).map((elem) => {
            const rect = elem.getBoundingClientRect()
            const y = rect.y + rect.height / 2 - startY
            return [elem.textContent, y]
          })
        )
      )

      setMiSTerPositions(
        Object.fromEntries(
          Array.from(
            document.querySelectorAll(".mister-sync__mapping-platform--mister")
          ).map((elem) => {
            const rect = elem.getBoundingClientRect()
            const y = rect.y + rect.height / 2 - startY
            return [elem.textContent, y]
          })
        )
      )
    }

    if (!canvasRef.current) return
    setPositions()
    const resizeObserver = new ResizeObserver(() => setPositions())
    resizeObserver.observe(canvasRef.current)

    return () => resizeObserver.disconnect()
  }, [joins])

  useEffect(() => {
    if (newJoinOrigin) {
      const handler = () => {
        if (
          canvasMousePosition.current.x < 15 &&
          newJoinOrigin.from === "MiSTer"
        ) {
          const y = canvasMousePosition.current.y
          const closestPlatform = [...pocketPlatforms].sort(
            (a, b) =>
              Math.abs(pocketPositions[a] - y) -
              Math.abs(pocketPositions[b] - y)
          )[0]

          setJoins((current) => [
            ...current,
            { pocket: closestPlatform, mister: newJoinOrigin.platform },
          ])
        }

        if (
          canvasMousePosition.current.x >
            (canvasRef.current?.width || 0) - 15 &&
          newJoinOrigin.from === "Pocket"
        ) {
          const y = canvasMousePosition.current.y
          const closestPlatform = [...misterPlatforms].sort(
            (a, b) =>
              Math.abs(misterPositions[a] - y) -
              Math.abs(misterPositions[b] - y)
          )[0]

          setJoins((current) => [
            ...current,
            { pocket: newJoinOrigin.platform, mister: closestPlatform },
          ])
        }

        setNewJoinOrigin(null)
      }

      window.addEventListener("mouseup", handler)
      window.addEventListener("mouseleave", handler)

      return () => {
        window.removeEventListener("mouseup", handler)
        window.removeEventListener("mouseleave", handler)
      }
    }
  }, [
    misterPlatforms,
    misterPositions,
    newJoinOrigin,
    pocketPlatforms,
    pocketPositions,
    setJoins,
  ])

  useLayoutEffect(() => {
    if (!canvasRef.current) return
    const cnv = canvasRef.current
    const handler = (event: MouseEvent) => {
      canvasMousePosition.current.x = event.offsetX
      canvasMousePosition.current.y = event.offsetY
    }

    cnv.addEventListener("mousemove", handler)
    return () => cnv.removeEventListener("mousemove", handler)
  }, [canvasRef])

  useLayoutEffect(() => {
    if (!canvasRef.current) return
    const cnv = canvasRef.current
    const rect = cnv.getBoundingClientRect()
    cnv.width = rect.width
    cnv.height = rect.height
    const abortController = new AbortController()

    const context = cnv.getContext("2d")
    if (!context) return

    const renderLoop = () => {
      context.clearRect(0, 0, cnv.width, cnv.height)

      // joins

      for (let index = 0; index < joins.length; index++) {
        const join = joins[index]
        context.save()
        context.beginPath()

        const sY = pocketPositions[join.pocket]
        context.moveTo(0, sY)

        let outlineStyle = "black"
        let innerStyle = "white"

        if (hoveredRef.current) {
          if (
            hoveredRef.current.platform !== join.pocket &&
            hoveredRef.current.platform !== join.mister
          ) {
            innerStyle = "rgba(255,255,255,0.1)"
            outlineStyle = "rgba(0,0,0,0.1)"
          }
        }

        if (newJoinOrigin) {
          innerStyle = "rgba(255,255,255,0.1)"
          outlineStyle = "rgba(0,0,0,0.1)"
        }

        const eY = misterPositions[join.mister]
        context.lineTo(cnv.width, eY)
        context.lineWidth = 5
        context.strokeStyle = outlineStyle
        context.stroke()

        context.strokeStyle = innerStyle
        context.lineWidth = 3
        context.stroke()

        context.restore()
      }

      context.strokeStyle = "white"
      // in progress join
      if (newJoinOrigin) {
        context.save()
        context.beginPath()
        const x = newJoinOrigin.from === "Pocket" ? 0 : cnv.width
        const y =
          newJoinOrigin.from === "Pocket"
            ? pocketPositions[newJoinOrigin.platform]
            : misterPositions[newJoinOrigin.platform]

        context.moveTo(x, y)
        context.lineTo(
          canvasMousePosition.current.x,
          canvasMousePosition.current.y
        )
        context.stroke()
        context.restore()
      }

      // draw dots

      context.fillStyle = "white"
      for (let index = 0; index < pocketPlatforms.length; index++) {
        const element = pocketPlatforms[index]

        const y = pocketPositions[element]
        context.beginPath()
        const size = element === newJoinOrigin?.platform ? 6 : 4
        context.arc(0, y, size, 0, 2 * Math.PI)
        context.fill()
      }

      for (let index = 0; index < misterPlatforms.length; index++) {
        const element = misterPlatforms[index]
        const y = misterPositions[element]
        context.beginPath()
        context.arc(cnv.width, y, 4, 0, 2 * Math.PI)
        context.fill()
      }

      context.strokeStyle = "white"
      context.lineWidth = 3

      if (!abortController.signal.aborted) requestAnimationFrame(renderLoop)
    }

    renderLoop()
    return () => abortController.abort()
  }, [
    canvasRef,
    misterPlatforms,
    newJoinOrigin,
    pocketPlatforms,
    joins,
    pocketPositions,
    misterPositions,
  ])

  const pl = pocketPlatforms.length
  const ml = misterPlatforms.length
  const pocketOffset = pl < ml * 0.75 ? Math.floor(ml / 2 - pl / 2) : 1

  const canvasSpacerRef = useRef<HTMLDivElement | null>(null)

  return (
    <div className="mister-sync__mapping-platform-list">
      {pocketPlatforms.map((platform, index) => (
        <div
          key={platform}
          className={`mister-sync__mapping-platform mister-sync__mapping-platform--pocket ${
            !newJoinOrigin || newJoinOrigin?.platform === platform
              ? ""
              : "mister-sync__mapping-platform--not-new-join"
          }`}
          style={{
            gridRow: index + pocketOffset,
          }}
          onMouseDown={() => setNewJoinOrigin({ from: "Pocket", platform })}
          onMouseEnter={() =>
            (hoveredRef.current = { from: "Pocket", platform })
          }
          onMouseLeave={() => (hoveredRef.current = null)}
        >
          {platform}
        </div>
      ))}
      {misterPlatforms.map((platform, index) => (
        <div
          key={platform}
          className={`mister-sync__mapping-platform mister-sync__mapping-platform--mister ${
            !newJoinOrigin || newJoinOrigin?.platform === platform
              ? ""
              : "mister-sync__mapping-platform--not-new-join"
          } `}
          style={{
            gridRow: index + 1,
          }}
          onMouseDown={() => setNewJoinOrigin({ from: "MiSTer", platform })}
          onMouseEnter={() =>
            (hoveredRef.current = { from: "MiSTer", platform })
          }
          onMouseLeave={() => (hoveredRef.current = null)}
        >
          {platform}
        </div>
      ))}
      <div
        ref={canvasSpacerRef}
        style={{
          position: "relative",
          gridColumn: 2,
          gridRow: `1 / ${
            Math.max(pocketPlatforms.length, misterPlatforms.length) + 1
          }`,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        ></canvas>
      </div>
    </div>
  )
}
