# pocket-sync
A tool for syncing the Analogue Pocket (initially with MiSTer)

[![asciicast](https://asciinema.org/a/VnRRsQj8BOikkHi3PKgo4OeWI.svg)](https://asciinema.org/a/VnRRsQj8BOikkHi3PKgo4OeWI?autoplay=1)


__WARNING__ this is a _very_ early release - please don't use it without having backed up your saves.
I recommend backing up via `zip -r saves_backup.zip saves` on the MiSTer & `zip -r saves_backup.zip Saves` on the Pocket.

- There's some inherent issues comparing last modified dates between different systems & with this you've got 3 (the Pocket, the MiSTer, and your PC) - so don't expect this to be accurate within a single day & I'd recommend against running the merge process twice in one day -- this might be fixed later if I can narrow down how the MiSTer, Pocket etc store timestamps.

- If you see a bunch of Pocket saves with the timestamp `2020-01-01 23:00:00 +00:00` they were probably saved on an older Pocket firmware that wasn't doing timestamps.

- If there's a save which is _only_ on the MiSTer it'll be moved to the _root folder_ on the Pocket, if the rom's in a nested folder this'll mean the save won't get picked up.

- Some cores do double duty on the MiSTer (e.g. `GAMEBOY` does GB & GBC), for these cores if there isn't a Pocket save already they'll be put somewhere (hopefully) sensible (`GameGear` might be an issue though since it's in with `SMS` on the MiSTer)

- The ROM name must match _exactly_ for it to be picked up as a save, this might cause issues for NEOGEO.

## Usage

- Grab the latest release for your OS from the releases section ->
- You'll probably need to jump through the "Unidentified Developer" thing (well, on Mac anyway)
- Your MiSTer will need to be on and have FTP enabled (on the default port, 21)
- (Probably a good time to back up your saves just incase)
- Run `./pocket-sync [path-to-pocket-SD-card] --host-mister [mister IP or hostname]`
- If you've changed the user / password on your MiSTer you'll need to use `--user-mister [name]` / `--password-mister [password]`
- It'll add a `pocket_sync.json` that (currently) just contains the timestamp of the last run so the program knows not to bother with things that've been synced already
- It'll merge the saves by these rules:
  - If both devices have the save & they're both older than the last-run timestamp **skip**
  - If only one device has the save, **copies it to both**
  - If one device has a save newer than the last-run time & the other is older **copies newer over older**
  - If both devices have saves newer than the last-run time **allows you to pick the Pocket save, the MiSTer save, or to skip**
## Roadmap

- [x] CLI for syncing saves with a MiSTer over FTP
- [ ] GUI (Windows / Mac / Linux)
- [ ] Library browser / editor in GUI
- [ ] Auto-updating GUI
- [ ] Core Updater in GUI (maybe)
- [ ] GUI for core updator showing release notes etc
