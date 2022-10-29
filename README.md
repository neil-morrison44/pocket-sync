# pocket-sync
A tool for syncing the Analogue Pocket (initially with MiSTer)


__WARNING__ this is a _very_ early release - please don't use it without having backed up your saves.
I recommend backing up via `zip -r saves_backup.zip saves` on the MiSTer & `zip -r saves_backup.zip Saves` on the Pocket.

There's some inherent issues comparing last modified dates between different systems & with this you've got 3 (the Pocket, the MiSTer, and your PC) - so don't expect this to be accurate within a single day & I'd recommend against running the merge process twice in one day -- this might be fixed later if I can narrow down how the MiSTer, Pocket etc store timestamps.


## Roadmap

- [x] CLI for syncing saves with a MiSTer over FTP
- [ ] GUI (Windows / Mac / Linux)
- [ ] Library browser / editor in GUI
- [ ] Auto-updating GUI
- [ ] Core Updater in GUI (maybe)
- [ ] GUI for core updator showing release notes etc
