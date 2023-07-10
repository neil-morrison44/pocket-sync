import { Suspense, useMemo, useState } from "react"
import { useRecoilCallback, useRecoilValue } from "recoil"
import { fileSystemInvalidationAtom } from "../../recoil/atoms"
import { cateogryListselector } from "../../recoil/inventory/selectors"
import { coresListSelector } from "../../recoil/selectors"
import { Controls } from "../controls"
import { Grid } from "../grid"
import { Loader } from "../loader"
import { SearchContextProvider } from "../search/context"
import { InstanceJson } from "./instanceJson"
import { CleanFilesModal } from "./cleanFiles"
import { CoreFolderItem } from "./item"
import { useTranslation } from "react-i18next"

export const Games = () => {
  const coresList = useRecoilValue(coresListSelector)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const [cleanFilesOpen, setCleanFilesOpen] = useState(false)
  const [instanceJsonOpen, setInstanceJsonOpen] = useState(false)
  const { t } = useTranslation("games")

  const refresh = useRecoilCallback(({ set }) => () => {
    set(fileSystemInvalidationAtom, Date.now())
  })

  const sortedList = useMemo(
    () =>
      [...coresList].sort((a, b) => {
        const [authorA, coreA] = a.split(".")
        const switchedA = `${coreA}.${authorA}`

        const [authorB, coreB] = b.split(".")
        const switchedB = `${coreB}.${authorB}`

        return switchedA.localeCompare(switchedB)
      }),
    [coresList]
  )

  const categoryList = useRecoilValue(cateogryListselector)

  return (
    <div>
      {cleanFilesOpen && (
        <CleanFilesModal onClose={() => setCleanFilesOpen(false)} />
      )}

      {instanceJsonOpen && (
        <InstanceJson onClose={() => setInstanceJsonOpen(false)} />
      )}

      <Controls
        controls={[
          {
            type: "search",
            text: t("controls.search"),
            value: searchQuery,
            onChange: (v) => setSearchQuery(v),
          },
          {
            type: "button",
            text: t("controls.clean_files"),
            onClick: () => setCleanFilesOpen(true),
          },
          {
            type: "button",
            text: t("controls.instance_json"),
            onClick: () => setInstanceJsonOpen(true),
          },
          {
            type: "button",
            text: t("controls.refresh"),
            onClick: refresh,
          },
          {
            type: "select",
            options: categoryList,
            selected: filterCategory,
            text: t("controls.category"),
            onChange: (v) => setFilterCategory(v),
          },
        ]}
      />
      <SearchContextProvider
        query={searchQuery}
        other={{ category: filterCategory }}
      >
        <Grid>
          {sortedList.map((core) => (
            <Suspense fallback={<Loader height={130} />} key={core}>
              <CoreFolderItem coreName={core} />
            </Suspense>
          ))}
        </Grid>
      </SearchContextProvider>
    </div>
  )
}
