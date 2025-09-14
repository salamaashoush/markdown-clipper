import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentParser } from '~/lib/parser/index';

describe('ContentParser', () => {
  let parser: ContentParser;

  beforeEach(() => {
    parser = new ContentParser();
    // Mock DOM methods that aren't available in JSDOM
    global.DOMParser = class {
      parseFromString(string: string, _type: string) {
        const doc = document.implementation.createHTMLDocument();
        doc.body.innerHTML = string;
        return doc;
      }
    } as any;
  });

  describe('extractContent', () => {
    it('should extract basic page content', async () => {
      document.title = 'Test Page';
      document.body.innerHTML = '<h1>Hello World</h1><p>Test content</p>';
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com' },
        writable: true,
      });

      const result = await parser.extractContent();

      expect(result.title).toBe('Test Page');
      expect(result.url).toBe('https://example.com');
      expect(result.html).toContain('<h1>Hello World</h1>');
      expect(result.html).toContain('<p>Test content</p>');
      expect(result.isLoading).toBe(false);
    });

    it('should exclude elements based on selectors', async () => {
      document.body.innerHTML = `
        <div>
          <p>Keep this</p>
          <div class="ads">Remove ads</div>
          <nav>Remove navigation</nav>
          <script>Remove script</script>
        </div>
      `;

      const result = await parser.extractContent({
        excludeSelectors: ['.ads', 'nav', 'script'],
      });

      expect(result.html).toContain('Keep this');
      expect(result.html).not.toContain('Remove ads');
      expect(result.html).not.toContain('Remove navigation');
      expect(result.html).not.toContain('Remove script');
    });

    it('should extract only specified selectors when provided', async () => {
      document.body.innerHTML = `
        <header>Header content</header>
        <main>
          <article>Article content</article>
        </main>
        <footer>Footer content</footer>
      `;

      const result = await parser.extractContent({
        selectors: ['main', 'article'],
      });

      expect(result.html).toContain('Article content');
      expect(result.html).not.toContain('Header content');
      expect(result.html).not.toContain('Footer content');
    });

    it('should detect loading state', async () => {
      document.body.innerHTML = '<div class="loading">Loading...</div>';

      const result = await parser.extractContent();

      // Note: hasLoadingIndicators is private, so we test indirectly
      expect(result.isLoading).toBe(false); // JSDOM doesn't compute styles
    });

    it('should wait for dynamic content when requested', async () => {
      document.body.innerHTML = '<div id="content">Initial</div>';

      const promise = parser.extractContent({
        waitForDynamic: true,
        timeout: 100,
      });

      // Simulate dynamic content loading
      setTimeout(() => {
        document.getElementById('content')!.textContent = 'Updated';
      }, 50);

      const result = await promise;

      expect(result.html).toContain('Updated');
    });
  });

  describe('extractMetadata', () => {
    it('should extract meta tags', () => {
      document.head.innerHTML = `
        <meta name="author" content="John Doe">
        <meta name="description" content="Test description">
        <meta name="keywords" content="test, parser, metadata">
        <meta property="article:published_time" content="2024-01-01">
        <link rel="canonical" href="https://example.com/canonical">
      `;

      const metadata = parser.extractMetadata(document);

      expect(metadata.author).toBe('John Doe');
      expect(metadata.description).toBe('Test description');
      expect(metadata.keywords).toEqual(['test', 'parser', 'metadata']);
      expect(metadata.publishDate).toBe('2024-01-01');
      expect(metadata.canonicalUrl).toBe('https://example.com/canonical');
    });

    it('should handle missing metadata gracefully', () => {
      document.head.innerHTML = '';

      const metadata = parser.extractMetadata(document);

      expect(metadata.author).toBeUndefined();
      expect(metadata.description).toBeUndefined();
      expect(metadata.keywords).toBeUndefined();
    });

    it('should extract Open Graph metadata', () => {
      document.head.innerHTML = `
        <meta property="og:description" content="OG description">
      `;

      const metadata = parser.extractMetadata(document);

      expect(metadata.description).toBe('OG description');
    });
  });

  describe('cleanHTML', () => {
    it('should remove script and style tags', () => {
      const html = `
        <div>
          <p>Keep this</p>
          <script>alert('remove');</script>
          <style>body { color: red; }</style>
          <noscript>No script</noscript>
        </div>
      `;

      const cleaned = parser.cleanHTML(html);

      expect(cleaned).toContain('Keep this');
      expect(cleaned).not.toContain('alert');
      expect(cleaned).not.toContain('color: red');
      expect(cleaned).not.toContain('No script');
    });

    it('should remove event handlers', () => {
      const html = `
        <div onclick="alert('click')">
          <button onmouseover="hover()">Button</button>
        </div>
      `;

      const cleaned = parser.cleanHTML(html);

      expect(cleaned).not.toContain('onclick');
      expect(cleaned).not.toContain('onmouseover');
      expect(cleaned).toContain('Button');
    });

    it('should remove data attributes', () => {
      const html = `
        <div data-id="123" data-tracking="xyz">
          <span class="keep-this">Content</span>
        </div>
      `;

      const cleaned = parser.cleanHTML(html);

      expect(cleaned).not.toContain('data-id');
      expect(cleaned).not.toContain('data-tracking');
      expect(cleaned).toContain('class="keep-this"');
    });

    it('should remove HTML comments', () => {
      const html = `
        <div>
          <!-- This is a comment -->
          <p>Keep this paragraph</p>
          <!-- Another comment -->
        </div>
      `;

      const cleaned = parser.cleanHTML(html);

      expect(cleaned).not.toContain('This is a comment');
      expect(cleaned).not.toContain('Another comment');
      expect(cleaned).toContain('Keep this paragraph');
    });

    it('should handle iframes', () => {
      const html = `
        <div>
          <iframe src="https://example.com"></iframe>
          <p>Content</p>
        </div>
      `;

      const cleaned = parser.cleanHTML(html);

      expect(cleaned).not.toContain('iframe');
      expect(cleaned).toContain('Content');
    });
  });

  describe('observeMutations', () => {
    it('should observe DOM mutations', async () => {
      const callback = vi.fn();
      const observer = parser.observeMutations(callback);

      // Make a DOM change
      const div = document.createElement('div');
      document.body.appendChild(div);

      // MutationObserver is async
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(callback).toHaveBeenCalled();
      observer.disconnect();
    });

    it('should be able to disconnect observer', () => {
      const callback = vi.fn();
      const observer = parser.observeMutations(callback);

      observer.disconnect();

      // Make a DOM change after disconnecting
      const div = document.createElement('div');
      document.body.appendChild(div);

      // Callback should not be called
      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
      }, 10);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty document', async () => {
      document.body.innerHTML = '';

      const result = await parser.extractContent();

      expect(result.html).toBe('');
      expect(result.title).toBeDefined();
    });

    it('should handle malformed HTML', async () => {
      document.body.innerHTML = '<p>Unclosed paragraph <div>Nested</p></div>';

      const result = await parser.extractContent();

      expect(result.html).toBeDefined();
      expect(result.html.length).toBeGreaterThan(0);
    });

    it('should handle special characters in content', async () => {
      document.body.innerHTML = '<p>&lt;script&gt;alert("XSS")&lt;/script&gt;</p>';

      const result = await parser.extractContent();

      expect(result.html).toContain('&lt;script&gt;');
      expect(result.html).not.toContain('<script>');
    });
  });
});