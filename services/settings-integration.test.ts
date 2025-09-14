/**
 * Integration tests to verify all settings are properly applied during conversion
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarkdownConverter } from '~/services/converter';
import { StorageManager } from '~/services/storage';
import type { ConversionProfile } from '~/types/storage';
import { DEFAULT_PROFILE, MarkdownFlavor, ImageStrategy, LinkStyle } from '~/types/storage';
import { DEFAULT_PREFERENCES } from '~/types/preferences';

describe('Settings Integration - Full Conversion Flow', () => {
  let storage: StorageManager;

  beforeEach(() => {
    storage = new StorageManager();
  });

  describe('Profile Settings Application', () => {
    it('should apply all profile settings correctly during conversion', async () => {
      // Create a custom profile with specific settings
      const customProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        id: 'test-profile',
        name: 'Test Profile',
        markdownFlavor: MarkdownFlavor.GFM,
        imageHandling: {
          strategy: ImageStrategy.LINK,
          lazyLoadHandling: true,
          fallbackAltText: 'Custom Image',
          maxWidth: 800,
        },
        linkHandling: {
          style: LinkStyle.ABSOLUTE,
          openInNewTab: false,
          shortenUrls: false,
          convertRelativeUrls: true,
          removeTrackingParams: true,
          followRedirects: false,
        },
        contentFilters: {
          includeCss: [],
          excludeCss: ['script', 'style', '.ads'],
          includeHidden: false,
          includeComments: false,
          includeScripts: false,
          includeIframes: false,
          maxHeadingLevel: 3,
          minContentLength: 0,
        },
        formatting: {
          lineWidth: 0,
          codeBlockSyntax: true,
          tableAlignment: true,
          listIndentation: 2,
          boldStyle: '**',
          italicStyle: '*',
          hrStyle: '---',
        },
        conversionOptions: {
          headingStyle: 'atx',
          bulletListMarker: '-',
          codeBlockStyle: 'fenced',
          fence: '```',
          emDelimiter: '*',
          strongDelimiter: '**',
          linkStyle: 'inlined',
          linkReferenceStyle: 'full',
        },
        outputFormat: {
          addMetadata: true,
          addTableOfContents: false,
          addFootnotes: true,
          wrapLineLength: 0,
          preserveNewlines: false,
        },
        isDefault: false,
        isBuiltIn: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Initialize converter with custom profile
      const converter = new MarkdownConverter(customProfile);

      // Test HTML with various elements
      const testHtml = `
        <h1>Main Title</h1>
        <h2>Subtitle</h2>
        <h3>Section</h3>
        <h4>Subsection</h4>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
        <table>
          <thead>
            <tr><th>Header 1</th><th>Header 2</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
          </tbody>
        </table>
        <a href="https://example.com?utm_source=test&id=123">Link with tracking</a>
        <img src="test.jpg" alt="Test Image">
        <img src="no-alt.jpg">
        <script>console.log('remove me');</script>
        <div class="ads">Advertisement</div>
        <blockquote>A quote</blockquote>
        <pre><code>const code = true;</code></pre>
        <hr>
      `;

      const result = converter.convert(testHtml, {
        title: 'Test Page',
        url: 'https://example.com/test',
        author: 'Test Author',
      });

      // Verify settings are applied correctly

      // 1. Markdown flavor (GFM) - tables should work
      expect(result.content).toContain('| Header 1 | Header 2 |');
      expect(result.content).toContain('| Cell 1 | Cell 2 |');

      // 2. Heading levels (max 3, so h4 becomes bold)
      expect(result.content).toContain('# Main Title');
      expect(result.content).toContain('## Subtitle');
      expect(result.content).toContain('### Section');
      expect(result.content).toContain('**Subsection**');

      // 3. Bold and italic styles
      expect(result.content).toContain('**bold**');
      expect(result.content).toContain('*italic*');

      // 4. List markers
      expect(result.content).toMatch(/-\s+List item 1/);
      expect(result.content).toMatch(/-\s+List item 2/);

      // 5. Link tracking removal
      expect(result.content).toContain('https://example.com?id=123');
      expect(result.content).not.toContain('utm_source');

      // 6. Image handling
      expect(result.content).toContain('![Test Image]');
      expect(result.content).toContain('![Custom Image]'); // Fallback alt text

      // 7. Content filtering (script and ads removed)
      expect(result.content).not.toContain('console.log');
      expect(result.content).not.toContain('Advertisement');

      // 8. Blockquote
      expect(result.content).toContain('> A quote');

      // 9. Code block
      expect(result.content).toContain('```');
      expect(result.content).toContain('const code = true;');

      // 10. HR style
      expect(result.content).toContain('---');

      // 11. Metadata (when enabled)
      expect(result.content).toContain('title: "Test Page"');
      expect(result.content).toContain('url: https://example.com/test');
      expect(result.content).toContain('author: "Test Author"');
      expect(result.content).toContain('profile: Test Profile');
    });

    it('should handle different markdown flavors correctly', async () => {
      // Test minimal flavor
      const minimalProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        markdownFlavor: MarkdownFlavor.MINIMAL,
        outputFormat: {
          ...DEFAULT_PROFILE.outputFormat,
          addMetadata: false,
        },
      };

      const minimalConverter = new MarkdownConverter(minimalProfile);
      const html = '<h1>Title</h1><p>Content</p>';
      const minimalResult = minimalConverter.convert(html, { title: 'Test' });

      // Minimal should not have metadata
      expect(minimalResult.content).not.toContain('---');
      expect(minimalResult.content).not.toContain('title:');

      // Test GitHub flavor
      const githubProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        markdownFlavor: MarkdownFlavor.GITHUB,
      };

      const githubConverter = new MarkdownConverter(githubProfile);
      const githubHtml = '<table><tr><th>A</th></tr><tr><td>B</td></tr></table>';
      const githubResult = githubConverter.convert(githubHtml);

      // GitHub should support tables
      expect(githubResult.content).toContain('| A |');
      expect(githubResult.content).toContain('| B |');
    });

    it('should apply image handling strategies correctly', async () => {
      // Test SKIP strategy
      const skipProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        imageHandling: {
          ...DEFAULT_PROFILE.imageHandling,
          strategy: ImageStrategy.SKIP,
        },
      };

      const skipConverter = new MarkdownConverter(skipProfile);
      const imgHtml = '<p>Before <img src="test.jpg" alt="Test"> After</p>';
      const skipResult = skipConverter.convert(imgHtml);

      expect(skipResult.content).toContain('Before');
      expect(skipResult.content).toContain('After');
      expect(skipResult.content).not.toContain('![');
      expect(skipResult.content).not.toContain('test.jpg');

      // Test LINK strategy with fallback
      const linkProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        imageHandling: {
          strategy: ImageStrategy.LINK,
          lazyLoadHandling: true,
          fallbackAltText: 'No Description',
          maxWidth: 0,
        },
      };

      const linkConverter = new MarkdownConverter(linkProfile);
      const noAltHtml = '<img src="image.png">';
      const linkResult = linkConverter.convert(noAltHtml);

      expect(linkResult.content).toContain('![No Description]');
    });

    it('should apply link handling settings correctly', async () => {
      // Test REMOVE style
      const removeProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        linkHandling: {
          ...DEFAULT_PROFILE.linkHandling,
          style: LinkStyle.REMOVE,
        },
      };

      const removeConverter = new MarkdownConverter(removeProfile);
      const linkHtml = '<a href="https://example.com">Click here</a>';
      const removeResult = removeConverter.convert(linkHtml);

      expect(removeResult.content).toContain('Click here');
      expect(removeResult.content).not.toContain('[Click here]');
      expect(removeResult.content).not.toContain('https://example.com');

      // Test tracking removal
      const trackingProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        linkHandling: {
          ...DEFAULT_PROFILE.linkHandling,
          removeTrackingParams: true,
        },
      };

      const trackingConverter = new MarkdownConverter(trackingProfile);
      const trackingHtml = '<a href="https://example.com?utm_campaign=test&utm_source=email&page=1">Link</a>';
      const trackingResult = trackingConverter.convert(trackingHtml);

      expect(trackingResult.content).toContain('https://example.com?page=1');
      expect(trackingResult.content).not.toContain('utm_campaign');
      expect(trackingResult.content).not.toContain('utm_source');
    });

    it('should apply content filtering correctly', async () => {
      const filterProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        contentFilters: {
          ...DEFAULT_PROFILE.contentFilters,
          excludeCss: ['script', 'style', 'noscript'],
          includeCss: [], // Use all content except excluded
          includeHidden: false,
          maxHeadingLevel: 2,
        },
      };

      const filterConverter = new MarkdownConverter(filterProfile);
      const filterHtml = `
        <h1>H1</h1>
        <h2>H2</h2>
        <h3>H3 should become bold</h3>
        <script>alert('remove');</script>
        <style>.test { color: red; }</style>
        <noscript>No JS</noscript>
        <p>Keep this content</p>
      `;
      const filterResult = filterConverter.convert(filterHtml);

      expect(filterResult.content).toContain('# H1');
      expect(filterResult.content).toContain('## H2');
      expect(filterResult.content).toContain('**H3 should become bold**');
      expect(filterResult.content).not.toContain('alert');
      expect(filterResult.content).not.toContain('color: red');
      expect(filterResult.content).not.toContain('No JS');
      expect(filterResult.content).toContain('Keep this content');
    });

    it('should apply formatting options correctly', async () => {
      const formatProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        formatting: {
          ...DEFAULT_PROFILE.formatting,
          boldStyle: '__',
          italicStyle: '_',
          hrStyle: '***',
        },
        conversionOptions: {
          ...DEFAULT_PROFILE.conversionOptions,
          strongDelimiter: '__',
          emDelimiter: '_',
          hr: '***',
          bulletListMarker: '*',
          fence: '~~~',
        },
      };

      const formatConverter = new MarkdownConverter(formatProfile);
      const formatHtml = `
        <strong>Bold</strong>
        <em>Italic</em>
        <hr>
        <ul><li>Item</li></ul>
        <pre><code>code</code></pre>
      `;
      const formatResult = formatConverter.convert(formatHtml);

      expect(formatResult.content).toContain('__Bold__');
      expect(formatResult.content).toContain('_Italic_');
      expect(formatResult.content).toContain('***');
      expect(formatResult.content).toMatch(/\*\s+Item/);
      expect(formatResult.content).toContain('~~~');
    });
  });

  describe('Storage and Persistence', () => {
    it('should save and retrieve profiles with all settings intact', async () => {
      // Mock browser storage
      let storedData: any = {};

      browser.storage.sync.get = vi.fn().mockImplementation((keys) => {
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: storedData[keys] });
        }
        return Promise.resolve({});
      });

      browser.storage.sync.set = vi.fn().mockImplementation((data) => {
        Object.assign(storedData, data);
        return Promise.resolve();
      });

      // Create a complex profile
      const complexProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        id: 'complex',
        name: 'Complex Profile',
        markdownFlavor: MarkdownFlavor.GITHUB,
        imageHandling: {
          strategy: ImageStrategy.SKIP,
          lazyLoadHandling: false,
          fallbackAltText: 'Image',
          maxWidth: 1200,
        },
        linkHandling: {
          style: LinkStyle.ABSOLUTE,
          openInNewTab: true,
          shortenUrls: true,
          convertRelativeUrls: false,
          removeTrackingParams: true,
          followRedirects: true,
        },
        contentFilters: {
          includeCss: ['.main', '#content'],
          excludeCss: ['.sidebar', '.footer'],
          includeHidden: true,
          includeComments: true,
          includeScripts: false,
          includeIframes: true,
          maxHeadingLevel: 4,
          minContentLength: 10,
        },
        formatting: {
          lineWidth: 100,
          codeBlockSyntax: false,
          tableAlignment: false,
          listIndentation: 4,
          boldStyle: '__',
          italicStyle: '_',
          hrStyle: '===',
        },
        outputFormat: {
          addMetadata: false,
          addTableOfContents: true,
          addFootnotes: false,
          wrapLineLength: 80,
          preserveNewlines: true,
        },
      };

      // Save the profile
      await storage.saveProfile(complexProfile);

      // Retrieve the profile
      const retrieved = await storage.getProfile('complex');

      // Verify all settings are preserved
      expect(retrieved).toBeDefined();
      expect(retrieved?.markdownFlavor).toBe(MarkdownFlavor.GITHUB);
      expect(retrieved?.imageHandling.strategy).toBe(ImageStrategy.SKIP);
      expect(retrieved?.linkHandling.removeTrackingParams).toBe(true);
      expect(retrieved?.contentFilters.includeCss).toEqual(['.main', '#content']);
      expect(retrieved?.formatting.boldStyle).toBe('__');
      expect(retrieved?.outputFormat.addTableOfContents).toBe(true);
    });

    it('should apply user preferences correctly', async () => {
      // Mock browser storage
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        preferences: {
          ...DEFAULT_PREFERENCES,
          defaultProfile: 'custom',
          autoDownload: true,
          fileNamingPattern: 'timestamp',
          showNotifications: false,
          theme: 'dark',
        },
      });

      const preferences = await storage.getPreferences();

      expect(preferences.defaultProfile).toBe('custom');
      expect(preferences.autoDownload).toBe(true);
      expect(preferences.fileNamingPattern).toBe('timestamp');
      expect(preferences.showNotifications).toBe(false);
      expect(preferences.theme).toBe('dark');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle complex Wikipedia-style content correctly', async () => {
      const wikiProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        markdownFlavor: MarkdownFlavor.GFM,
        contentFilters: {
          ...DEFAULT_PROFILE.contentFilters,
          excludeCss: ['script', 'style', '.navbox', '.mw-editsection'],
          maxHeadingLevel: 6,
        },
      };

      const converter = new MarkdownConverter(wikiProfile);
      const wikiHtml = `
        <h1>Article Title</h1>
        <div class="mw-editsection">[edit]</div>
        <p>Lead paragraph with <a href="/wiki/Link">internal link</a>.</p>
        <h2>Contents</h2>
        <ol>
          <li>Introduction</li>
          <li>History</li>
        </ol>
        <h2>Introduction</h2>
        <p>Content with <sup>[1]</sup> citation.</p>
        <table class="infobox">
          <tr><th>Type</th><td>Encyclopedia</td></tr>
        </table>
        <div class="navbox">Navigation box to remove</div>
      `;

      const result = converter.convert(wikiHtml);

      expect(result.content).toContain('# Article Title');
      expect(result.content).not.toContain('[edit]');
      expect(result.content).toContain('[internal link]');
      expect(result.content).toContain('1. Introduction');
      expect(result.content).toContain('| Type | Encyclopedia |');
      expect(result.content).not.toContain('Navigation box');
    });

    it('should handle blog post content with code blocks correctly', async () => {
      const blogProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        markdownFlavor: MarkdownFlavor.GFM,
        outputFormat: {
          ...DEFAULT_PROFILE.outputFormat,
          addMetadata: true,
        },
      };

      const converter = new MarkdownConverter(blogProfile);
      const blogHtml = `
        <article>
          <h1>How to Use TypeScript</h1>
          <p class="meta">By John Doe on January 1, 2024</p>
          <p>TypeScript is a typed superset of JavaScript.</p>
          <pre><code class="language-typescript">
interface User {
  name: string;
  age: number;
}
          </code></pre>
          <p>This helps catch errors at compile time.</p>
        </article>
      `;

      const result = converter.convert(blogHtml, {
        title: 'How to Use TypeScript',
        author: 'John Doe',
        url: 'https://blog.example.com/typescript',
      });

      expect(result.content).toContain('# How to Use TypeScript');
      expect(result.content).toContain('```');
      expect(result.content).toContain('interface User');
      expect(result.content).toContain('name: string');
      expect(result.content).toContain('author: "John Doe"');
    });
  });
});