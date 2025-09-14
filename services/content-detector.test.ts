/**
 * Tests for smart content detection service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentDetector } from './content-detector';

describe('ContentDetector', () => {
  let detector: ContentDetector;
  let originalDocument: Document;

  beforeEach(() => {
    detector = new ContentDetector();
    originalDocument = document;
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  describe('findMainContent', () => {
    it('should detect article element as main content', async () => {
      document.body.innerHTML = `
        <nav>Navigation</nav>
        <article>
          <h1>Article Title</h1>
          <p>This is the main article content with enough text to be considered valid content.
             We need at least 200 characters to pass the minimum content length check.
             Adding more text here to ensure we meet the threshold.</p>
        </article>
        <aside>Sidebar</aside>
      `;

      const result = await detector.detectContent();

      expect(result.mainContent).toBeTruthy();
      expect(result.mainContent?.tagName).toBe('ARTICLE');
      expect(result.confidence).toBeGreaterThan(50);
    });

    it('should detect main element as main content', async () => {
      document.body.innerHTML = `
        <header>Header</header>
        <main>
          <h1>Main Content Title</h1>
          <p>This is the main content area with substantial text content that should be detected.
             We are adding enough content to ensure the detector recognizes this as the primary content area.
             More text to meet the minimum threshold requirements.</p>
        </main>
        <footer>Footer</footer>
      `;

      const result = await detector.detectContent();

      expect(result.mainContent).toBeTruthy();
      expect(result.mainContent?.tagName).toBe('MAIN');
      expect(result.confidence).toBeGreaterThan(50);
    });

    it('should detect content with role="main"', async () => {
      document.body.innerHTML = `
        <div role="navigation">Nav</div>
        <div role="main">
          <h1>Main Content with ARIA Role</h1>
          <p>This content is marked with role="main" which should be detected as the primary content.
             Adding sufficient text to ensure the content detector recognizes this as valid main content.
             This approach uses ARIA roles for semantic meaning.</p>
        </div>
        <div role="complementary">Sidebar</div>
      `;

      const result = await detector.detectContent();

      expect(result.mainContent).toBeTruthy();
      expect(result.mainContent?.getAttribute('role')).toBe('main');
    });

    it('should detect content by common class names', async () => {
      document.body.innerHTML = `
        <div class="navbar">Navigation</div>
        <div class="main-content">
          <h1>Content with Class Name</h1>
          <p>This content uses a common class name pattern that should be recognized.
             The class "main-content" is a common pattern used in many websites.
             We're adding enough text content to ensure proper detection.</p>
        </div>
        <div class="sidebar">Sidebar</div>
      `;

      const result = await detector.detectContent();

      expect(result.mainContent).toBeTruthy();
      expect(result.mainContent?.classList.contains('main-content')).toBe(true);
    });

    it('should use heuristic detection when no semantic elements exist', async () => {
      document.body.innerHTML = `
        <div>
          <div>Short navigation text</div>
        </div>
        <div>
          <h1>Article without Semantic Markup</h1>
          <p>This is a longer content area without semantic HTML elements.</p>
          <p>It should still be detected using heuristic analysis based on text length.</p>
          <p>The algorithm should score this higher due to multiple paragraphs.</p>
          <p>And the presence of headings should also increase the score.</p>
          <h2>Subheading</h2>
          <p>More content to ensure this scores highest in the heuristic analysis.</p>
        </div>
        <div>
          <div>Short sidebar text</div>
        </div>
      `;

      const result = await detector.detectContent();

      expect(result.mainContent).toBeTruthy();
      expect(result.wordCount).toBeGreaterThan(50);
    });
  });

  describe('content cleaning', () => {
    it('should remove navigation elements', async () => {
      document.body.innerHTML = `
        <nav id="main-nav">
          <ul>
            <li>Home</li>
            <li>About</li>
          </ul>
        </nav>
        <article>
          <h1>Article Title</h1>
          <p>Main content that should remain after cleaning. This is the important content
             that users want to see. Adding more text to meet minimum requirements.</p>
        </article>
      `;

      const result = await detector.detectContent({
        removeNav: true
      });

      const content = result.mainContent?.outerHTML || '';
      expect(content).not.toContain('main-nav');
      expect(content).toContain('Article Title');
    });

    it('should remove footer elements', async () => {
      document.body.innerHTML = `
        <article>
          <h1>Main Article</h1>
          <p>This is the main content that should be preserved in the output.
             We want to keep all of this text while removing the footer content.
             Adding sufficient text for proper detection.</p>
        </article>
        <footer>
          <p>Copyright 2024</p>
          <p>Contact info</p>
        </footer>
      `;

      const result = await detector.detectContent({
        removeFooter: true
      });

      const content = result.mainContent?.outerHTML || '';
      expect(content).not.toContain('Copyright');
      expect(content).toContain('Main Article');
    });

    it('should remove sidebar elements', async () => {
      document.body.innerHTML = `
        <main>
          <h1>Main Content Area</h1>
          <p>This is the primary content that should be kept after processing.
             All of this text should remain in the final output.
             Making sure we have enough content for detection.</p>
        </main>
        <aside class="sidebar">
          <h3>Related Links</h3>
          <ul>
            <li>Link 1</li>
            <li>Link 2</li>
          </ul>
        </aside>
      `;

      const result = await detector.detectContent({
        removeSidebars: true
      });

      const content = result.mainContent?.outerHTML || '';
      expect(content).not.toContain('Related Links');
      expect(content).toContain('Main Content Area');
    });

    it('should remove ad elements', async () => {
      document.body.innerHTML = `
        <article>
          <h1>Article with Ads</h1>
          <div class="ad-banner">Advertisement</div>
          <p>Real content that should be preserved after ad removal.
             This text is what users actually want to read.
             Ensuring we have sufficient content length.</p>
          <div id="ad-slot-1">Another Ad</div>
          <p>More real content after the ad.</p>
        </article>
      `;

      const result = await detector.detectContent({
        removeAds: true
      });

      const content = result.mainContent?.outerHTML || '';
      expect(content).not.toContain('Advertisement');
      expect(content).not.toContain('Another Ad');
      expect(content).toContain('Real content');
    });

    it('should remove comment sections', async () => {
      document.body.innerHTML = `
        <article>
          <h1>Article with Comments</h1>
          <p>This is the main article content that should be kept.
             We want to preserve this while removing comments.
             Adding more text to meet detection requirements.</p>
          <div class="comments">
            <h3>Comments</h3>
            <div>User comment 1</div>
            <div>User comment 2</div>
          </div>
          <div id="disqus_thread">Disqus comments</div>
        </article>
      `;

      const result = await detector.detectContent({
        removeComments: true
      });

      const content = result.mainContent?.outerHTML || '';
      expect(content).not.toContain('User comment');
      expect(content).not.toContain('Disqus');
      expect(content).toContain('main article content');
    });

    it('should remove cookie banners', async () => {
      document.body.innerHTML = `
        <div class="cookie-banner" style="position: fixed;">
          <p>We use cookies to improve your experience.</p>
          <button>Accept</button>
          <button>Reject</button>
        </div>
        <div id="cookie-consent">
          <p>This site uses cookies</p>
          <button>Accept All</button>
        </div>
        <article>
          <h1>Article with Cookie Banners</h1>
          <p>This is the main article content that should be kept.
             Cookie banners should be removed while preserving content.
             Adding more text to meet detection requirements.</p>
        </article>
        <div class="gdpr-banner">
          <p>GDPR compliance notice</p>
          <button>I Agree</button>
        </div>
      `;

      const result = await detector.detectContent({
        removeCookieBanners: true
      });

      const content = result.mainContent?.outerHTML || '';
      expect(content).not.toContain('We use cookies');
      expect(content).not.toContain('Accept All');
      expect(content).not.toContain('GDPR compliance');
      expect(content).toContain('main article content');
    });

    it('should remove popular cookie consent libraries', async () => {
      document.body.innerHTML = `
        <div class="cc-window cc-banner">
          <p>Cookie consent from CookieConsent library</p>
          <button class="cc-btn cc-allow">Allow cookies</button>
        </div>
        <div class="cky-consent-container">
          <div class="cky-consent-bar">
            <p>CookieYes consent banner</p>
            <button>Accept</button>
          </div>
        </div>
        <article>
          <h1>Article with Third-Party Cookie Libraries</h1>
          <p>This content should remain after removing cookie consent libraries.
             Testing various popular cookie consent implementations.
             Ensuring sufficient content for proper detection.</p>
        </article>
        <div class="cookie-law-info-bar">
          <p>Cookie Law Info plugin banner</p>
          <button>Accept</button>
        </div>
      `;

      const result = await detector.detectContent({
        removeCookieBanners: true
      });

      const content = result.mainContent?.outerHTML || '';
      expect(content).not.toContain('CookieConsent library');
      expect(content).not.toContain('CookieYes');
      expect(content).not.toContain('Cookie Law Info');
      expect(content).toContain('Third-Party Cookie Libraries');
    });

    it('should remove fixed position cookie elements', async () => {
      document.body.innerHTML = `
        <div style="position: fixed; bottom: 0;">
          <p>This website uses cookies</p>
          <button>Accept cookies</button>
        </div>
        <div style="position: sticky; top: 0;" class="privacy-notice">
          <p>Privacy and cookie policy</p>
          <button>I agree</button>
        </div>
        <main>
          <h1>Main Content</h1>
          <p>This is the main content that should be preserved.
             Fixed and sticky positioned cookie banners should be removed.
             Adding sufficient text for detection algorithm.</p>
        </main>
      `;

      const result = await detector.detectContent({
        removeCookieBanners: true
      });

      const content = result.mainContent?.outerHTML || '';
      expect(content).not.toContain('This website uses cookies');
      expect(content).not.toContain('Privacy and cookie policy');
      expect(content).toContain('Main Content');
    });

    it('should not remove content with cookie keywords', async () => {
      document.body.innerHTML = `
        <article>
          <h1>How to Bake Cookies</h1>
          <p>This article about baking cookies should not be removed.
             Even though it contains the word "cookie" in the content.
             The detection should be smart enough to distinguish.</p>
          <h2>Cookie Recipe</h2>
          <p>Mix flour, sugar, and butter to make delicious cookies.
             This content about actual cookies should remain.</p>
        </article>
      `;

      const result = await detector.detectContent({
        removeCookieBanners: true
      });

      const content = result.mainContent?.outerHTML || '';
      expect(content).toContain('How to Bake Cookies');
      expect(content).toContain('Cookie Recipe');
      expect(content).toContain('delicious cookies');
    });

    it('should remove hidden elements', async () => {
      document.body.innerHTML = `
        <article>
          <h1>Article with Hidden Content</h1>
          <p>Visible content that should be included in the output.
             This text is displayed to users and should be kept.
             Making sure we have enough visible content.</p>
          <div style="display: none">Hidden content</div>
          <div style="visibility: hidden">Invisible content</div>
          <div hidden>HTML5 hidden content</div>
        </article>
      `;

      const result = await detector.detectContent();

      const content = result.mainContent?.outerHTML || '';
      expect(content).not.toContain('Hidden content');
      expect(content).not.toContain('Invisible content');
      expect(content).not.toContain('HTML5 hidden content');
      expect(content).toContain('Visible content');
    });

    it('should remove empty elements', async () => {
      document.body.innerHTML = `
        <article>
          <h1>Article with Empty Elements</h1>
          <div></div>
          <p>Actual content that should be preserved in the final output.
             This paragraph has real text content.
             Ensuring sufficient content for detection.</p>
          <span></span>
          <div>   </div>
          <p>More actual content here.</p>
        </article>
      `;

      const result = await detector.detectContent();

      const content = result.mainContent;
      const emptyDivs = content?.querySelectorAll('div:empty') || [];
      const emptySpans = content?.querySelectorAll('span:empty') || [];

      expect(emptyDivs.length).toBe(0);
      expect(emptySpans.length).toBe(0);
    });
  });

  describe('metadata extraction', () => {
    it('should extract title from h1 element', async () => {
      document.body.innerHTML = `
        <article>
          <h1>This is the Article Title</h1>
          <p>Article content goes here with enough text to be detected as main content.
             We need sufficient text to pass the minimum content threshold.
             Adding more content to ensure proper detection.</p>
        </article>
      `;

      const result = await detector.detectContent();

      expect(result.title).toBe('This is the Article Title');
    });

    it('should extract title from meta tags', async () => {
      document.head.innerHTML = `
        <meta property="og:title" content="Open Graph Title">
      `;
      document.body.innerHTML = `
        <article>
          <p>Content without an h1 tag but with meta tags in the head.
             This content should still be detected as the main content.
             We have enough text here to meet the requirements.</p>
        </article>
      `;

      const result = await detector.detectContent();

      expect(result.title).toBe('Open Graph Title');
    });

    it('should extract author information', async () => {
      document.head.innerHTML = `
        <meta name="author" content="John Doe">
      `;
      document.body.innerHTML = `
        <article>
          <h1>Article Title</h1>
          <div class="author">Jane Smith</div>
          <p>Article content with author information that should be extracted.
             The detector should prefer the visible author over meta tag.
             Adding more content to meet detection requirements.</p>
        </article>
      `;

      const result = await detector.detectContent();

      expect(result.author).toBe('Jane Smith');
    });

    it('should extract publish date', async () => {
      document.head.innerHTML = `
        <meta property="article:published_time" content="2024-01-15T10:00:00Z">
      `;
      document.body.innerHTML = `
        <article>
          <h1>Article Title</h1>
          <time datetime="2024-01-15T10:00:00Z">January 15, 2024</time>
          <p>Article with publication date that should be properly extracted.
             The date information is important metadata for the content.
             Ensuring we have sufficient content length.</p>
        </article>
      `;

      const result = await detector.detectContent();

      expect(result.publishDate).toBeTruthy();
      expect(result.publishDate).toContain('2024-01-15');
    });

    it('should calculate word count', async () => {
      document.body.innerHTML = `
        <article>
          <h1>Article Title</h1>
          <p>This is a test article with a specific number of words that we can count accurately.</p>
          <p>Adding another paragraph to increase the word count for testing purposes.</p>
          <p>The word count should be calculated correctly regardless of HTML markup.</p>
        </article>
      `;

      const result = await detector.detectContent();

      expect(result.wordCount).toBeGreaterThan(30);
      expect(result.wordCount).toBeLessThan(100);
    });

    it('should estimate reading time', async () => {
      document.body.innerHTML = `
        <article>
          <h1>Long Article</h1>
          <p>${'This is a long article with lots of content. '.repeat(50)}</p>
          <p>${'More content to increase reading time. '.repeat(50)}</p>
        </article>
      `;

      const result = await detector.detectContent();

      expect(result.readingTime).toBeGreaterThan(0);
      // Assuming 200 words per minute reading speed
      expect(result.readingTime).toBe(Math.ceil(result.wordCount / 200));
    });
  });

  describe('confidence scoring', () => {
    it('should give high confidence for semantic HTML', async () => {
      document.body.innerHTML = `
        <article>
          <h1>Well-Structured Article</h1>
          <h2>Subtitle</h2>
          <p>First paragraph with good content structure and sufficient length.</p>
          <p>Second paragraph continuing the article content.</p>
          <h3>Section Heading</h3>
          <p>More content in a well-structured format.</p>
          <p>Additional paragraph to ensure good content length.</p>
        </article>
      `;

      const result = await detector.detectContent();

      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should give lower confidence for poor structure', async () => {
      document.body.innerHTML = `
        <div>
          Some text without any structure or semantic meaning.
          Just plain text in a div without headings or paragraphs.
          This should result in lower confidence score.
        </div>
      `;

      const result = await detector.detectContent();

      expect(result.confidence).toBeLessThan(50);
    });

    it('should give high confidence for long content', async () => {
      const longContent = 'This is a sentence with several words. '.repeat(100);
      document.body.innerHTML = `
        <main>
          <h1>Long Article</h1>
          <p>${longContent}</p>
        </main>
      `;

      const result = await detector.detectContent();

      expect(result.confidence).toBeGreaterThan(80);
    });
  });

  describe('edge cases', () => {
    it('should handle empty document', async () => {
      document.body.innerHTML = '';

      const result = await detector.detectContent();

      expect(result.mainContent).toBeNull();
      expect(result.wordCount).toBe(0);
      expect(result.confidence).toBe(0);
    });

    it('should handle document with only navigation', async () => {
      document.body.innerHTML = `
        <nav>
          <ul>
            <li>Home</li>
            <li>About</li>
            <li>Contact</li>
          </ul>
        </nav>
      `;

      const result = await detector.detectContent();

      expect(result.mainContent).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should handle very short content', async () => {
      document.body.innerHTML = `
        <article>
          <h1>Title</h1>
          <p>Short.</p>
        </article>
      `;

      const result = await detector.detectContent();

      // Should not detect as main content due to minimum length requirement
      expect(result.wordCount).toBeLessThan(200);
      expect(result.confidence).toBeLessThan(50);
    });

    it('should handle malformed HTML', async () => {
      document.body.innerHTML = `
        <article>
          <h1>Title
          <p>Unclosed tags and malformed HTML content
          <div>Should still try to extract what it can
          <p>Even with broken markup, content detection should work to some degree.
             Adding more text to meet minimum requirements for detection.
             The parser should be resilient to common HTML errors.</p>
        </article>
      `;

      const result = await detector.detectContent();

      expect(result.mainContent).toBeTruthy();
      expect(result.title).toBeTruthy();
    });

    it('should handle content with excessive links', async () => {
      document.body.innerHTML = `
        <div>
          <h1>Page with Many Links</h1>
          <p>
            <a href="#">Link 1</a>
            <a href="#">Link 2</a>
            <a href="#">Link 3</a>
            <a href="#">Link 4</a>
            <a href="#">Link 5</a>
            <a href="#">Link 6</a>
            <a href="#">Link 7</a>
            <a href="#">Link 8</a>
            <a href="#">Link 9</a>
            <a href="#">Link 10</a>
          </p>
        </div>
      `;

      const result = await detector.detectContent();

      // High link density should lower the score
      expect(result.confidence).toBeLessThan(40);
    });

    it('should prefer article over other content', async () => {
      document.body.innerHTML = `
        <div class="content">
          <p>${'This is some content in a regular div. '.repeat(20)}</p>
        </div>
        <article>
          <h1>Article Content</h1>
          <p>${'This is the article content that should be preferred. '.repeat(10)}</p>
        </article>
      `;

      const result = await detector.detectContent();

      expect(result.mainContent?.tagName).toBe('ARTICLE');
    });
  });

  describe('options', () => {
    it('should respect minTextLength option', async () => {
      document.body.innerHTML = `
        <article>
          <h1>Short Article</h1>
          <p>Very short content that is just long enough to meet the reduced minimum.</p>
        </article>
      `;

      const detector = new ContentDetector();
      const result = await detector.detectContent({
        minTextLength: 10
      });

      expect(result.mainContent).toBeTruthy();
      expect(result.wordCount).toBeGreaterThan(10);
    });

    it('should work with all options enabled', async () => {
      document.body.innerHTML = `
        <nav>Navigation</nav>
        <div class="cookie-banner">
          <p>We use cookies</p>
          <button>Accept</button>
        </div>
        <article>
          <h1>Complete Article</h1>
          <div class="ad">Advertisement</div>
          <p>Main content that should be extracted and cleaned properly.
             This is the actual content users want to see.
             Adding sufficient text for detection.</p>
          <aside>Sidebar content</aside>
          <div class="comments">Comments section</div>
        </article>
        <footer>Footer content</footer>
      `;

      const result = await detector.detectContent({
        removeNav: true,
        removeFooter: true,
        removeSidebars: true,
        removeAds: true,
        removeComments: true,
        removeCookieBanners: true
      });

      const content = result.mainContent?.outerHTML || '';
      expect(content).not.toContain('Navigation');
      expect(content).not.toContain('We use cookies');
      expect(content).not.toContain('Advertisement');
      expect(content).not.toContain('Sidebar');
      expect(content).not.toContain('Comments');
      expect(content).not.toContain('Footer');
      expect(content).toContain('Main content');
    });
  });
});