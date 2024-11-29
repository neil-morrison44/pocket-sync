## macOS 'Apple could not verify "Pocket Sync"' warning

Starting with macOS Catalina, Apple requires apps distributed outside the App Store to be notarized by Apple, which requires a paid developer account. Apps that aren't notarized will show a warning when opened, like the "Apple couldn't verify Pocket Sync" message. You can safely bypass this warning by following these steps:

1. Download the latest release from [releases](https://github.com/neil-morrison44/pocket-sync/releases/latest).
2. Double click `Pocket.Sync_X.X.X_universal.dmg` to mount the image.
3. Drag `Pocket Sync.app` to the `Applications` folder.
4. Open the app, resulting in the following message being displayed, "Apple could not verify "Pocket Sync".

   ![Apple could not verify "Pocket Sync"](./readme_images/macos_not_opened.png)

   > **Important**: This message must be displayed at least once to allow a new option to appear in system settings

5. Open "System Settings" (click  in upper left -> click "System Settings").
6. Scroll to "Privacy & Security".
7. Under the **Security** header, click "Open anyway" next to the message "Pocket Sync was blocked to protect your Mac."

   ![Open anyway](./readme_images/macos_privacy_security.png)
