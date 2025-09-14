/**
 * Tests to verify all settings have proper effects on conversion
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownConverter } from '~/services/converter';
import type { ConversionProfile } from '~/types/storage';
import { DEFAULT_PROFILE, MarkdownFlavor, ImageStrategy, LinkStyle } from '~/types/storage';

describe('Settings Effects on Conversion', () => {
  let profile: ConversionProfile;

  beforeEach(() => {
    profile = { ...DEFAULT_PROFILE };
  });

  describe('Markdown Flavor Settings', () => {
    it('should apply CommonMark flavor correctly', () => {
      profile.markdownFlavor = MarkdownFlavor.COMMONMARK;
      const converter = new MarkdownConverter(profile);

      const html = '<h1>Title</h1><p>Text with <del>strikethrough</del></p>';
      const result = converter.convert(html);

      expect(result.content).toContain('# Title');
      // CommonMark doesn't support strikethrough
      expect(result.content).not.toContain('~~strikethrough~~');
    });

    it('should apply GFM flavor with tables and strikethrough', () => {
      profile.markdownFlavor = MarkdownFlavor.GFM;
      const converter = new MarkdownConverter(profile);

      const html = `
        <table>
          <tr><th>Name</th><th>Value</th></tr>
          <tr><td>Test</td><td>123</td></tr>
        </table>
        <del>strikethrough</del>
      `;
      const result = converter.convert(html);

      expect(result.content).toContain('| Name | Value |');
      expect(result.content).toContain('| Test | 123 |');
      expect(result.content).toContain('~~strikethrough~~');
    });

    it('should apply minimal flavor without metadata', () => {
      profile.markdownFlavor = MarkdownFlavor.MINIMAL;
      const converter = new MarkdownConverter(profile);

      const html = '<h1>Title</h1><p>Content</p>';
      const result = converter.convert(html, {
        title: 'Test',
        url: 'https://example.com'
      });

      expect(result.content).not.toContain('---');
      expect(result.content).not.toContain('title:');
      expect(result.content).not.toContain('url:');
    });
  });

  describe('Image Handling Settings', () => {
    it('should skip images when strategy is SKIP', () => {
      profile.imageHandling.strategy = ImageStrategy.SKIP;
      const converter = new MarkdownConverter(profile);

      const html = '<p>Text before <img src="test.jpg" alt="Test"> text after</p>';
      const result = converter.convert(html);

      expect(result.content).toContain('Text before');
      expect(result.content).toContain('text after');
      expect(result.content).not.toContain('![');
      expect(result.content).not.toContain('test.jpg');
    });

    it('should convert images to links when strategy is LINK', () => {
      profile.imageHandling.strategy = ImageStrategy.LINK;
      const converter = new MarkdownConverter(profile);

      const html = '<img src="https://example.com/image.jpg" alt="Test Image">';
      const result = converter.convert(html);

      expect(result.content).toContain('![Test Image](https://example.com/image.jpg)');
    });

    it('should use fallback alt text when image has no alt', () => {
      profile.imageHandling.strategy = ImageStrategy.LINK;
      profile.imageHandling.fallbackAltText = 'Fallback Text';
      const converter = new MarkdownConverter(profile);

      const html = '<img src="test.jpg">';
      const result = converter.convert(html);

      expect(result.content).toContain('![Fallback Text](test.jpg)');
    });
  });

  describe('Link Handling Settings', () => {
    it('should remove links when style is REMOVE', () => {
      profile.linkHandling.style = LinkStyle.REMOVE;
      const converter = new MarkdownConverter(profile);

      const html = '<a href="https://example.com">Click here</a>';
      const result = converter.convert(html);

      expect(result.content).toContain('Click here');
      expect(result.content).not.toContain('[Click here]');
      expect(result.content).not.toContain('https://example.com');
    });

    it('should remove tracking parameters when enabled', () => {
      profile.linkHandling.removeTrackingParams = true;
      const converter = new MarkdownConverter(profile);

      const html = '<a href="https://example.com?utm_source=test&utm_campaign=abc&id=123">Link</a>';
      const result = converter.convert(html);

      expect(result.content).toContain('https://example.com?id=123');
      expect(result.content).not.toContain('utm_source');
      expect(result.content).not.toContain('utm_campaign');
    });

    it('should keep tracking parameters when disabled', () => {
      profile.linkHandling.removeTrackingParams = false;
      const converter = new MarkdownConverter(profile);

      const html = '<a href="https://example.com?utm_source=test">Link</a>';
      const result = converter.convert(html);

      expect(result.content).toContain('utm_source=test');
    });
  });

  describe('Content Filtering Settings', () => {
    it('should respect maxHeadingLevel setting', () => {
      profile.contentFilters.maxHeadingLevel = 3;
      const converter = new MarkdownConverter(profile);

      const html = `
        <h1>H1</h1>
        <h2>H2</h2>
        <h3>H3</h3>
        <h4>H4</h4>
        <h5>H5</h5>
        <h6>H6</h6>
      `;
      const result = converter.convert(html);

      expect(result.content).toContain('# H1');
      expect(result.content).toContain('## H2');
      expect(result.content).toContain('### H3');
      // H4-H6 should be converted to bold text
      expect(result.content).toContain('**H4**');
      expect(result.content).toContain('**H5**');
      expect(result.content).toContain('**H6**');
      expect(result.content).not.toContain('#### H4');
    });

    it('should exclude elements matching excludeCss selectors', () => {
      profile.contentFilters.excludeCss = ['script', 'style', 'noscript'];
      const converter = new MarkdownConverter(profile);

      const html = `
        <p>Keep this</p>
        <script>console.log('remove');</script>
        <style>.test { color: red; }</style>
        <noscript>No JS</noscript>
      `;
      const result = converter.convert(html);

      expect(result.content).toContain('Keep this');
      expect(result.content).not.toContain('console.log');
      expect(result.content).not.toContain('color: red');
      expect(result.content).not.toContain('No JS');
    });

    it('should include only elements matching includeCss when specified', () => {
      profile.contentFilters.includeCss = ['.important', 'h1'];
      const converter = new MarkdownConverter(profile);

      const html = `
        <h1>Important Title</h1>
        <p class="important">Keep this</p>
        <p>Remove this</p>
        <div>Also remove this</div>
      `;
      const result = converter.convert(html);

      expect(result.content).toContain('Important Title');
      expect(result.content).toContain('Keep this');
      expect(result.content).not.toContain('Remove this');
      expect(result.content).not.toContain('Also remove this');
    });
  });

  describe('Formatting Settings', () => {
    it('should use specified bold style', () => {
      profile.formatting.boldStyle = '__';
      profile.conversionOptions.strongDelimiter = '__';
      const converter = new MarkdownConverter(profile);

      const html = '<strong>Bold text</strong>';
      const result = converter.convert(html);

      expect(result.content).toContain('__Bold text__');
      expect(result.content).not.toContain('**Bold text**');
    });

    it('should use specified italic style', () => {
      profile.formatting.italicStyle = '_';
      profile.conversionOptions.emDelimiter = '_';
      const converter = new MarkdownConverter(profile);

      const html = '<em>Italic text</em>';
      const result = converter.convert(html);

      expect(result.content).toContain('_Italic text_');
      expect(result.content).not.toContain('*Italic text*');
    });

    it('should use specified HR style', () => {
      profile.formatting.hrStyle = '***';
      profile.conversionOptions.hr = '***';
      const converter = new MarkdownConverter(profile);

      const html = '<hr>';
      const result = converter.convert(html);

      expect(result.content).toContain('***');
    });

    it('should use specified bullet list marker', () => {
      profile.conversionOptions.bulletListMarker = '*';
      const converter = new MarkdownConverter(profile);

      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = converter.convert(html);

      expect(result.content).toContain('* Item 1');
      expect(result.content).toContain('* Item 2');
    });

    it('should use specified code fence style', () => {
      profile.conversionOptions.fence = '~~~';
      const converter = new MarkdownConverter(profile);

      const html = '<pre><code>code block</code></pre>';
      const result = converter.convert(html);

      expect(result.content).toContain('~~~');
      expect(result.content).toContain('code block');
    });

    it('should wrap lines when lineWidth is specified', () => {
      profile.formatting.lineWidth = 40;
      const converter = new MarkdownConverter(profile);

      const html = '<p>This is a very long line of text that should be wrapped at the specified width to ensure readability.</p>';
      const result = converter.convert(html);

      const lines = result.content.split('\n');
      const longLines = lines.filter(line =>
        !line.startsWith('#') &&
        !line.startsWith('```') &&
        line.length > 40
      );

      expect(longLines.length).toBe(0);
    });
  });

  describe('Output Format Settings', () => {
    it('should add metadata when enabled', () => {
      profile.outputFormat.addMetadata = true;
      const converter = new MarkdownConverter(profile);

      const html = '<p>Content</p>';
      const result = converter.convert(html, {
        title: 'Test Page',
        url: 'https://example.com',
        author: 'John Doe',
        description: 'Test description'
      });

      expect(result.content).toContain('---');
      expect(result.content).toContain('title: "Test Page"');
      expect(result.content).toContain('url: https://example.com');
      expect(result.content).toContain('author: "John Doe"');
      expect(result.content).toContain('description: "Test description"');
      expect(result.content).toContain('converted:');
      expect(result.content).toContain('profile: ' + profile.name);
    });

    it('should not add metadata when disabled', () => {
      profile.outputFormat.addMetadata = false;
      const converter = new MarkdownConverter(profile);

      const html = '<p>Content</p>';
      const result = converter.convert(html, {
        title: 'Test Page',
        url: 'https://example.com'
      });

      expect(result.content).not.toContain('---');
      expect(result.content).not.toContain('title:');
      expect(result.content).not.toContain('url:');
    });
  });

  describe('File Naming Settings', () => {
    it('should generate correct filename from title', () => {
      const converter = new MarkdownConverter(profile);

      const html = '<p>Content</p>';
      const result = converter.convert(html, {
        title: 'Test Page Title!@#$%^&*()'
      });

      expect(result.fileName).toBe('test-page-title.md');
    });

    it('should handle empty title gracefully', () => {
      const converter = new MarkdownConverter(profile);

      const html = '<p>Content</p>';
      const result = converter.convert(html);

      expect(result.fileName).toBe('document.md');
    });

    it('should limit filename length', () => {
      const converter = new MarkdownConverter(profile);

      const veryLongTitle = 'a'.repeat(200);
      const html = '<p>Content</p>';
      const result = converter.convert(html, { title: veryLongTitle });

      // Should be truncated to 100 chars + .md
      expect(result.fileName.length).toBeLessThanOrEqual(104);
      expect(result.fileName.endsWith('.md')).toBe(true);
    });
  });

  describe('Different Markdown Flavors', () => {
    it('should apply GitHub flavor settings', () => {
      profile.markdownFlavor = MarkdownFlavor.GITHUB;
      const converter = new MarkdownConverter(profile);

      const html = `
        <table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>
        <del>deleted</del>
        <pre><code class="language-js">const x = 1;</code></pre>
      `;
      const result = converter.convert(html);

      // GitHub supports tables
      expect(result.content).toContain('| Header |');
      // GitHub supports strikethrough
      expect(result.content).toContain('~~deleted~~');
      // Should have code block
      expect(result.content).toContain('const x = 1;');
    });

    it('should apply Reddit flavor settings', () => {
      profile.markdownFlavor = MarkdownFlavor.REDDIT;
      const converter = new MarkdownConverter(profile);

      const html = '<h1>Title</h1><p>Text with **bold** and *italic*</p>';
      const result = converter.convert(html);

      expect(result.content).toContain('# Title');
      expect(result.content).toContain('**bold**');
      expect(result.content).toContain('*italic*');
    });

    it('should apply Discord flavor settings', () => {
      profile.markdownFlavor = MarkdownFlavor.DISCORD;
      const converter = new MarkdownConverter(profile);

      const html = '<h1>Title</h1><blockquote>Quote</blockquote>';
      const result = converter.convert(html);

      expect(result.content).toContain('# Title');
      expect(result.content).toContain('> Quote');
    });
  });

  describe('Complex Settings Combinations', () => {
    it('should handle multiple settings together correctly', () => {
      // Configure multiple settings
      profile.markdownFlavor = MarkdownFlavor.GFM;
      profile.imageHandling.strategy = ImageStrategy.SKIP;
      profile.linkHandling.removeTrackingParams = true;
      profile.contentFilters.maxHeadingLevel = 2;
      profile.contentFilters.excludeCss = ['script', 'style'];
      profile.outputFormat.addMetadata = true;
      profile.formatting.boldStyle = '__';
      profile.conversionOptions.strongDelimiter = '__';

      const converter = new MarkdownConverter(profile);

      const html = `
        <h1>Main Title</h1>
        <h2>Subtitle</h2>
        <h3>Section</h3>
        <p>Paragraph with <strong>bold</strong> text.</p>
        <img src="image.jpg" alt="Skip me">
        <a href="https://example.com?utm_source=test&id=123">Link</a>
        <script>alert('remove');</script>
        <table><tr><th>Col1</th></tr><tr><td>Data</td></tr></table>
      `;

      const result = converter.convert(html, {
        title: 'Test Page',
        url: 'https://example.com'
      });

      // Check all effects are applied
      expect(result.content).toContain('# Main Title');
      expect(result.content).toContain('## Subtitle');
      expect(result.content).toContain('**Section**'); // H3 converted to bold
      expect(result.content).toContain('__bold__'); // Custom bold style
      expect(result.content).not.toContain('image.jpg'); // Images skipped
      expect(result.content).toContain('https://example.com?id=123'); // Tracking removed
      expect(result.content).not.toContain('utm_source'); // Tracking removed
      expect(result.content).not.toContain('alert'); // Script excluded
      expect(result.content).toContain('| Col1 |'); // GFM tables work
      expect(result.content).toContain('---'); // Metadata added
      expect(result.content).toContain('title: "Test Page"'); // Metadata added
    });
  });
});