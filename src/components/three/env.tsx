import { Environment } from "@react-three/drei"
import envMap from "./small_empty_room_1_1k.hdr"

export const PocketEnv = () => (
  <Environment
    files={envMap}
    environmentRotation={[0, Math.PI * 0.8, 0]}
    blur={4}
  />
)
