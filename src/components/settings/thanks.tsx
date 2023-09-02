/* eslint-disable react/jsx-no-literals */
import { useTranslation } from "react-i18next"
import { Link } from "../link"

export const Thanks = () => {
  const { t } = useTranslation("settings")

  return (
    <div className="settings__info">
      <h3>{t("thanks")}</h3>

      <ul>
        <li>
          <Link href={"https://github.com/openfpga-cores-inventory"}>
            {"https://github.com/openfpga-cores-inventory"}
          </Link>
        </li>

        <li>
          <Link href={"https://github.com/mumchristmas/GamePocket-font"}>
            {"https://github.com/mumchristmas/GamePocket-font"}
          </Link>
          {" & "}
          <Link href={"https://github.com/AbFarid/analogue-os-font"}>
            {"https://github.com/AbFarid/analogue-os-font"}
          </Link>
        </li>

        <li>
          <Link href={"https://polyhaven.com/a/studio_small_08"}>
            {"3D reflection map from Poly Haven"}
          </Link>
        </li>
      </ul>
    </div>
  )
}
