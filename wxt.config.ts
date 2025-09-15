import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'MarkDown Clipper',
    description: 'Convert web pages to well-formatted markdown for offline reading, sharing, and AI consumption',
    version: '1.0.0',
    icons: {
      16: 'icon/icon.svg',
      32: 'icon/icon.svg',
      48: 'icon/icon.svg',
      96: 'icon/icon.svg',
      128: 'icon/icon.svg'
    },
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
        16: 'icon/icon.svg',
        32: 'icon/icon.svg',
        48: 'icon/icon.svg',
        128: 'icon/icon.svg'
      }
    },
    commands: {
      'copy-current-page': {
        suggested_key: {
          default: 'Ctrl+Shift+M',
          mac: 'Command+Shift+M'
        },
        description: 'Copy current page as markdown'
      },
      'download-current-page': {
        suggested_key: {
          default: 'Ctrl+Shift+L',
          mac: 'Command+Shift+L'
        },
        description: 'Download current page as markdown'
      }
    }
  }
});
