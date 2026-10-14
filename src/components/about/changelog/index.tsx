import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { pocketSyncChangelogSelector } from "../../../jotai/github/selectors"

import ReactMarkdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { Link } from "../../link"
import { Loader } from "../../loader"
import { useAtomValue } from "jotai"

/** Releases rendered at first, and added each time the end comes near. */
const PAGE_SIZE = 10

/** Pocket Sync's release notes, shown in the start screen's side panel. */
export const ChangelogPanel = () => (
  <Suspense fallback={<Loader grow />}>
    <div className="about__changelog-text">
      <ChangelogInner />
    </div>
  </Suspense>
)

const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => (
    <>
      <div className="about__changelog-break" />
      <h3 className="about__changelog-title">{children}</h3>
    </>
  ),
  h2: "h3",
  h3: "h4",
  h4: "h5",
  h5: "strong",
  a: ({ href, children }) => <Link href={href}>{children}</Link>,
  img: ({ src }) => <img className="about__changelog-image" src={src} />,
}

/**
 * The changelog is fetched once, but rendering all of it at once made the
 * panel slow, so it's split into releases and rendered ten at a time as the
 * end scrolls near.
 */
const ChangelogInner = () => {
  const changelogMarkdown = useAtomValue(pocketSyncChangelogSelector)
  const [count, setCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // One chunk per release: each starts with a top-level "# " heading
  const releases = useMemo(() => {
    const tidied = changelogMarkdown
      .replace(/\*\*Full Changelog\*\*: ([^\n]+)/gi, "")
      .replace(/<img .+src="(.+)".?>/gi, (_full, src) => `![](${src})`)
      .replace(/- (\d{4}-\d{2}-\d{2})/gi, (_full, date) => date)
      .replace("# Changelog", "")
    return tidied.split(/^(?=# )/m).filter((chunk) => chunk.trim())
  }, [changelogMarkdown])

  const hasMore = count < releases.length

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCount((c) => c + PAGE_SIZE)
      },
      // Relative to the panel's scrolling area, a screen ahead
      { root: scrollParent(sentinel), rootMargin: "0px 0px 600px 0px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, count])

  return (
    <>
      {releases.slice(0, count).map((release, index) => (
        <ReactMarkdown
          key={index}
          remarkPlugins={[remarkGfm]}
          skipHtml
          components={MARKDOWN_COMPONENTS}
        >
          {release}
        </ReactMarkdown>
      ))}
      {hasMore && <div ref={sentinelRef} className="about__changelog-more" />}
    </>
  )
}

/** The closest ancestor that scrolls, or null for the viewport. */
const scrollParent = (element: HTMLElement): HTMLElement | null => {
  let parent = element.parentElement
  while (parent) {
    const { overflowY } = getComputedStyle(parent)
    if (overflowY === "auto" || overflowY === "scroll") return parent
    parent = parent.parentElement
  }
  return null
}
