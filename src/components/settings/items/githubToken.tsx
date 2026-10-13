import { githubTokenAtom } from "../../../jotai/settings/atoms"
import { useTranslation } from "react-i18next"
import { useAtom } from "jotai"
import Button from "../../ui/Button"
import TextInput from "../../ui/TextInput"

export const GithubToken = () => {
  const { t } = useTranslation("settings")
  const [githubToken, setGithubToken] = useAtom(githubTokenAtom)

  return (
    <div className="settings__row" id="settings-github_token">
      <h3 className="settings__row-title">{t("github_token.title")}</h3>
      <div className="settings__ramble">{t("github_token.ramble")}</div>
      <div className="settings__text-input-and-save">
        <TextInput
          className="settings__text-input"
          variant="code"
          label={t("github_token.title")}
          value={githubToken.value || ""}
          onChange={(value) => setGithubToken({ value })}
        />
        <Button
          theme="destructive"
          icon="trash"
          onClick={() => setGithubToken({ value: null })}
        >
          {t("github_token.remove")}
        </Button>
      </div>
    </div>
  )
}
