import type { Meta, StoryObj } from "@storybook/react"
import { Canvas } from "@react-three/fiber"
import { UpdateThreeScene } from "./threeScene"
import { withConfig } from "../../../../.storybook/configDecorator"

const meta = {
  title: "Update/Modal/UpdateThreeScene",
  component: UpdateThreeScene,
  decorators: [withConfig],
} satisfies Meta<typeof UpdateThreeScene>

export default meta

type Story = StoryObj<typeof meta>

const Scene = (args: Story["args"]) => (
  <div
    style={{
      width: "100%",
      height: 600,
      background: "#111",
      containerType: "size",
    }}
  >
    <Canvas
      className="update__core-3d-scene"
      camera={{ fov: 10, position: [0, 0, 50] }}
    >
      <UpdateThreeScene {...args} />
    </Canvas>
  </div>
)

export const Default: Story = {
  render: Scene,
  args: {
    progress: 0.5,
    loadingModel: "Chip",
  },
  parameters: { pocketSyncConfig: { colour: "yellow" } },
}

export const Arcade: Story = {
  render: Scene,
  args: {
    progress: 0.3,
    loadingModel: "Arcade",
  },
  parameters: { pocketSyncConfig: { colour: "green", button_colour: "red" } },
}

export const Disk: Story = {
  render: Scene,
  args: {
    progress: 0.8,
    loadingModel: "Disk",
  },
  parameters: { pocketSyncConfig: { colour: "yellow" } },
}
