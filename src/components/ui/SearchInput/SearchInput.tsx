import React from "react"

import TextInput from "../TextInput"

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Accessible name; defaults to the placeholder. */
  label?: string
  className?: string
}

const SearchInput = (props: SearchInputProps) => (
  <TextInput
    {...props}
    type="search"
    icon="search"
    autoComplete="off"
    spellCheck={false}
  />
)

export default React.memo(SearchInput)
