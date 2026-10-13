import { useTranslation } from "react-i18next"
import { PocketColour } from "../../types"
import { SelectOption } from "../ui/Select"

const COLOUR_GROUPS: { label?: string; values: PocketColour[] }[] = [
  { values: ["black", "white", "glow"] },
  {
    label: "3d_pocket.transparent_label",
    values: [
      "trans_clear",
      "trans_smoke",
      "trans_blue",
      "trans_green",
      "trans_orange",
      "trans_purple",
      "trans_red",
    ],
  },
  {
    label: "3d_pocket.classic_label",
    values: [
      "indigo",
      "red",
      "green",
      "blue",
      "yellow",
      "pink",
      "orange",
      "silver",
    ],
  },
  {
    label: "3d_pocket.aluminium_label",
    values: [
      "aluminium_natural",
      "aluminium_noir",
      "aluminium_black",
      "aluminium_indigo",
    ],
  },
  {
    label: "3d_pocket.gbc_label",
    values: [
      "gbc_kiwi",
      "gbc_dandelion",
      "gbc_teal",
      "gbc_grape",
      "gbc_berry",
      "gbc_gold",
    ],
  },
  { label: "3d_pocket.supreme_label", values: ["supreme_red", "supreme_gold"] },
]

/** Select options for the 3D Pocket colours, grouped by edition. */
export const useColourOptions = (): SelectOption<PocketColour>[] => {
  const { t } = useTranslation("settings")
  return COLOUR_GROUPS.flatMap(({ label, values }) =>
    values.map((value) => ({
      value,
      label: t(`3d_pocket.colours.${value}`),
      group: label && t(label),
    }))
  )
}
