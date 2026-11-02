import type { Meta, StoryObj } from "@storybook/react"
import { PluginWindowView } from "./index"

// The view is pure presentation: its state is the accumulated `logs` and the
// plugin's current `message` (if it's asking something of the user). Each story
// is just a different combination of those two props.
const meta = {
  title: "Plugins/PluginWindow",
  component: PluginWindowView,
  decorators: [
    // Mimic the real plugin webview, which opens at 600px wide
    // (see usePluginRunner) rather than stretching edge to edge.
    (Story) => (
      <div style={{ width: 600, maxWidth: "100%", margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PluginWindowView>

export default meta

type Story = StoryObj<typeof meta>

// In the real app this callback emits the answer back to the plugin over
// Tauri and clears the prompt. In the view it's a no-op — the point of these
// stories is to show each state, not to drive the answer round-trip.
const onAnswer = () => undefined

export const Empty: Story = {
  // Straight after launch: the plugin is running but has produced no output
  // yet, and isn't asking for anything.
  args: {
    logs: [""],
    message: null,
    onAnswer,
  },
}

export const Running: Story = {
  // The plugin is doing work: a short burst of log output, no prompt.
  args: {
    logs: [
      "Starting sync...",
      "Connected to Pocket.",
      "Found 120 saves to check.",
      "Checking save #1...",
      "Checking save #2...",
    ],
    message: null,
    onAnswer,
  },
}

export const RunningForAges: Story = {
  // The "it's been going for a while" state: enough log lines to need
  // scrolling, so the live terminal's auto-scroll and scrollback are visible.
  args: {
    logs: [
      "Starting sync...",
      "Connected to Pocket.",
      ...Array.from(
        { length: 120 },
        (_, i) => `Checking save #${i + 1} of 120...`
      ),
    ],
    message: null,
    onAnswer,
  },
}

export const Choice: Story = {
  // The plugin is asking a multiple-choice question.
  args: {
    logs: [
      "Starting sync...",
      "Connected to Pocket.",
      "Found 2 saves with no associated game.",
    ],
    message: {
      Choice: {
        name: "resolution",
        query: "How should I resolve the 2 unmatched saves?",
        choices: ["Prompt me for each", "Match by name", "Skip them all"],
      },
    },
    onAnswer,
  },
}

export const Text: Story = {
  // The plugin is asking for a free-text answer.
  args: {
    logs: [
      "Starting sync...",
      "Connected to Pocket.",
      "Save 'save_04' has no associated game.",
    ],
    message: {
      Text: {
        name: "game",
        query: "Which game is save 'save_04' for? (type a name or serial)",
      },
    },
    onAnswer,
  },
}

export const Finished: Story = {
  // The plugin has exited cleanly: the control area tells the user the window
  // is safe to close.
  args: {
    logs: [
      "Starting sync...",
      "Connected to Pocket.",
      "Checking save #1...",
      "Checking save #2...",
      "Synced 2 saves.",
      "Done.",
    ],
    message: "Exit",
    onAnswer,
  },
}
