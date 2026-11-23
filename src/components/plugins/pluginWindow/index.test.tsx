import { describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { PluginWindowView } from "./index"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))
vi.mock("../../link", () => ({
  Link: ({ href, children }: { href?: string; children: unknown }) => (
    <span data-href={href}>{children as string}</span>
  ),
}))

const logs = [
  "# Title",
  "",
  "Some **bold** and `code`",
  "",
  "- one",
  "- two",
  "<b>raw</b>",
]
const render = (markdown?: boolean) =>
  renderToStaticMarkup(
    <PluginWindowView
      logs={logs}
      markdown={markdown}
      message={null}
      onAnswer={() => {}}
    />
  )

describe("PluginWindowView log output", () => {
  it("renders plain text line-by-line by default (existing plugins unaffected)", () => {
    const html = render()
    expect(html).toContain("<div># Title</div>")
    expect(html).not.toContain("<h1>")
    expect(html).not.toContain("<strong>")
  })

  it("renders markdown when the plugin opted in", () => {
    const html = render(true)
    expect(html).toContain("<h1>Title</h1>")
    expect(html).toContain("<strong>bold</strong>")
    expect(html).toContain("<code>code</code>")
    expect(html).toContain("<li>one</li>")
    expect(html).toContain("plugins-window__log--markdown")
  })

  it("keeps single newlines as line breaks (println-style output)", () => {
    const html = renderToStaticMarkup(
      <PluginWindowView
        logs={["one", "two"]}
        markdown
        message={null}
        onAnswer={() => {}}
      />
    )
    expect(html).toContain("one<br/>")
    expect(html).toContain("two")
  })

  it("never renders images (would bypass the plugin's allowed_hosts)", () => {
    const html = renderToStaticMarkup(
      <PluginWindowView
        logs={["![x](https://example.com/p.png)"]}
        markdown
        message={null}
        onAnswer={() => {}}
      />
    )
    expect(html).not.toContain("<img")
  })

  it("never injects raw HTML from plugin output", () => {
    expect(render(true)).not.toContain("<b>raw</b>")
  })
})
