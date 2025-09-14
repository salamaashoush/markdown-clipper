/**
 * Smart content detection service
 * Identifies main content areas and removes clutter
 */

export interface ContentDetectionOptions {
  removeNav?: boolean;
  removeFooter?: boolean;
  removeSidebars?: boolean;
  removeAds?: boolean;
  removeComments?: boolean;
  removeCookieBanners?: boolean;
  minTextLength?: number;
  maxDepth?: number;
}

export interface DetectedContent {
  mainContent: HTMLElement | null;
  title: string;
  author?: string;
  publishDate?: string;
  readingTime?: number;
  wordCount: number;
  confidence: number;
}

export class ContentDetector {
  private DEFAULT_OPTIONS: ContentDetectionOptions = {
    removeNav: true,
    removeFooter: true,
    removeSidebars: true,
    removeAds: true,
    removeComments: true,
    removeCookieBanners: true,
    minTextLength: 200,
    maxDepth: 10,
  };

  // Common selectors for main content
  private readonly CONTENT_SELECTORS = [
    'main',
    'article',
    '[role="main"]',
    '[role="article"]',
    '.main-content',
    '.article-content',
    '.post-content',
    '.entry-content',
    '#main-content',
    '#article',
    '#content',
    '.content',
    '.story-body',
    '.article-body',
    '[itemprop="articleBody"]',
  ];

  // Selectors to remove
  private readonly REMOVE_SELECTORS = {
    nav: ['nav', 'header nav', '.navigation', '.nav', '#nav'],
    footer: ['footer', '.footer', '#footer', '.site-footer'],
    sidebars: ['aside', '.sidebar', '.side-bar', '#sidebar', '.widget-area'],
    ads: ['.ad', '.ads', '.advertisement', '[class*="ad-"]', '[id*="ad-"]', '.sponsored'],
    comments: ['.comments', '#comments', '.comment-section', '#disqus_thread'],
    cookieBanners: [
      // Common cookie banner selectors
      '[class*="cookie"]',
      '[id*="cookie"]',
      '[class*="consent"]',
      '[id*="consent"]',
      '[class*="gdpr"]',
      '[id*="gdpr"]',
      '[class*="privacy-banner"]',
      '[class*="privacy-notice"]',
      '[class*="cookie-banner"]',
      '[class*="cookie-notice"]',
      '[class*="cookie-popup"]',
      '[class*="cookie-modal"]',
      '[class*="cookie-bar"]',
      '[class*="cookie-consent"]',
      '[class*="cc-banner"]',
      '[class*="cc-window"]',
      '.cookie-banner',
      '.cookie-notice',
      '.cookie-popup',
      '.cookie-modal',
      '.cookie-bar',
      '.gdpr-banner',
      '.gdpr-notice',
      '.privacy-banner',
      '.consent-banner',
      '#cookie-banner',
      '#cookie-notice',
      '#cookie-consent',
      '#gdpr-banner',
      '#consent-banner',
      // Popular cookie consent libraries
      '.cc-window',
      '.cc-banner',
      '.cc-cookie-consent',
      '.cky-consent-container',
      '.cky-consent-bar',
      '.cookiealert',
      '.cookiebanner',
      '.cookieconsent',
      '.cookie-law-info-bar',
      '.cli-modal-backdrop',
      '.moove_gdpr_cookie_info_bar',
      '.gdpr-cookie-notice',
      '.wp-gdpr-cookie-notice',
      '.pum-overlay',
      '[data-cookie-consent]',
      '[data-gdpr]',
      '[data-cookie-banner]',
      '[aria-label*="cookie"]',
      '[aria-label*="consent"]',
      '[aria-label*="privacy"]',
      '[role="dialog"][class*="cookie"]',
      '[role="banner"][class*="cookie"]',
      // Overlay and modal backgrounds
      '.cookie-overlay',
      '.gdpr-overlay',
      '.privacy-overlay',
      '.consent-overlay',
      // Fixed position elements that might be cookie banners
      'div[style*="position: fixed"][class*="cookie"]',
      'div[style*="position: fixed"][class*="consent"]',
      'div[style*="position: fixed"][class*="gdpr"]',
      'div[style*="position: fixed"][class*="privacy"]'
    ],
  };

