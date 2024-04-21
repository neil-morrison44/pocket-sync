import { writeFile } from "fs/promises"
import * as zip from "@zip.js/zip.js"
import { Octokit } from "@octokit/rest"

export const buildPlatformZip = async ({ github }: { github: Octokit }) => {
  const url =
    "https://raw.githubusercontent.com/mattpannella/pocket-updater-utility/main/image_packs.json"
  const response = await github.request(url)
  const packs = JSON.parse(response.data) as {
    owner: string
    repository: string
    variant?: string
  }[]

  const multiZip = new zip.ZipWriter(new zip.BlobWriter("application/zip"), {
    bufferedWrite: true,
  })

  for (const pack of packs) {
    const latestRelease = await (
      await fetch(
        `https://api.github.com/repos/${pack.owner}/${pack.repository}/releases/latest`
      )
    ).json()
    if (!latestRelease?.assets) {
      console.error(latestRelease)
      continue
    }
    const downloadURL = latestRelease.assets.find(({ name }) => {
      if (!name.endsWith(".zip")) return false
      if (pack.variant)
        return (
          name.endsWith(`${pack.variant}.zip`) ||
          name.startsWith(`${pack.variant}_`)
        )
      return true
    })
    if (!downloadURL) continue

    const zipResponse = await github.request(downloadURL.browser_download_url)
    const zipBlob = new Blob([zipResponse.data], {
      type: "application/zip",
    })

    const abortController = new AbortController()
    const entries = await new zip.ZipReader(new zip.BlobReader(zipBlob), {
      signal: abortController.signal,
    }).getEntries({})

    const packPath = `${pack.owner}__${pack.repository}__${
      pack.variant || "default"
    }`

    for (const entry of entries.filter((entry) =>
      entry.filename.endsWith(".json")
    )) {
      if (!entry.getData) return
      const [file, ..._] = entry.filename.split("/").reverse()
      const filename = `${packPath}/Platforms/${file}`
      const dataBlob = await entry.getData(new zip.BlobWriter(), {})
      try {
        await multiZip.add(filename, new zip.BlobReader(dataBlob))
      } catch (err) {
        console.log(filename)
        console.error(err)
      }
    }

    for (const entry of entries.filter((entry) =>
      entry.filename.endsWith(".bin")
    )) {
      if (!entry.getData) return
      const [file, ..._] = entry.filename.split("/").reverse()
      const filename = `${packPath}/Platforms/_images/${file}`
      const dataBlob = await entry.getData(new zip.BlobWriter(), {})
      try {
        await multiZip.add(filename, new zip.BlobReader(dataBlob))
      } catch (err) {
        console.log(filename)
        console.error(err)
      }
    }
  }

  const blob = await multiZip.close()
  const buffer = Buffer.from(await blob.arrayBuffer())
  await writeFile("platforms.zip", buffer)
}

// await buildPlatformZip({ github: new Octokit() })
