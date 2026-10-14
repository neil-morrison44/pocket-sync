import { DataJSONSelectorFamily } from "../../../../jotai/selectors"
import { Suspense, useMemo } from "react"
import {
  JT_ANALOGIZER_SNAC_OPTIONS,
  JT_ANALOGIZER_VIDEO_OPTIONS,
  JTCRTConfigSelector,
} from "../../../../jotai/cores/selectors"
import { useTranslation } from "react-i18next"
import Select from "../../../ui/Select"

import "./index.css"
import { useAtom, useAtomValue } from "jotai"
import Icon from "../../../ui/Icon"

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
    <section className="jt-analogizer">
      <h3 className="detail-page__section-title">
        <Icon icon="analogizer" />
        {t("jt_analogizer_config.title")}
      </h3>
      <div className="jt-analogizer__options">
        <Select
          label={t("jt_analogizer_config.video")}
          value={crtConfig.video}
          onChange={(video) => setCrtConfig({ ...crtConfig, video })}
          options={JT_ANALOGIZER_VIDEO_OPTIONS.map(([_, name]) => ({
            value: name,
          }))}
        />
        <Select
          label={t("jt_analogizer_config.snac")}
          value={crtConfig.snac}
          onChange={(snac) => setCrtConfig({ ...crtConfig, snac })}
          options={JT_ANALOGIZER_SNAC_OPTIONS.map(([_, name]) => ({
            value: name,
          }))}
        />
      </div>
    </section>
  )
}
