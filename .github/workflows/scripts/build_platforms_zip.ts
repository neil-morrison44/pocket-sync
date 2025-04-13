import { writeFile } from "fs/promises"
import * as zip from "@zip.js/zip.js"
import { Octokit } from "@octokit/rest"

export const buildPlatformZip = async ({ github }: { github: Octokit }) => {
  const url =
    "https://raw.githubusercontent.com/neil-morrison44/pocket-sync/main/image_packs.json"
  const response = await github.request(url)
  const packs = JSON.parse(response.data) as {
    owner: string
    repository: string
  }[]

  const multiZip = new zip.ZipWriter(new zip.BlobWriter("application/zip"), {
    bufferedWrite: true,
  })

  let imagePackOutput: {
    owner: string
    repository: string
    variant: string
    data_platforms: string[]
    image_platforms: string[]
  }[] = []

  for (const pack of packs) {
    const latestRelease = (await (
      await fetch(
        `https://api.github.com/repos/${pack.owner}/${pack.repository}/releases/latest`
      )
    ).json()) as {
      assets?: {
        name: string
        browser_download_url: string
      }[]
    }
    if (!latestRelease?.assets) {
      console.error(latestRelease)
      continue
    }

    const variants = latestRelease.assets.filter(({ name }) =>
      name.endsWith(".zip")
    )

    for (const variant of variants) {
      const name = variant.name.replace(".zip", "")

      const downloadURL = variant.browser_download_url
      if (!downloadURL) continue

      const zipResponse = await github.request(downloadURL)
      const zipBlob = new Blob([zipResponse.data], {
        type: "application/zip",
      })

      const abortController = new AbortController()
      const entries = await new zip.ZipReader(new zip.BlobReader(zipBlob), {
        signal: abortController.signal,
      }).getEntries({})

      const packPath = `${pack.owner}__${pack.repository}__${name}`

      const dataPacks: string[] = []
      for (const entry of entries.filter((entry) =>
        entry.filename.endsWith(".json")
      )) {
        if (!entry.getData) return
        const [file, ..._] = entry.filename.split("/").reverse()
        const filename = `${packPath}/Platforms/${file}`
        dataPacks.push(file.replace(".json", ""))
        const dataBlob = await entry.getData(new zip.BlobWriter(), {})
        try {
          await multiZip.add(filename, new zip.BlobReader(dataBlob))
        } catch (err) {
          console.error(err)
        }
      }

      const imagePacks: string[] = []
      for (const entry of entries.filter((entry) =>
        entry.filename.endsWith(".bin")
      )) {
        if (!entry.getData) return
        const [file, ..._] = entry.filename.split("/").reverse()
        const filename = `${packPath}/Platforms/_images/${file}`
        imagePacks.push(file.replace(".bin", ""))
        const dataBlob = await entry.getData(new zip.BlobWriter(), {})
        try {
          await multiZip.add(filename, new zip.BlobReader(dataBlob))
        } catch (err) {
          console.error(err)
        }
      }

      imagePackOutput.push({
        ...pack,
        variant: name,
        data_platforms: dataPacks,
        image_platforms: imagePacks,
      })
    }
  }

  const blob = await multiZip.close()
  const buffer = Buffer.from(await blob.arrayBuffer())

  await writeFile("platforms.zip", buffer)
  await writeFile("image_packs.json", JSON.stringify(imagePackOutput, null, 2))
}

// await buildPlatformZip({ github: new Octokit() })
