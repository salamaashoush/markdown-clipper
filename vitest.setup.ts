import { vi } from 'vitest';

// Mock Chrome API
(global as any).browser = {
  runtime: {
    sendMessage: vi.fn().mockImplementation((message) => {
      // Default mock response for tests
      if (message.type === 'CONVERT_PAGE') {
        if (message.payload.profileId === 'non-existent-profile') {
          return Promise.resolve({
            success: false,
            error: {
              code: 'PROFILE_NOT_FOUND',
              message: `Profile ${message.payload.profileId} not found`
            }
          });
        }
        return Promise.resolve({
          success: true,
          data: {
            markdown: '# Test Page Title\n\nThis is a test paragraph.\n\n- Item 1\n- Item 2',
            fileName: message.payload.customFileName || 'test-page.md',
            sizeBytes: 1024,
            metadata: {}
          }
        });
      }
      if (message.type === 'CONVERT_TABS') {
        if (message.payload.tabIds.length === 0) {
          return Promise.resolve({
            success: false,
            error: {
              code: 'NO_TABS_SELECTED',
              message: 'No tabs selected'
            }
          });
        }
        if (message.payload.batchMode === 'combined') {
          return Promise.resolve({
            success: true,
            data: {
              markdown: '# Combined Content',
              combinedFileName: 'combined-pages.md',
              successCount: message.payload.tabIds.length,
              failureCount: 0
            }
          });
        }
        if (message.payload.batchMode === 'zip') {
          return Promise.resolve({
            success: true,
            data: {
              zipFileName: 'pages.zip',
              fileCount: message.payload.tabIds.length
            }
          });
        }
        return Promise.resolve({
          success: true,
          data: {
            results: message.payload.tabIds.map((id: string, index: number) => ({
              tabId: id,
              success: index !== 1, // Second tab fails for partial failure test
              markdown: index !== 1 ? `# Tab ${id} Content` : undefined,
              fileName: index !== 1 ? `tab-${id}.md` : undefined,
              error: index === 1 ? { code: 'RESTRICTED_PAGE', message: 'Cannot convert' } : undefined
            })),
            successCount: message.payload.tabIds.length - 1,
            failureCount: 1
          }
        });
      }
      return Promise.resolve(undefined);
    }),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(),
    },
    getManifest: vi.fn(() => ({ version: '1.0.0' })),
    id: 'test-extension-id',
  },
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    sendMessage: vi.fn(),
  },
  contextMenus: {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    removeAll: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(),
    },
  },
  downloads: {
    download: vi.fn(),
    search: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  },
} as any;
