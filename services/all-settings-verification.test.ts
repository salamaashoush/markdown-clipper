/**
 * Comprehensive test to verify EVERY setting has proper effect on conversion
 */

import { describe, it, expect } from 'vitest';
import { MarkdownConverter } from '~/services/converter';
import type { ConversionProfile } from '~/types/storage';
import {
  DEFAULT_PROFILE,
  MarkdownFlavor,
  ImageStrategy,
  LinkStyle
} from '~/types/storage';

describe('Complete Settings Verification - Every Setting Must Work', () => {

  describe('1. Markdown Flavor Settings', () => {
    const testHtml = `
      <h1>Title</h1>
      <table><tr><th>A</th></tr><tr><td>B</td></tr></table>
      <del>deleted</del>
      <pre><code>code</code></pre>
    `;

    it('COMMONMARK: should NOT support tables or strikethrough', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        markdownFlavor: MarkdownFlavor.COMMONMARK,
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert(testHtml);

      // CommonMark doesn't support GFM tables
      expect(result.content).not.toContain('| A |');
      // CommonMark doesn't support strikethrough
      expect(result.content).not.toContain('~~deleted~~');
    });

    it('GFM: should support tables and strikethrough', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        markdownFlavor: MarkdownFlavor.GFM,
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert(testHtml);

      expect(result.content).toContain('| A |');
      expect(result.content).toContain('| B |');
      expect(result.content).toContain('~~deleted~~');
    });

    it('GITHUB: should support GitHub-specific features', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        markdownFlavor: MarkdownFlavor.GITHUB,
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert(testHtml);

      expect(result.content).toContain('| A |');
      expect(result.content).toContain('~~deleted~~');
    });

    it('MINIMAL: should not add metadata', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        markdownFlavor: MarkdownFlavor.MINIMAL,
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert('<p>Test</p>', { title: 'Test' });

      expect(result.content).not.toContain('---');
      expect(result.content).not.toContain('title:');
    });
  });

  describe('2. Image Handling Settings', () => {
    const imgHtml = '<img src="test.jpg" alt="Test Alt">';
    const noAltHtml = '<img src="test.jpg">';

    it('strategy=LINK: should convert images to markdown links', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        imageHandling: {
          strategy: ImageStrategy.LINK,
          lazyLoadHandling: false,
          fallbackAltText: 'Fallback',
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert(imgHtml);

      expect(result.content).toContain('![Test Alt]');
    });

    it('strategy=SKIP: should completely remove images', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        imageHandling: {
          strategy: ImageStrategy.SKIP,
          lazyLoadHandling: false,
          fallbackAltText: 'Fallback',
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert(imgHtml);

      expect(result.content).not.toContain('![');
      expect(result.content).not.toContain('test.jpg');
    });

    it('fallbackAltText: should use fallback when no alt provided', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        imageHandling: {
          strategy: ImageStrategy.LINK,
          lazyLoadHandling: false,
          fallbackAltText: 'Custom Fallback Text',
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert(noAltHtml);

      expect(result.content).toContain('![Custom Fallback Text]');
    });
  });

  describe('3. Link Handling Settings', () => {
    it('style=ABSOLUTE: should keep links', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        linkHandling: {
          ...DEFAULT_PROFILE.linkHandling,
          style: LinkStyle.ABSOLUTE,
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert('<a href="https://example.com">Link</a>');

      expect(result.content).toContain('[Link](https://example.com)');
    });

    it('style=REMOVE: should remove links completely', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        linkHandling: {
          ...DEFAULT_PROFILE.linkHandling,
          style: LinkStyle.REMOVE,
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert('<a href="https://example.com">Link Text</a>');

      expect(result.content).toContain('Link Text');
      expect(result.content).not.toContain('[Link Text]');
      expect(result.content).not.toContain('https://example.com');
    });

    it('removeTrackingParams=true: should remove UTM parameters', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        linkHandling: {
          ...DEFAULT_PROFILE.linkHandling,
          removeTrackingParams: true,
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert(
        '<a href="https://example.com?utm_source=test&utm_medium=email&id=123&fbclid=xyz">Link</a>'
      );

      expect(result.content).toContain('https://example.com?id=123');
      expect(result.content).not.toContain('utm_source');
      expect(result.content).not.toContain('utm_medium');
      expect(result.content).not.toContain('fbclid');
    });

    it('removeTrackingParams=false: should keep all parameters', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        linkHandling: {
          ...DEFAULT_PROFILE.linkHandling,
          removeTrackingParams: false,
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert(
        '<a href="https://example.com?utm_source=test">Link</a>'
      );

      expect(result.content).toContain('utm_source=test');
    });
  });

  describe('4. Content Filters', () => {
    it('excludeCss: should exclude matching selectors', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        contentFilters: {
          ...DEFAULT_PROFILE.contentFilters,
          excludeCss: ['script', 'style', 'noscript'],
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert(`
        <p>Keep this</p>
        <script>console.log('remove');</script>
        <style>.test { color: red; }</style>
        <noscript>No JS</noscript>
      `);

      expect(result.content).toContain('Keep this');
      expect(result.content).not.toContain('console.log');
      expect(result.content).not.toContain('color: red');
      expect(result.content).not.toContain('No JS');
    });

    it('includeCss: should only include matching selectors', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        contentFilters: {
          ...DEFAULT_PROFILE.contentFilters,
          includeCss: ['.important'],
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert(`
        <p class="important">Keep this</p>
        <p>Remove this</p>
        <div>Also remove</div>
      `);

      expect(result.content).toContain('Keep this');
      expect(result.content).not.toContain('Remove this');
      expect(result.content).not.toContain('Also remove');
    });

    it('includeHidden=false: should exclude hidden elements', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        contentFilters: {
          ...DEFAULT_PROFILE.contentFilters,
          includeHidden: false,
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert(`
        <p>Visible</p>
        <p style="display: none">Hidden</p>
        <p hidden>Also Hidden</p>
      `);

      expect(result.content).toContain('Visible');
      expect(result.content).not.toContain('Hidden');
      expect(result.content).not.toContain('Also Hidden');
    });

    it('maxHeadingLevel: should convert higher headings to bold', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        contentFilters: {
          ...DEFAULT_PROFILE.contentFilters,
          maxHeadingLevel: 2,
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert(`
        <h1>H1</h1>
        <h2>H2</h2>
        <h3>H3</h3>
        <h4>H4</h4>
        <h5>H5</h5>
        <h6>H6</h6>
      `);

      expect(result.content).toContain('# H1');
      expect(result.content).toContain('## H2');
      expect(result.content).toContain('**H3**');
      expect(result.content).toContain('**H4**');
      expect(result.content).toContain('**H5**');
      expect(result.content).toContain('**H6**');
    });
  });

  describe('5. Formatting Options', () => {
    it('boldStyle: should use specified bold delimiter', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        formatting: {
          ...DEFAULT_PROFILE.formatting,
          boldStyle: '__',
        },
        conversionOptions: {
          ...DEFAULT_PROFILE.conversionOptions,
          strongDelimiter: '__',
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert('<strong>Bold</strong>');

      expect(result.content).toContain('__Bold__');
      expect(result.content).not.toContain('**Bold**');
    });

    it('italicStyle: should use specified italic delimiter', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        formatting: {
          ...DEFAULT_PROFILE.formatting,
          italicStyle: '_',
        },
        conversionOptions: {
          ...DEFAULT_PROFILE.conversionOptions,
          emDelimiter: '_',
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert('<em>Italic</em>');

      expect(result.content).toContain('_Italic_');
      expect(result.content).not.toContain('*Italic*');
    });

    it('hrStyle: should use specified horizontal rule style', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        formatting: {
          ...DEFAULT_PROFILE.formatting,
          hrStyle: '***',
        },
        conversionOptions: {
          ...DEFAULT_PROFILE.conversionOptions,
          hr: '***',
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert('<hr>');

      expect(result.content).toContain('***');
    });

    it('listIndentation: should affect list formatting', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        formatting: {
          ...DEFAULT_PROFILE.formatting,
          listIndentation: 4,
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert('<ul><li>Item</li></ul>');

      // Turndown adds spaces for indentation
      expect(result.content).toMatch(/-\s+Item/);
    });

    it('codeBlockSyntax: should use fenced code blocks', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        formatting: {
          ...DEFAULT_PROFILE.formatting,
          codeBlockSyntax: true,
        },
        conversionOptions: {
          ...DEFAULT_PROFILE.conversionOptions,
          codeBlockStyle: 'fenced',
          fence: '```',
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert('<pre><code>code</code></pre>');

      expect(result.content).toContain('```');
    });

    it('lineWidth: should wrap long lines', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        formatting: {
          ...DEFAULT_PROFILE.formatting,
          lineWidth: 40,
        },
      };
      const converter = new MarkdownConverter(profile);
      const longText = 'This is a very long line of text that should be wrapped at the specified width to ensure readability.';
      const result = converter.convert(`<p>${longText}</p>`);

      const lines = result.content.split('\n');
      const longLines = lines.filter(line =>
        !line.startsWith('#') &&
        !line.startsWith('```') &&
        line.length > 40
      );

      expect(longLines.length).toBe(0);
    });
  });

  describe('6. Conversion Options', () => {
    it('headingStyle=atx: should use # style headings', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        conversionOptions: {
          ...DEFAULT_PROFILE.conversionOptions,
          headingStyle: 'atx',
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert('<h1>Title</h1><h2>Subtitle</h2>');

      expect(result.content).toContain('# Title');
      expect(result.content).toContain('## Subtitle');
    });

    it('bulletListMarker: should use specified marker', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        conversionOptions: {
          ...DEFAULT_PROFILE.conversionOptions,
          bulletListMarker: '*',
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert('<ul><li>Item</li></ul>');

      expect(result.content).toMatch(/\*\s+Item/);
    });

    it('codeBlockStyle=fenced: should use fences', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        conversionOptions: {
          ...DEFAULT_PROFILE.conversionOptions,
          codeBlockStyle: 'fenced',
          fence: '~~~',
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert('<pre><code>code</code></pre>');

      expect(result.content).toContain('~~~');
    });

    it('linkStyle=inlined: should use inline links', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        conversionOptions: {
          ...DEFAULT_PROFILE.conversionOptions,
          linkStyle: 'inlined',
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert('<a href="https://example.com">Link</a>');

      expect(result.content).toContain('[Link](https://example.com)');
    });
  });

  describe('7. Output Format Options', () => {
    it('addMetadata=true: should add frontmatter', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        outputFormat: {
          ...DEFAULT_PROFILE.outputFormat,
          addMetadata: true,
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert('<p>Content</p>', {
        title: 'Test Page',
        url: 'https://example.com',
        author: 'John Doe',
        description: 'Test description',
      });

      expect(result.content).toContain('---');
      expect(result.content).toContain('title: "Test Page"');
      expect(result.content).toContain('url: https://example.com');
      expect(result.content).toContain('author: "John Doe"');
      expect(result.content).toContain('description: "Test description"');
      expect(result.content).toContain('converted:');
      expect(result.content).toContain('converter: Copy as Markdown Extension');
      expect(result.content).toContain('profile: Default');
    });

    it('addMetadata=false: should not add frontmatter', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        outputFormat: {
          ...DEFAULT_PROFILE.outputFormat,
          addMetadata: false,
        },
      };
      const converter = new MarkdownConverter(profile);
      const result = converter.convert('<p>Content</p>', {
        title: 'Test Page',
      });

      expect(result.content).not.toContain('---');
      expect(result.content).not.toContain('title:');
    });
  });

  describe('8. File Naming', () => {
    it('should generate correct filename from title', () => {
      const converter = new MarkdownConverter(DEFAULT_PROFILE);
      const result = converter.convert('<p>Content</p>', {
        title: 'Test Page Title!@#$%^&*()',
      });

      expect(result.fileName).toBe('test-page-title.md');
    });

    it('should limit filename length', () => {
      const converter = new MarkdownConverter(DEFAULT_PROFILE);
      const veryLongTitle = 'a'.repeat(200);
      const result = converter.convert('<p>Content</p>', {
        title: veryLongTitle,
      });

      expect(result.fileName.length).toBeLessThanOrEqual(104); // 100 chars + .md
    });

    it('should use default filename when no title', () => {
      const converter = new MarkdownConverter(DEFAULT_PROFILE);
      const result = converter.convert('<p>Content</p>');

      expect(result.fileName).toBe('document.md');
    });
  });

  describe('9. Document Properties', () => {
    it('should calculate document size in bytes', () => {
      const converter = new MarkdownConverter(DEFAULT_PROFILE);
      const result = converter.convert('<p>Test content</p>');

      expect(result.sizeBytes).toBeGreaterThan(0);
      expect(typeof result.sizeBytes).toBe('number');

      // Size should be the byte length of the content
      const expectedSize = new TextEncoder().encode(result.content).length;
      expect(result.sizeBytes).toBe(expectedSize);
    });

    it('should generate checksum', () => {
      const converter = new MarkdownConverter(DEFAULT_PROFILE);
      const result = converter.convert('<p>Test content</p>');

      expect(result.checksum).toBeDefined();
      expect(result.checksum!.length).toBeGreaterThan(0);
      expect(typeof result.checksum).toBe('string');
    });

    it('should have different checksums for different content', () => {
      const converter = new MarkdownConverter(DEFAULT_PROFILE);
      const result1 = converter.convert('<p>Content 1</p>');
      const result2 = converter.convert('<p>Content 2</p>');

      expect(result1.checksum).not.toBe(result2.checksum);
    });

    it('should include metadata in document', () => {
      const converter = new MarkdownConverter(DEFAULT_PROFILE);
      const result = converter.convert('<p>Test</p>', {
        title: 'Test Title',
        url: 'https://example.com',
        author: 'Author Name',
        description: 'Description',
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata.title).toBe('Test Title');
      expect(result.metadata.url).toBe('https://example.com');
      expect(result.metadata.author).toBe('Author Name');
      expect(result.metadata.description).toBe('Description');
      expect(result.metadata.convertedAt).toBeDefined();
      expect(result.metadata.converterVersion).toBe('1.0.0');
      expect(result.metadata.profile).toBe('Default');
    });
  });

  describe('10. Edge Cases and Special Handling', () => {
    it('should handle empty HTML gracefully', () => {
      const converter = new MarkdownConverter(DEFAULT_PROFILE);
      const result = converter.convert('');

      expect(result.content).toBeDefined();
      expect(result.fileName).toBe('document.md');
      expect(result.sizeBytes).toBeGreaterThanOrEqual(0);
    });

    it('should handle HTML with only whitespace', () => {
      const converter = new MarkdownConverter(DEFAULT_PROFILE);
      const result = converter.convert('   \n\t   ');

      expect(result.content).toBeDefined();
      expect(result.fileName).toBe('document.md');
    });

    it('should handle malformed HTML', () => {
      const converter = new MarkdownConverter(DEFAULT_PROFILE);
      const result = converter.convert('<p>Unclosed paragraph');

      expect(result.content).toBeDefined();
      expect(result.content).toContain('Unclosed paragraph');
    });

    it('should handle special characters in content', () => {
      const converter = new MarkdownConverter(DEFAULT_PROFILE);
      const result = converter.convert('<p>&lt;&gt;&amp;&quot;&#39;</p>');

      expect(result.content).toContain('<>&"\'');
    });

    it('should preserve code block content exactly', () => {
      const converter = new MarkdownConverter(DEFAULT_PROFILE);
      const codeContent = 'const x = { foo: "bar" };';
      const result = converter.convert(`<pre><code>${codeContent}</code></pre>`);

      expect(result.content).toContain(codeContent);
    });
  });

  describe('11. Multiple Settings Combined', () => {
    it('should apply all settings together correctly', () => {
      const profile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        markdownFlavor: MarkdownFlavor.GFM,
        imageHandling: {
          strategy: ImageStrategy.SKIP,
          lazyLoadHandling: false,
          fallbackAltText: 'Image',
        },
        linkHandling: {
          ...DEFAULT_PROFILE.linkHandling,
          removeTrackingParams: true,
        },
        contentFilters: {
          ...DEFAULT_PROFILE.contentFilters,
          excludeCss: ['script', 'style'],
          maxHeadingLevel: 3,
        },
        formatting: {
          ...DEFAULT_PROFILE.formatting,
          boldStyle: '__',
          italicStyle: '_',
        },
        conversionOptions: {
          ...DEFAULT_PROFILE.conversionOptions,
          strongDelimiter: '__',
          emDelimiter: '_',
          bulletListMarker: '*',
        },
        outputFormat: {
          ...DEFAULT_PROFILE.outputFormat,
          addMetadata: true,
        },
      };

      const converter = new MarkdownConverter(profile);
      const html = `
        <h1>Title</h1>
        <h2>Subtitle</h2>
        <h3>Section</h3>
        <h4>Subsection</h4>
        <p><strong>Bold</strong> and <em>italic</em> text.</p>
        <ul><li>Item</li></ul>
        <table><tr><th>Col</th></tr><tr><td>Data</td></tr></table>
        <img src="image.jpg" alt="Remove me">
        <a href="https://example.com?utm_source=test&id=123">Link</a>
        <script>alert('remove');</script>
      `;

      const result = converter.convert(html, {
        title: 'Test Page',
        url: 'https://example.com',
      });

      // Check all effects are applied
      expect(result.content).toContain('# Title');
      expect(result.content).toContain('## Subtitle');
      expect(result.content).toContain('### Section');
      expect(result.content).toContain('**Subsection**'); // H4 converted to bold
      expect(result.content).toContain('__Bold__'); // Custom bold style
      expect(result.content).toContain('_italic_'); // Custom italic style
      expect(result.content).toMatch(/\*\s+Item/); // Custom bullet marker
      expect(result.content).toContain('| Col |'); // GFM tables
      expect(result.content).not.toContain('image.jpg'); // Images skipped
      expect(result.content).toContain('https://example.com?id=123'); // Tracking removed
      expect(result.content).not.toContain('utm_source');
      expect(result.content).not.toContain('alert'); // Script excluded
      expect(result.content).toContain('---'); // Metadata added
      expect(result.content).toContain('title: "Test Page"');
    });
  });
});