  // Metadata selectors
  private readonly METADATA_SELECTORS = {
    title: [
      'h1',
      '.article-title',
      '.post-title',
      '.entry-title',
      '[itemprop="headline"]',
      'meta[property="og:title"]',
    ],
    author: [
      '.author',
      '.by-author',
      '.article-author',
      '[itemprop="author"]',
      '[rel="author"]',
      'meta[name="author"]',
    ],
    date: [
      'time',
      '.publish-date',
      '.post-date',
      '[itemprop="datePublished"]',
      'meta[property="article:published_time"]',
    ],
  };

  /**
   * Detect main content on the page
   */
  public async detectContent(
    options: ContentDetectionOptions = {}
  ): Promise<DetectedContent> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    // First, try to find main content using semantic selectors
    let mainContent = this.findMainContent(opts.minTextLength);

    // If not found, use heuristic approach
    if (!mainContent) {
      mainContent = this.findContentHeuristically(opts.minTextLength);
    }

    // Clean up the content
    if (mainContent) {
      mainContent = this.cleanContent(mainContent, opts);
    }

    // Extract metadata
    const metadata = this.extractMetadata();

    // Calculate metrics
    const wordCount = this.countWords(mainContent);
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed

    // Calculate confidence score
    const confidence = this.calculateConfidence(mainContent, wordCount);

