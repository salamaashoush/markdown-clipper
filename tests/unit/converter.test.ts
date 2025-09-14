import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownConverter } from '~/lib/converter/index';
import type { ConversionProfile } from '~/types/storage';
import {
  MarkdownFlavor,
  ImageStrategy,
  LinkStyle,
  BoldStyle,
  ItalicStyle,
} from '~/types/storage';

describe('MarkdownConverter', () => {
  let converter: MarkdownConverter;
  let defaultProfile: ConversionProfile;

  beforeEach(() => {
    defaultProfile = {
      id: 'test',
      name: 'Test Profile',
      isDefault: true,
      isBuiltIn: false,
      markdownFlavor: MarkdownFlavor.GFM,
      imageHandling: {
        strategy: ImageStrategy.LINK,
        lazyLoadHandling: false,
        fallbackAltText: 'Image',
        maxWidth: 0,
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
        excludeCss: ['script', 'style', '.advertisement'],
        includeHidden: false,
        includeComments: false,
        includeScripts: false,
        maxHeadingLevel: 6,
        minContentLength: 0,
      },
      formatting: {
        codeBlockSyntax: true,
        tableAlignment: true,
        listIndentation: 2,
        boldStyle: BoldStyle.ASTERISKS,
        italicStyle: ItalicStyle.ASTERISK,
        hrStyle: '---',
        lineWidth: 0,
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    converter = new MarkdownConverter(defaultProfile);
  });

  describe('Basic HTML to Markdown conversion', () => {
    it('should convert headings correctly', () => {
      const html = '<h1>Main Title</h1><h2>Subtitle</h2><h3>Section</h3>';
      const result = converter.convert(html);

      expect(result.content).toContain('# Main Title');
      expect(result.content).toContain('## Subtitle');
      expect(result.content).toContain('### Section');
    });

    it('should convert paragraphs', () => {
      const html = '<p>First paragraph</p><p>Second paragraph</p>';
      const result = converter.convert(html);

      expect(result.content).toContain('First paragraph');
      expect(result.content).toContain('Second paragraph');
      expect(result.content.split('\n\n').length).toBeGreaterThanOrEqual(2);
    });

    it('should convert lists with specified bullet marker', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = converter.convert(html);

      expect(result.content).toContain('- Item 1'); // Using '-' as specified
      expect(result.content).toContain('- Item 2');
    });

    it('should convert ordered lists', () => {
      const html = '<ol><li>First</li><li>Second</li></ol>';
      const result = converter.convert(html);

      expect(result.content).toContain('1. First');
      expect(result.content).toContain('2. Second');
    });

    it('should convert links correctly', () => {
      const html = '<a href="https://example.com">Example Link</a>';
      const result = converter.convert(html);

      expect(result.content).toContain('[Example Link](https://example.com)');
    });

    it('should convert emphasis and strong text', () => {
      const html = '<em>italic</em> and <strong>bold</strong>';
      const result = converter.convert(html);

      expect(result.content).toContain('*italic*'); // Using '*' as specified
      expect(result.content).toContain('**bold**'); // Using '**' as specified
    });

    it('should convert code blocks with specified fence', () => {
      const html = '<pre><code>const x = 10;</code></pre>';
      const result = converter.convert(html);

      expect(result.content).toContain('```'); // Using '```' as specified
      expect(result.content).toContain('const x = 10;');
    });

    it('should convert inline code', () => {
      const html = 'Use <code>npm install</code> to install';
      const result = converter.convert(html);

      expect(result.content).toContain('`npm install`');
    });
  });

  describe('GitHub Flavored Markdown', () => {
    it('should convert tables when GFM is enabled', () => {
      const html = `
        <table>
          <thead>
            <tr><th>Header 1</th><th>Header 2</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
          </tbody>
        </table>
      `;
      const result = converter.convert(html);

      expect(result.content).toContain('| Header 1 | Header 2 |');
      expect(result.content).toContain('| --- | --- |');
      expect(result.content).toContain('| Cell 1 | Cell 2 |');
    });

    it('should convert strikethrough text', () => {
      const html = '<del>strikethrough</del>';
      const result = converter.convert(html);

      expect(result.content).toContain('~~strikethrough~~');
    });
  });

  describe('Content filtering', () => {
    it('should exclude elements matching excludeCss selectors', () => {
      const html = `
        <div>
          <p>Keep this</p>
          <div class="advertisement">Remove this ad</div>
          <script>alert('remove');</script>
        </div>
      `;
      const result = converter.convert(html);

      expect(result.content).toContain('Keep this');
      expect(result.content).not.toContain('Remove this ad');
      expect(result.content).not.toContain('alert');
    });
  });

  describe('URL handling', () => {
    it('should remove tracking parameters when enabled', () => {
      const html = '<a href="https://example.com?utm_source=test&utm_medium=email&id=123">Link</a>';
      const result = converter.convert(html);

      expect(result.content).toContain('https://example.com?id=123');
      expect(result.content).not.toContain('utm_source');
      expect(result.content).not.toContain('utm_medium');
    });
  });

  describe('Metadata', () => {
    it('should add metadata when enabled', () => {
      const html = '<p>Content</p>';
      const result = converter.convert(html, {
        url: 'https://example.com',
        title: 'Test Page',
      });

      expect(result.content).toContain('---');
      expect(result.content).toContain('title: Test Page');
      expect(result.content).toContain('url: https://example.com');
    });

    it('should not add metadata when disabled', () => {
      defaultProfile.outputFormat.addMetadata = false;
      converter = new MarkdownConverter(defaultProfile);

      const html = '<p>Content</p>';
      const result = converter.convert(html, {
        url: 'https://example.com',
        title: 'Test Page',
      });

      expect(result.content).not.toContain('---');
      expect(result.content).not.toContain('title: Test Page');
    });
  });

  describe('Document properties', () => {
    it('should generate a valid filename', () => {
      const html = '<p>Test content</p>';
      const result = converter.convert(html, {
        title: 'Test Page!@#$%',
      });

      expect(result.fileName).toBe('test-page.md');
    });

    it('should calculate document size', () => {
      const html = '<p>Test content</p>';
      const result = converter.convert(html);

      expect(result.sizeBytes).toBeGreaterThan(0);
      expect(typeof result.sizeBytes).toBe('number');
    });

    it('should include a checksum', () => {
      const html = '<p>Test content</p>';
      const result = converter.convert(html);

      expect(result.checksum).toBeDefined();
      expect(result.checksum!.length).toBeGreaterThan(0);
    });
  });
});
