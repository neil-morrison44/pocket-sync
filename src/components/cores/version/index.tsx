import { CoreInfoSelectorFamily } from "../../../jotai/selectors"

import "./index.css"
import { useUpdateAvailable } from "../../../hooks/useUpdateAvailable"
import { useTranslation } from "react-i18next"
import { useReplacementAvailable } from "../../../hooks/useReplacementAvailable"
import { useAtomValue } from "jotai"
import Icon from "../../ui/Icon"

type VersionProps = {
  coreName: string
}

export const Version = ({ coreName }: VersionProps) => {
  const coreInfo = useAtomValue(CoreInfoSelectorFamily(coreName))
  const updateAvailable = useUpdateAvailable(coreName)
  const replaceAvailable = useReplacementAvailable(coreName)
  const { t } = useTranslation("version")

  return (
    <div className="version">
      {coreInfo.core.metadata.version}
      {updateAvailable && (
        <div
          className="version__update"
          title={t("update_alt", { version: updateAvailable })}
        >
          <Icon icon="upload" />
          {updateAvailable}
        </div>
      )}
      {replaceAvailable && (
        <div
          className="version__replaced"
          title={t("replaced_alt", { core: replaceAvailable })}
        >
          <Icon icon="reload" />
          {t("replaced")}
        </div>
      )}
    </div>
  )
}
