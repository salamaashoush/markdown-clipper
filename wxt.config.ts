import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Copy as Markdown',
    description: 'Convert web pages to well-formatted markdown for offline reading, sharing, and AI consumption',
    version: '1.0.0',
    permissions: [
      'contextMenus',
      'storage',
      'activeTab',
      'tabs',
      'downloads',
      'clipboardWrite',
      'scripting',
      'offscreen'
    ],
    host_permissions: [
      '<all_urls>'
    ],
    action: {
      default_popup: 'popup.html',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        128: 'icon/128.png'
      }
    }
  }
});
