import SearchInput from "../../ui/SearchInput"

type ControlsSearchProps = {
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export const ControlsSearch = ({
  value,
  placeholder,
  onChange,
}: ControlsSearchProps) => (
  <SearchInput
    value={value}
    placeholder={placeholder}
    onChange={onChange}
    shortcut
  />
)
