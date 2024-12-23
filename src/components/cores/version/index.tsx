import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { CoreInfoSelectorFamily } from "../../../recoil/selectors"

import "./index.css"
import { useUpdateAvailable } from "../../../hooks/useUpdateAvailable"
import { useTranslation } from "react-i18next"
import { useReplacementAvailable } from "../../../hooks/useReplacementAvailable"

type VersionProps = {
  coreName: string
}

export const Version = ({ coreName }: VersionProps) => {
  const coreInfo = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    CoreInfoSelectorFamily(coreName)
  )
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
          <UpArrowIcon />
          {updateAvailable}
        </div>
      )}
      {replaceAvailable && (
        <div
          className="version__replaced"
          title={t("replaced_alt", { core: replaceAvailable })}
        >
          <ReplaceIcon />
          {t("replaced")}
        </div>
      )}
    </div>
  )
}

const UpArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="1.2em"
    viewBox="0 -960 960 960"
    width="1.2em"
  >
    <path
      fill="currentcolor"
      d="M280-160v-60h400v60H280Zm170-170v-356L329-565l-42-42 193-193 193 193-42 42-121-121v356h-60Z"
    />
  </svg>
)

const ReplaceIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="1.2em"
    viewBox="0 -960 960 960"
    width="1.2em"
  >
    <path
      fill="currentcolor"
      d="M196-331q-20-36-28-72.5t-8-74.5q0-131 94.5-225.5T480-798h43l-80-80 39-39 149 149-149 149-40-40 79-79h-41q-107 0-183.5 76.5T220-478q0 29 5.5 55t13.5 49l-43 43ZM476-40 327-189l149-149 39 39-80 80h45q107 0 183.5-76.5T740-479q0-29-5-55t-15-49l43-43q20 36 28.5 72.5T800-479q0 131-94.5 225.5T480-159h-45l80 80-39 39Z"
    />
  </svg>
)
