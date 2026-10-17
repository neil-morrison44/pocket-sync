import { useState } from "react"

import { useSetAtomFnSet, useSmoothedAtomValue } from "../../../utils/jotai"
import { MiSTerCredsAtom } from "./recoil/atoms"
import { MisterConnectModal } from "./connect"
import { MisterSync } from "."
import { MisterCreds, MisterSourceProvider } from "./source"

/** The connect modal with the login remembered from last time. */
export const MisterConnect = ({
  onConnected,
  onClose,
}: {
  onConnected: () => void
  onClose: () => void
}) => {
  const creds = useSmoothedAtomValue(MiSTerCredsAtom)
  const setCreds = useSetAtomFnSet(MiSTerCredsAtom)
  return (
    <MisterSourceProvider>
      <MisterConnectModal
        creds={creds}
        onCredsChange={(next) => setCreds(() => next)}
        onConnected={onConnected}
        onClose={onClose}
      />
    </MisterSourceProvider>
  )
}

/** The connected session, for the Backups page. */
export const MisterSession = ({ onClose }: { onClose: () => void }) => (
  <MisterSourceProvider>
    <MisterSync onClose={onClose} />
  </MisterSourceProvider>
)

/**
 * Development only (Settings → Developer): the whole MiSTer Sync with
 * made-up saves: connect (the host "fail" fails), then the session over
 * the page. The stored login isn't touched.
 */
export const MisterSyncDemo = ({ onClose }: { onClose: () => void }) => {
  const [connected, setConnected] = useState(false)
  const [creds, setCreds] = useState<MisterCreds>({
    host: "mister.local",
    user: "root",
    password: "1",
  })

  return (
    <MisterSourceProvider demo>
      {connected ? (
        <div className="mister-sync-preview">
          <MisterSync onClose={onClose} />
        </div>
      ) : (
        <MisterConnectModal
          creds={creds}
          onCredsChange={setCreds}
          onConnected={() => setConnected(true)}
          onClose={onClose}
        />
      )}
    </MisterSourceProvider>
  )
}
