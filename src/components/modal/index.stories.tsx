import type { Meta, StoryObj } from "@storybook/react"
import { expect } from "storybook/test"
import { Modal } from "./index"
import { Tip } from "../tip"

const meta = {
  title: "Modal",
  component: Modal,
} satisfies Meta<typeof Modal>

export default meta

type Story = StoryObj<typeof meta>

// The Modal has no onClose prop — real usage closes the underlying <dialog>
// itself, so the demo button does the same.
const CloseButton = () => (
  <button onClick={(event) => event.currentTarget.closest("dialog")?.close()}>
    Close
  </button>
)

export const Default: Story = {
  args: {
    children: (
      <>
        <h2>Example modal</h2>
        <Tip>
          This is a native <code>&lt;dialog&gt;</code> opened with showModal(),
          so focus is trapped and the backdrop dims the page behind it.
        </Tip>
        <CloseButton />
      </>
    ),
  },
  play: async ({ canvas }) => {
    canvas.getByRole("button", { name: "Close" }).click()
    const dialog = canvas.getByRole("dialog", {
      hidden: true,
    }) as HTMLDialogElement
    expect(dialog.open).toBe(false)
  },
}

export const FitContent: Story = {
  args: {
    className: "modal--fit-content",
    children: (
      <>
        <h2>Compact</h2>
        <Tip>
          The fit-content modifier shrinks the modal to the size of its content.
        </Tip>
        <CloseButton />
      </>
    ),
  },
}
