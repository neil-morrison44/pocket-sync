import type { Meta, StoryObj } from "@storybook/react"
import { SaveMapping } from "./index"

const meta = {
  title: "Saves/MiSTer Sync/SaveMapping",
  component: SaveMapping,
} satisfies Meta<typeof SaveMapping>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onClose: () => undefined,
  },
}
