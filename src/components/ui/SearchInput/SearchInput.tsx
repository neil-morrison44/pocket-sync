import React, { useEffect, useRef } from "react"

import { useTranslation } from "react-i18next"

import Icon from "../Icon"
import Kbd from "../Kbd"
import TextInput from "../TextInput"

import "./SearchInput.css"

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Accessible name; defaults to the placeholder. */
  label?: string
  className?: string
  /**
   * Focuses the field with ⌘F / Ctrl+F and shows the shortcut while it's
   * empty. Use it for the one main search on a page.
   */
  shortcut?: boolean
}

const SearchInput = ({ shortcut = false, ...props }: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation("app")

  useEffect(() => {
    if (!shortcut) return
    const listener = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (!mod || event.altKey || event.key.toLowerCase() !== "f") return
      event.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    document.addEventListener("keydown", listener)
    return () => document.removeEventListener("keydown", listener)
  }, [shortcut])

  return (
    <TextInput
      {...props}
      ref={inputRef}
      type="search"
      icon="search"
      autoComplete="off"
      spellCheck={false}
      suffix={
        props.value ? (
          // Our pixel icon instead of the browser's clear button
          <button
            type="button"
            className="search-input__clear"
            aria-label={t("clear_search")}
            title={t("clear_search")}
            onClick={() => {
              props.onChange("")
              inputRef.current?.focus()
            }}
          >
            <Icon icon="close" />
          </button>
        ) : shortcut ? (
          <Kbd className="search-input__shortcut" keys={["mod", "f"]} />
        ) : undefined
      }
    />
  )
}

export default React.memo(SearchInput)
