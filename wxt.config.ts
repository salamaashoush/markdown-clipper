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
      'offscreen',
      'notifications'
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
    },
    commands: {
      'copy-current-page': {
        suggested_key: {
          default: 'Ctrl+Shift+C',
          mac: 'Command+Shift+C'
        },
        description: 'Copy current page as markdown'
      },
      'download-current-page': {
        suggested_key: {
          default: 'Ctrl+Shift+D',
          mac: 'Command+Shift+D'
        },
        description: 'Download current page as markdown'
      },
      'copy-selection': {
        suggested_key: {
          default: 'Alt+Shift+C',
          mac: 'Alt+Shift+C'
        },
        description: 'Copy selection as markdown'
      }
    }
  }
});
