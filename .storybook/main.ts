import type { StorybookConfig } from "@storybook/react-vite"

// the vite builder picks up ./vite.config.ts automatically, so the app's
// plugins (react babel, i18next loader, postcss nesting, assetsInclude)
// are already applied
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/react-vite",
  addons: ["@storybook/addon-mcp"],
  features: {
    componentsManifest: true,
  },
  // serve under a subpath when CI sets STORYBOOK_BASE_PATH (GitHub Pages);
  // left unset locally so `storybook dev` still serves from /
  ...(process.env.STORYBOOK_BASE_PATH
    ? { basePath: process.env.STORYBOOK_BASE_PATH }
    : {}),
}

export default config
