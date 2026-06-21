import * as THREE from "three"
import { useAtom, useAtomValue, useSetAtom, useStore } from "jotai"
import {
  PlatformImageSelectorFamily,
  platformsListSelector,
} from "../../../recoil/platforms/selectors"
import { useCallback, useEffect, useState } from "react"
import { platformModalPositionAtom } from "../../../recoil/platforms/atoms"
import { useAtomCallback } from "jotai/utils"

const COLUMN_COUNT = 16
const ROW_COUNT = 15

export const usePlatformTextureAtlas = (): THREE.Texture => {
  const platforms = useAtomValue(platformsListSelector)
  // Initialize with a blank texture so the materials don't crash while loading
  const [texture, setTexture] = useState(() => new THREE.Texture())
  const store = useStore()

  useEffect(() => {
    const ab = new AbortController()

    const createAtlas = async (signal: AbortSignal) => {
      const canvas = new OffscreenCanvas(2048, 1024)
      const context = canvas.getContext("2d")
      if (!context) return

      let row = 0
      let column = 0

      for (const p of platforms) {
        if (signal.aborted) return

        try {
          const platformImageUrl = await store.get(
            PlatformImageSelectorFamily(p)
          )

          const image = await new Promise<HTMLImageElement>(
            (resolve, reject) => {
              const i = new Image()
              i.crossOrigin = "anonymous" // Crucial for WebGL canvas textures
              i.onload = () => resolve(i)
              i.onerror = (e) => reject(e)
              i.src = platformImageUrl
            }
          )

          if (signal.aborted) return

          const width = 2048 / COLUMN_COUNT
          const height = 1024 / ROW_COUNT
          context.drawImage(image, width * column, height * row, width, height)
        } catch (error) {
          console.warn(`Failed to load image for platform:`, p, error)
        }

        column++
        if (column >= COLUMN_COUNT) {
          row++
          column = 0
        }
      }

      if (!signal.aborted) {
        setTexture((prevTexture) => {
          const newTexture = new THREE.CanvasTexture(canvas)
          newTexture.colorSpace = THREE.SRGBColorSpace
          prevTexture.dispose()
          return newTexture
        })
      }
    }

    createAtlas(ab.signal)

    return () => {
      ab.abort()
    }
  }, [platforms, store])

  return texture
}

export const useSetupPositions = () => {
  const COLUMNS = 12

  const setupCallback = useAtomCallback(
    useCallback(async (get, set) => {
      console.log("setting up positions")
      const platformList = await get(platformsListSelector)

      set(
        platformModalPositionAtom,
        platformList.map((platform, index) => {
          const col = index % COLUMNS
          const row = Math.floor(index / COLUMNS)

          return { id: platform, col, row }
        })
      )
    }, [])
  )

  useEffect(() => {
    setupCallback()
  }, [setupCallback])
}
