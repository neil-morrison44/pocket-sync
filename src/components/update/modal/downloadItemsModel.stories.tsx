import type { Meta, StoryObj } from "@storybook/react"
import { Canvas } from "@react-three/fiber"
import { DownloadItemsModel } from "./downloadItemsModel"
import { Lights } from "../../three/pocket"
import { OrbitControls } from "@react-three/drei"

const meta = {
  title: "Update/Modal/DownloadItemsModel",
  component: DownloadItemsModel,
  decorators: [
    (Story) => (
      <div
        style={{
          width: "100%",
          height: 600,
          background: "#111",
          containerType: "size",
        }}
      >
        <Canvas camera={{ fov: 50, position: [0, 0, 2.4] }}>
          <Lights />
          <OrbitControls />
          <Story />
        </Canvas>
      </div>
    ),
  ],
} satisfies Meta<typeof DownloadItemsModel>

export default meta

type Story = StoryObj<typeof meta>

export const Disk: Story = {
  args: { model: "Disk" },
  parameters: { pocketSyncConfig: { colour: "yellow" } },
}

export const Chip: Story = {
  args: { model: "Chip" },
  parameters: { pocketSyncConfig: { colour: "yellow" } },
}

export const Arcade: Story = {
  args: { model: "Arcade" },
  parameters: { pocketSyncConfig: { colour: "green", button_colour: "red" } },
}
