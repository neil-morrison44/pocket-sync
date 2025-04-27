import { DataJSONSelectorFamily } from "../../../../recoil/selectors"
import { Suspense, useMemo } from "react"
import {
  JT_ANALOGIZER_SNAC_OPTIONS,
  JT_ANALOGIZER_VIDEO_OPTIONS,
  JTCRTConfigSelector,
} from "../../../../recoil/cores/selectors"
import { useTranslation } from "react-i18next"
import { Details } from "../../../shared/details"
import { AnalogizerIcon } from "../../icons/AnalogizerIcon"
import { SupportsBubble } from "../supportsBubble"

import "./index.css"
import { useAtom, useAtomValue } from "jotai"

type JTAnalogizerSettingsProps = {
  coreName: string
}

export const JTAnalogizerSettings = ({
  coreName,
}: JTAnalogizerSettingsProps) => {
  const coreData = useAtomValue(DataJSONSelectorFamily(coreName))
  const hasCRTConfig = useMemo(
    () =>
      coreData.data.data_slots.find(
        ({ filename }) => filename === "crtcfg.bin"
      ) !== undefined,
    [coreData]
  )

  if (!hasCRTConfig) return null

  return (
    <Suspense fallback={<div style={{ height: "230px" }}></div>}>
      <JTAnalogizerSettingsInner />
    </Suspense>
  )
}

const JTAnalogizerSettingsInner = () => {
  const { t } = useTranslation("core_info")
  const [crtConfig, setCrtConfig] = useAtom(JTCRTConfigSelector)

  return (
    <Details
      title={t("jt_analogizer_config.title")}
      renderIcon={() => <AnalogizerIcon />}
    >
      <h4 className="jt-analogizer__options-title">
        {t("jt_analogizer_config.video")}
      </h4>
      <div className="jt-analogizer__options">
        {JT_ANALOGIZER_VIDEO_OPTIONS.map(([_, name]) => (
          <SupportsBubble
            supports={crtConfig.video === name}
            key={name}
            onClick={() => setCrtConfig({ ...crtConfig, video: name })}
          >
            {name}
          </SupportsBubble>
        ))}
      </div>
      <h4 className="jt-analogizer__options-title">
        {t("jt_analogizer_config.snac")}
      </h4>
      <div className="jt-analogizer__options">
        {JT_ANALOGIZER_SNAC_OPTIONS.map(([_, name]) => (
          <SupportsBubble
            supports={crtConfig.snac === name}
            key={name}
            onClick={() => setCrtConfig({ ...crtConfig, snac: name })}
          >
            {name}
          </SupportsBubble>
        ))}
      </div>
    </Details>
  )
}
