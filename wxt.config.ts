import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  webExt: {
    disabled: true
  },
  manifest: {
    name: "Fantasy Town Generator - Roll20",
    version: "1.0.0",
    description: "Display interactive Fantasy Town Generator maps inside Roll20.",
    permissions: ['storage', 'activeTab', 'scripting'],
  }
});
