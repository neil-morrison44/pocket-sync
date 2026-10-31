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
}

export default config
