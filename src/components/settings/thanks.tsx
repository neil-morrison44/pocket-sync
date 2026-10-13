/* eslint-disable react/jsx-no-literals */
import { useTranslation } from "react-i18next"
import { Link } from "../link"

/** Projects Pocket Sync builds on, credited at the top of the settings. */
const CREDITS = [
  { name: "openFPGA Library", href: "https://github.com/openfpga-library" },
  {
    name: "GamePocket font (and its Pocket icons) by mumchristmas",
    href: "https://github.com/mumchristmas/GamePocket-font",
  },
  {
    name: "Analogue OS font recreation and app icon by AbFarid",
    href: "https://github.com/AbFarid/analogue-os-font",
  },
  {
    name: "Pixelarticons by Gerrit Halfmann",
    href: "https://github.com/halfmage/pixelarticons",
  },
  {
    name: "Radix Primitives",
    href: "https://www.radix-ui.com/primitives",
  },
  {
    name: "3D reflection map from Poly Haven",
    href: "https://polyhaven.com/a/studio_small_08",
  },
]

export const Thanks = () => {
  const { t } = useTranslation("settings")

  return (
    <section className="settings__thanks" aria-labelledby="settings-thanks">
      <h2 className="settings__thanks-title" id="settings-thanks">
        {t("thanks")}
      </h2>
      <ul className="settings__thanks-list">
        {CREDITS.map(({ name, href }) => (
          <li key={href}>
            <Link href={href}>{name}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
