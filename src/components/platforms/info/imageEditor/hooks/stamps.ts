import { open, OpenDialogOptions } from "@tauri-apps/plugin-dialog"
import { readFile } from "@tauri-apps/plugin-fs"
import { Dispatch, RefObject, SetStateAction, useCallback } from "react"
import { useEffect } from "react"
import { ImageInfo } from "../types"

export const useSetCurrentImageAsStamp = (
  imageStamps: ImageInfo[],
  currentImageSrc: string,
  setImageStamps: Dispatch<SetStateAction<ImageInfo[]>>
) => {
  useEffect(() => {
    ;(async () => {
      if (imageStamps.length !== 0) return
      const image = new Image()
      image.src = currentImageSrc
      await new Promise((resolve) => (image.onload = resolve))

      setImageStamps([
        {
          x: 0,
          y: 0,
          src: currentImageSrc,
          scale: 1,
          rotate: 0,
          image,
        },
      ])
    })()
  }, [setImageStamps, currentImageSrc, imageStamps.length])
}

export const useCanvasToDragStamps = (
  canvasRef: RefObject<HTMLCanvasElement>,
  setImageStamps: Dispatch<SetStateAction<ImageInfo[]>>,
  selectedStampIndex: number
) => {
  useEffect(() => {
    if (!canvasRef.current) return
    let mouseDown = false

    canvasRef.current.onmousedown = () => (mouseDown = true)
    canvasRef.current.onmouseup = () => (mouseDown = false)
    canvasRef.current.onmouseout = () => (mouseDown = false)

    canvasRef.current.onmousemove = (e) => {
      if (!mouseDown) return

      setImageStamps((stamps) => {
        const stamp = stamps[selectedStampIndex]
        const currentIndex = stamps.findIndex((i) => i === stamp)
        const updated = {
          ...stamp,
          x: stamp.x + e.movementX,
          y: stamp.y + e.movementY,
        }

        const newStamps = [...stamps]
        newStamps.splice(currentIndex, 1, updated)
        return newStamps
      })
    }
  }, [selectedStampIndex, setImageStamps, canvasRef])
}

export const useRenderStamps = (
  canvasRef: RefObject<HTMLCanvasElement>,
  width: number,
  height: number,
  imageStamps: ImageInfo[]
) => {
  useEffect(() => {
    if (!canvasRef.current) return
    const context = canvasRef.current.getContext("2d")
    if (!context) return

    context.fillStyle = "white"
    context.fillRect(0, 0, width, height)

    const reversed = [...imageStamps].reverse()

    context.globalCompositeOperation = "luminosity"

    reversed.forEach((i) => {
      context.save()
      const { image, scale, x, y, rotate } = i

      context.translate(width / 2 + x, height / 2 + y)
      context.rotate(rotate * (Math.PI / 180))
      context.translate(-(width / 2 + x), -(height / 2 + y))

      const xPos = width / 2 + x - (image.width / 2) * scale
      const yPos = height / 2 + y - (image.height / 2) * scale

      // the image is 1px less wide than it should be and I don't know why

      context.drawImage(
        i.image,
        Math.floor(xPos),
        Math.floor(yPos),
        image.width * scale,
        image.height * scale
      )
      context.restore()
    })
  }, [canvasRef, height, imageStamps, width])
}

export const useUpdateImageStampValuesCallback = (
  setImageStamps: Dispatch<SetStateAction<ImageInfo[]>>
) =>
  useCallback(
    (stamp: ImageInfo, updates: Partial<ImageInfo>) => {
      setImageStamps((stamps) => {
        const currentIndex = stamps.findIndex((i) => i === stamp)
        const updated = { ...stamp, ...updates }

        const newStamps = [...stamps]
        newStamps.splice(currentIndex, 1, updated)
        return newStamps
      })
    },
    [setImageStamps]
  )

export const useAddNewImageCallback = (
  setImageStamps: Dispatch<SetStateAction<ImageInfo[]>>
) =>
  useCallback(async () => {
    const options: OpenDialogOptions = {
      multiple: false,
      filters: [
        {
          name: "Image",
          extensions: ["png", "jpeg", "jpg"],
        },
      ],
    }
    const imageOpen = await open(options)

    if (!imageOpen?.path) return

    const imagePath = imageOpen?.path

    if (!imagePath || Array.isArray(imagePath)) return

    const imageData = await readFile(imagePath)

    const [name] = imagePath.split("/").reverse()
    const file = new File([imageData], name)

    const url = await URL.createObjectURL(file)
    const image = new Image()
    image.src = url
    await new Promise((resolve) => (image.onload = resolve))

    setImageStamps((stamps) => {
      return [
        {
          x: 0,
          y: 0,
          src: url,
          scale: 1,
          rotate: 0,
          image: image,
        },
        ...stamps,
      ]
    })
  }, [setImageStamps])

export const useMoveStampCallback = (
  setImageStamps: Dispatch<SetStateAction<ImageInfo[]>>,
  setSelectedStampIndex: Dispatch<SetStateAction<number>>
) =>
  useCallback(
    (stamp: ImageInfo, move: -1 | 1) => {
      setImageStamps((stamps) => {
        const currentIndex = stamps.findIndex((s) => s === stamp)
        const newStamps = stamps.filter((s) => s !== stamp)
        newStamps.splice(currentIndex + move, 0, stamp)
        return newStamps
      })

      setSelectedStampIndex((i) => i + move)
    },
    [setImageStamps, setSelectedStampIndex]
  )
