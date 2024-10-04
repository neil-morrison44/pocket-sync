import { useRecoilValue } from "recoil"
import { VideoJSONSelectorFamily } from "../../../../recoil/screenshots/selectors"
import { useCallback, useMemo } from "react"
import { SupportsBubble } from "../supportsBubble"

import "./index.css"
import { useTranslation } from "react-i18next"
import { pocketPathAtom } from "../../../../recoil/atoms"
import { VideoJSON } from "../../../../types"
import { invokeSaveFile } from "../../../../utils/invokes"
import { confirm } from "@tauri-apps/plugin-dialog"

type DisplayModesProps = {
  coreName: string
}

const DISPLAY_MODES = {
  crt_trinitron: { id: 0x10, requiresCoreResponse: false },
  grayscale_lcd: { id: 0x20, requiresCoreResponse: false },
  original_gb_dmg: { id: 0x21, requiresCoreResponse: true },
  original_gbp: { id: 0x22, requiresCoreResponse: true },
  original_gbp_light: { id: 0x23, requiresCoreResponse: true },
  reflective_color_lcd: { id: 0x30, requiresCoreResponse: false },
  original_gbc_lcd: { id: 0x31, requiresCoreResponse: false },
  original_gbc_lcd_plus: { id: 0x32, requiresCoreResponse: false },
  backlit_color_lcd: { id: 0x40, requiresCoreResponse: false },
  original_gba_lcd: { id: 0x41, requiresCoreResponse: false },
  original_gba_sp_101: { id: 0x42, requiresCoreResponse: false },
  original_gg: { id: 0x51, requiresCoreResponse: false },
  original_gg_plus: { id: 0x52, requiresCoreResponse: false },
  original_ngp: { id: 0x61, requiresCoreResponse: false },
  original_ngpc: { id: 0x62, requiresCoreResponse: false },
  original_ngpc_plus: { id: 0x63, requiresCoreResponse: false },
  turboexpress: { id: 0x71, requiresCoreResponse: false },
  pc_engine_lt: { id: 0x72, requiresCoreResponse: false },
  original_lynx: { id: 0x81, requiresCoreResponse: false },
  original_lynx_plus: { id: 0x82, requiresCoreResponse: false },
  pinball_neon_matrix: { id: 0xe0, requiresCoreResponse: false },
  vacuum_fluorescent: { id: 0xe1, requiresCoreResponse: false },
}

export const DisplayModes = ({ coreName }: DisplayModesProps) => {
  const videoJson = useRecoilValue(VideoJSONSelectorFamily(coreName))
  const pocketPath = useRecoilValue(pocketPathAtom)

  const { t } = useTranslation("core_info")

  const activeModes = useMemo(() => {
    if (!videoJson.video.display_modes) {
      // CRT mode enabled by default for some cores
      if (
        videoJson.video.scaler_modes.some(
          ({ height }) => height > 200 && height < 400
        )
      ) {
        return [DISPLAY_MODES.crt_trinitron.id]
      }

      return []
    }
    return videoJson.video.display_modes.map(({ id }) => parseInt(id))
  }, [videoJson])

  const toggleVideoMode = useCallback(
    async (id: number, requiresCoreResponse: boolean) => {
      const encoder = new TextEncoder()

      const newModes = activeModes.includes(id)
        ? activeModes.filter((aid) => aid !== id)
        : [...activeModes, id]

      const newVideoJSON: VideoJSON = {
        video: {
          ...videoJson.video,
          display_modes: newModes.map((id) => ({
            id: `0x${id.toString(16).padStart(2, "0")}`,
          })),
        },
      }

      if (requiresCoreResponse && !activeModes.includes(id)) {
        const allowed = await confirm(t("display_mode_warning"))
        if (!allowed) return
      }

      await invokeSaveFile(
        `${pocketPath}/Cores/${coreName}/video.json`,
        encoder.encode(JSON.stringify(newVideoJSON, null, 2))
      )
    },
    [activeModes, videoJson.video, pocketPath, coreName, t]
  )

  return (
    <div className="core-info__display-modes-list">
      {Object.entries(DISPLAY_MODES).map(
        ([name, { id, requiresCoreResponse }]) => {
          return (
            <SupportsBubble
              supports={activeModes.includes(id)}
              key={name}
              onClick={() => toggleVideoMode(id, requiresCoreResponse)}
            >
              {t(`display_modes.${name}`)}
            </SupportsBubble>
          )
        }
      )}
    </div>
  )
}