    return {
      mainContent,
      title: metadata.title || document.title,
      author: metadata.author,
      publishDate: metadata.date,
      readingTime,
      wordCount,
      confidence,
    };
  }

  /**
   * Find main content using semantic selectors
   */
  private findMainContent(minTextLength?: number): HTMLElement | null {
    for (const selector of this.CONTENT_SELECTORS) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element && this.isValidContent(element, minTextLength)) {
        return element.cloneNode(true) as HTMLElement;
      }
    }
    return null;
  }

  /**
   * Find content using heuristic approach
   */
  private findContentHeuristically(minTextLength?: number): HTMLElement | null {
    const candidates = this.getContentCandidates(minTextLength);

    if (candidates.length === 0) {
      return null;
    }

    // Score each candidate
    const scored = candidates.map(element => ({
      element,
      score: this.scoreElement(element),
    }));

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Return the best candidate
    return scored[0]?.element.cloneNode(true) as HTMLElement || null;
  }

  /**
   * Get potential content candidates
   */
  private getContentCandidates(minTextLength?: number): HTMLElement[] {
    const candidates: HTMLElement[] = [];
    const elements = document.querySelectorAll<HTMLElement>('div, section, article, main');
    const threshold = minTextLength ?? this.DEFAULT_OPTIONS.minTextLength!;

    elements.forEach(element => {
      const text = element.textContent || '';
      if (text.length > threshold) {
        candidates.push(element);
      }
    });

    return candidates;
  }

  /**
   * Score an element based on various factors
   */
  private scoreElement(element: HTMLElement): number {
    let score = 0;

    // Text length
    const textLength = (element.textContent || '').length;
    score += Math.min(textLength / 100, 50);

    // Paragraph count
    const paragraphs = element.querySelectorAll('p').length;
    score += paragraphs * 3;

    // Heading count
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    score += headings * 5;

    // Link density (lower is better)
    const links = element.querySelectorAll('a').length;
    const linkDensity = links / Math.max(textLength, 1);
    score -= linkDensity * 100;

    // Class and ID indicators
    const classAndId = (element.className + ' ' + element.id).toLowerCase();
    if (classAndId.includes('content') || classAndId.includes('article')) {
      score += 25;
    }
    if (classAndId.includes('sidebar') || classAndId.includes('nav')) {
      score -= 25;
    }

    // Semantic HTML bonus
    if (element.tagName === 'ARTICLE') score += 30;
    if (element.tagName === 'MAIN') score += 25;
    if (element.tagName === 'SECTION') score += 10;

    return score;
  }

  /**
   * Clean content by removing unwanted elements
   */
  private cleanContent(
    content: HTMLElement,
    options: ContentDetectionOptions
  ): HTMLElement {
    const cleaned = content.cloneNode(true) as HTMLElement;

    // Remove elements based on options
    if (options.removeNav) {
      this.removeElements(cleaned, this.REMOVE_SELECTORS.nav);
    }
    if (options.removeFooter) {
      this.removeElements(cleaned, this.REMOVE_SELECTORS.footer);
    }
    if (options.removeSidebars) {
      this.removeElements(cleaned, this.REMOVE_SELECTORS.sidebars);
    }
    if (options.removeAds) {
      this.removeElements(cleaned, this.REMOVE_SELECTORS.ads);
    }
    if (options.removeComments) {
      this.removeElements(cleaned, this.REMOVE_SELECTORS.comments);
    }
    if (options.removeCookieBanners) {
      this.removeElements(cleaned, this.REMOVE_SELECTORS.cookieBanners);
      this.removeCookieBannersFromDocument();
    }

    // Remove hidden elements
    this.removeHiddenElements(cleaned);

    // Remove empty elements
    this.removeEmptyElements(cleaned);

    return cleaned;
  }

  /**
   * Remove elements matching selectors
   */
  private removeElements(container: HTMLElement, selectors: string[]): void {
    selectors.forEach(selector => {
      container.querySelectorAll(selector).forEach(element => {
        element.remove();
      });
    });
  }

  /**
   * Remove hidden elements
   */
  private removeHiddenElements(container: HTMLElement): void {
    container.querySelectorAll<HTMLElement>('*').forEach(element => {
      const style = window.getComputedStyle(element);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        element.hidden
      ) {
        element.remove();
      }
    });
  }

  /**
   * Remove empty elements
   */
  private removeEmptyElements(container: HTMLElement): void {
    container.querySelectorAll<HTMLElement>('div, span, p').forEach(element => {
      if (!element.textContent?.trim() && element.children.length === 0) {
        element.remove();
      }
    });
  }

  /**
   * Check if element has valid content
   */
  private isValidContent(element: HTMLElement, minLength?: number): boolean {
    const text = element.textContent || '';
    const threshold = minLength ?? this.DEFAULT_OPTIONS.minTextLength!;
    return text.length > threshold;
  }

  /**
   * Extract metadata from the page
   */
  private extractMetadata(): {
    title?: string;
    author?: string;
    date?: string;
  } {
    const metadata: any = {};

    // Extract title
    for (const selector of this.METADATA_SELECTORS.title) {
      if (selector.startsWith('meta')) {
        const meta = document.querySelector<HTMLMetaElement>(selector);
        if (meta?.content) {
          metadata.title = meta.content;
          break;
        }
      } else {
        const element = document.querySelector(selector);
        if (element?.textContent) {
          metadata.title = element.textContent.trim();
          break;
        }
      }
    }

    // Extract author
    for (const selector of this.METADATA_SELECTORS.author) {
      if (selector.startsWith('meta')) {
        const meta = document.querySelector<HTMLMetaElement>(selector);
        if (meta?.content) {
          metadata.author = meta.content;
          break;
        }
      } else {
        const element = document.querySelector(selector);
        if (element?.textContent) {
          metadata.author = element.textContent.trim();
          break;
        }
      }
    }

    // Extract date
    for (const selector of this.METADATA_SELECTORS.date) {
      if (selector.startsWith('meta')) {
        const meta = document.querySelector<HTMLMetaElement>(selector);
        if (meta?.content) {
          metadata.date = meta.content;
          break;
        }
      } else {
        const element = document.querySelector(selector);
        if (element) {
          metadata.date = element.getAttribute('datetime') || element.textContent?.trim();
          break;
        }
      }
    }

    return metadata;
  }

  /**
   * Count words in content
   */
  private countWords(element: HTMLElement | null): number {
    if (!element) return 0;
    const text = element.textContent || '';
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(element: HTMLElement | null, wordCount: number): number {
    if (!element) return 0;

    let confidence = 0;

    // Word count factor (adjusted for better scoring)
    if (wordCount > 10) confidence += 10;
    if (wordCount > 50) confidence += 15;
    if (wordCount > 100) confidence += 15;
    if (wordCount > 300) confidence += 10;
    if (wordCount > 500) confidence += 10;

    // Structure factor
    if (element.querySelector('h1, h2, h3')) confidence += 20;
    if (element.querySelectorAll('p').length > 1) confidence += 10;
    if (element.querySelectorAll('p').length > 3) confidence += 10;

    // Semantic HTML factor (increased weight)
    if (element.tagName === 'ARTICLE') {
      confidence += 30;
    } else if (element.tagName === 'MAIN') {
      confidence += 25;
    } else if (element.getAttribute('role') === 'main' || element.getAttribute('role') === 'article') {
      confidence += 20;
    }

    // Class/ID indicators
    const classAndId = (element.className + ' ' + element.id).toLowerCase();
    if (classAndId.includes('content') || classAndId.includes('article') || classAndId.includes('main')) {
      confidence += 10;
    }

    return Math.min(confidence, 100);
  }

  /**
   * Get reading time estimate
   */
  public estimateReadingTime(element: HTMLElement): number {
    const wordCount = this.countWords(element);
    return Math.ceil(wordCount / 200); // Average reading speed
  }

  /**
   * Remove cookie banners from the entire document
   * This is more aggressive and runs on the whole page
   */
  private removeCookieBannersFromDocument(): void {
    // Remove cookie banners from the entire document
    this.REMOVE_SELECTORS.cookieBanners.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(element => {
          // Check if element looks like a cookie banner
          if (this.looksLikeCookieBanner(element)) {
            element.remove();
          }
        });
      } catch (e) {
        // Some selectors might be invalid, ignore errors
        console.debug('Failed to remove cookie banner with selector:', selector, e);
      }
    });

    // Also remove fixed/sticky positioned elements that might be cookie banners
    document.querySelectorAll('div, section').forEach(element => {
      const style = window.getComputedStyle(element);
      const text = (element.textContent || '').toLowerCase();
      const className = (element.className || '').toLowerCase();
      const id = (element.id || '').toLowerCase();

      // Check if it's positioned fixed or sticky and contains cookie-related text
      if ((style.position === 'fixed' || style.position === 'sticky') &&
          (text.includes('cookie') || text.includes('consent') || text.includes('gdpr') ||
           text.includes('privacy') || text.includes('accept') || text.includes('agree') ||
           className.includes('cookie') || className.includes('consent') ||
           className.includes('gdpr') || className.includes('privacy') ||
           id.includes('cookie') || id.includes('consent') ||
           id.includes('gdpr') || id.includes('privacy'))) {

        // Additional check: cookie banners usually have buttons
        const hasButtons = element.querySelector('button, [role="button"], a[href="#"], .btn, .button');
        if (hasButtons) {
          element.remove();
        }
      }
    });

    // Remove overlays that might be blocking content
    document.querySelectorAll('[class*="overlay"], [class*="backdrop"], [class*="modal-bg"]').forEach(element => {
      const text = (element.textContent || '').toLowerCase();
      const className = (element.className || '').toLowerCase();

      if (text.includes('cookie') || text.includes('consent') || text.includes('gdpr') ||
          className.includes('cookie') || className.includes('consent') || className.includes('gdpr')) {
        element.remove();
      }
    });
  }

  /**
   * Check if an element looks like a cookie banner
   */
  private looksLikeCookieBanner(element: Element): boolean {
    const text = (element.textContent || '').toLowerCase();
    const className = (element.className || '').toLowerCase();
    const id = (element.id || '').toLowerCase();

    // Check for cookie-related keywords
    const keywords = ['cookie', 'consent', 'gdpr', 'privacy policy', 'accept cookies',
                     'we use cookies', 'this site uses cookies', 'agree', 'accept all'];

    const hasKeyword = keywords.some(keyword =>
      text.includes(keyword) || className.includes(keyword) || id.includes(keyword)
    );

    if (!hasKeyword) return false;

    // Check for buttons (cookie banners usually have accept/reject buttons)
    const hasButtons = element.querySelector('button, [role="button"], a[href="#"], .btn, .button');

    // Check if it's not the main content (cookie banners are usually small)
    const wordCount = text.split(/\s+/).length;
    const isSmallElement = wordCount < 200;

    return hasButtons !== null && isSmallElement;
  }
}

// Export singleton instance
export const contentDetector = new ContentDetector();