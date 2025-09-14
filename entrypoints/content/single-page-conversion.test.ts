import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Integration - Single Page Conversion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should convert current page to markdown via context menu', async () => {
    // Setup: Mock current tab
    const mockTab = {
      id: 1,
      title: 'Test Page',
      url: 'https://example.com',
      active: true,
    };

    browser.tabs.query = vi.fn().mockResolvedValue([mockTab]);

    // Setup: Mock page content extraction
    const mockPageContent = `
      <h1>Test Page Title</h1>
      <p>This is a test paragraph.</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
    `;

    browser.tabs.sendMessage = vi.fn().mockResolvedValue({
      html: mockPageContent,
      title: 'Test Page',
      url: 'https://example.com',
    });

    // Act: Trigger conversion
    const result = await convertCurrentPage({
      mode: 'copy',
      profileId: 'default',
    });

    // Assert: Check markdown output
    expect(result.success).toBe(true);
    expect(result.markdown).toContain('# Test Page Title');
    expect(result.markdown).toContain('This is a test paragraph.');
    expect(result.markdown).toContain('- Item 1');
    expect(result.markdown).toContain('- Item 2');
  });

  it('should download markdown file with correct filename', async () => {
    const mockTab = {
      id: 1,
      title: 'My Document - Example Site',
      url: 'https://example.com/document',
      active: true,
    };

    browser.tabs.query = vi.fn().mockResolvedValue([mockTab]);
    browser.tabs.sendMessage = vi.fn().mockResolvedValue({
      html: '<h1>Test Content</h1><p>Test paragraph</p>',
      title: 'My Document - Example Site',
      url: 'https://example.com/document',
    });
    browser.downloads.download = vi.fn().mockResolvedValue(123); // download ID

    const result = await convertCurrentPage({
      mode: 'download',
      profileId: 'default',
    });

    expect(result.success).toBe(true);
    expect(browser.downloads.download).toHaveBeenCalledWith({
      url: expect.any(String), // blob URL
      filename: 'My Document - Example Site.md',
      saveAs: false,
    });
  });

  it('should include metadata when requested', async () => {
    const mockTab = {
      id: 1,
      title: 'Test Page',
      url: 'https://example.com',
      active: true,
    };

    browser.tabs.query = vi.fn().mockResolvedValue([mockTab]);

    const result = await convertCurrentPage({
      mode: 'copy',
      profileId: 'default',
      includeMetadata: true,
    });

    expect(result.success).toBe(true);
    expect(result.markdown).toContain('---');
    expect(result.markdown).toContain('title: Test Page');
    expect(result.markdown).toContain('url: https://example.com');
    expect(result.markdown).toContain('converted:');
    expect(result.markdown).toContain('---');
  });

  it('should handle CSR content by waiting for dynamic loading', async () => {
    const mockTab = {
      id: 1,
      title: 'SPA Page',
      url: 'https://spa-app.com',
      active: true,
    };

    browser.tabs.query = vi.fn().mockResolvedValue([mockTab]);

    // Simulate delayed content loading
    let callCount = 0;
    browser.tabs.sendMessage = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: page still loading
        return Promise.resolve({
          html: '<div>Loading...</div>',
          isLoading: true,
        });
      } else {
        // Second call: content loaded
        return Promise.resolve({
          html: '<h1>Loaded Content</h1><p>Dynamic content here</p>',
          isLoading: false,
        });
      }
    });

    const result = await convertCurrentPage({
      mode: 'copy',
      profileId: 'default',
      waitForDynamic: true,
    });

    expect(result.success).toBe(true);
    expect(result.markdown).toContain('# Loaded Content');
    expect(result.markdown).toContain('Dynamic content here');
    expect(browser.tabs.sendMessage).toHaveBeenCalledTimes(2);
  });

  it('should handle restricted page access gracefully', async () => {
    const mockTab = {
      id: 1,
      title: 'Chrome Settings',
      url: 'chrome://settings',
      active: true,
    };

    browser.tabs.query = vi.fn().mockResolvedValue([mockTab]);
    browser.tabs.sendMessage = vi.fn().mockRejectedValue(new Error('Cannot access chrome:// URLs'));

    const result = await convertCurrentPage({
      mode: 'copy',
      profileId: 'default',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error.code).toBe('RESTRICTED_PAGE');
    expect(result.error.message).toContain('Cannot convert this page');
  });
});

// Simulates the conversion flow for testing
async function convertCurrentPage(options: {
  mode: 'copy' | 'download' | 'both';
  profileId: string;
  includeMetadata?: boolean;
  waitForDynamic?: boolean;
}): Promise<any> {
  try {
    // Get current tab
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (!tab || !tab.id) {
      return {
        success: false,
        error: {
          code: 'NO_ACTIVE_TAB',
          message: 'No active tab found',
        },
      };
    }

    // Check for restricted URLs
    if (tab.url && (
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://') ||
      tab.url.startsWith('about:') ||
      tab.url.startsWith('edge://')
    )) {
      return {
        success: false,
        error: {
          code: 'RESTRICTED_PAGE',
          message: 'Cannot convert this page due to browser restrictions',
        },
      };
    }

    let pageContent;

    // Extract content with optional dynamic wait
    if (options.waitForDynamic) {
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        pageContent = await browser.tabs.sendMessage(tab.id, {
          type: 'EXTRACT_CONTENT',
          payload: { waitForDynamic: true },
        });

        if (!pageContent.isLoading) {
          break;
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } else {
      pageContent = await browser.tabs.sendMessage(tab.id, {
        type: 'EXTRACT_CONTENT',
        payload: {},
      });
    }

    // Convert HTML to Markdown (simplified for testing)
    let markdown = pageContent.html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<[^>]+>/g, ''); // Remove remaining HTML tags

    // Add metadata if requested
    if (options.includeMetadata) {
      const metadata = `---
title: ${tab.title}
url: ${tab.url}
converted: ${new Date().toISOString()}
---

`;
      markdown = metadata + markdown;
    }

    // Handle different modes
    if (options.mode === 'download' || options.mode === 'both') {
      // In test environment, just simulate the download
      const url = `blob:mock-url-${Date.now()}`;

      await browser.downloads.download({
        url,
        filename: `${tab.title}.md`,
        saveAs: false,
      });
    }

    return {
      success: true,
      markdown,
      filename: `${tab.title}.md`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.message.includes('Cannot access') ? 'RESTRICTED_PAGE' : 'CONVERSION_FAILED',
        message: error.message,
      },
    };
  }
}
