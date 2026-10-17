import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Modal } from "../../modal"
import Button from "../../ui/Button"
import Callout from "../../ui/Callout"
import Field from "../../ui/Field"
import TextInput from "../../ui/TextInput"
import { MisterCreds, useMisterSource } from "./source"

type MisterConnectModalProps = {
  creds: MisterCreds
  onCredsChange: (creds: MisterCreds) => void
  onConnected: () => void
  onClose: () => void
}

/**
 * Step one of MiSTer Sync: the MiSTer's address and FTP login, what's
 * needed for it to work, and why connecting failed if it did.
 */
export const MisterConnectModal = ({
  creds,
  onCredsChange,
  onConnected,
  onClose,
}: MisterConnectModalProps) => {
  const { t } = useTranslation("mister_sync")
  const source = useMisterSource()
  const [state, setState] = useState<"idle" | "connecting" | "failed">("idle")

  const connect = async () => {
    setState("connecting")
    const ok = await source.connect(creds)
    if (ok) onConnected()
    else setState("failed")
  }

  const field = (key: keyof MisterCreds) => ({
    id: `mister-${key}`,
    value: creds[key],
    onChange: (value: string) => {
      onCredsChange({ ...creds, [key]: value })
      if (state === "failed") setState("idle")
    },
    onKeyDown: ({ key: pressed }: { key: string }) => {
      if (pressed === "Enter") connect()
    },
    autoComplete: "off",
    autoCapitalize: "off",
    spellCheck: false,
    disabled: state === "connecting",
  })

  return (
    <Modal className="modal--form" title={t("connect.title")} onClose={onClose}>
      <Field
        label={t("login.host")}
        htmlFor="mister-host"
        hint={source.demo ? t("connect.demo_hint") : t("connect.host_hint")}
      >
        <TextInput {...field("host")} placeholder="192.168.0.10" autoFocus />
      </Field>
      <Field label={t("login.username")} htmlFor="mister-user">
        <TextInput {...field("user")} />
      </Field>
      <Field label={t("login.password")} htmlFor="mister-password">
        <TextInput {...field("password")} type="password" />
      </Field>

      {state === "failed" && (
        <Callout variant="warning">{t("connect.failed")}</Callout>
      )}

      {/* What has to be true for it to work, in one place */}
      <Callout>
        <ul className="mister-sync__tips">
          <li>{t("tip_1")}</li>
          <li>{t("tip_2")}</li>
          <li>{t("tip_3")}</li>
        </ul>
      </Callout>

      <div className="modal__actions">
        <Button theme="tertiary" onClick={onClose}>
          {t("connect.cancel")}
        </Button>
        <Button
          theme="primary"
          disabled={!creds.host.trim() || state === "connecting"}
          onClick={connect}
        >
          {state === "connecting"
            ? t("connect.connecting")
            : t("login.connect")}
        </Button>
      </div>
    </Modal>
  )
}
