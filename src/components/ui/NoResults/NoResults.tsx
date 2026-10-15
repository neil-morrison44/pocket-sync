import React from "react"

import { useTranslation } from "react-i18next"

import Icon from "../Icon"

import "./NoResults.css"

/**
 * "Nothing matches" for a list that a search or filters emptied. Put it last
 * inside a `.search-results` wrapper around the list: it only shows when
 * the wrapper has no results left (tiles, game sections, screenshots, or
 * anything marked `data-search-result`), so lists that hide their own items
 * need no count. Use `EmptyState` when there's nothing at all.
 */
const NoResults = () => {
  const { t } = useTranslation("app")
  return (
    <p className="no-results" role="status">
      <Icon icon="search" />
      {t("no_results")}
    </p>
  )
}

export default React.memo(NoResults)
