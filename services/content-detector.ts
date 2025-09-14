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
  private readonly DEFAULT_OPTIONS: ContentDetectionOptions = {
    removeNav: true,
    removeFooter: true,
    removeSidebars: true,
    removeAds: true,
    removeComments: true,
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
    let mainContent = this.findMainContent();

    // If not found, use heuristic approach
    if (!mainContent) {
      mainContent = this.findContentHeuristically();
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
  private findMainContent(): HTMLElement | null {
    for (const selector of this.CONTENT_SELECTORS) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element && this.isValidContent(element)) {
        return element.cloneNode(true) as HTMLElement;
      }
    }
    return null;
  }

  /**
   * Find content using heuristic approach
   */
  private findContentHeuristically(): HTMLElement | null {
    const candidates = this.getContentCandidates();

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
  private getContentCandidates(): HTMLElement[] {
    const candidates: HTMLElement[] = [];
    const elements = document.querySelectorAll<HTMLElement>('div, section, article, main');

    elements.forEach(element => {
      const text = element.textContent || '';
      if (text.length > this.DEFAULT_OPTIONS.minTextLength!) {
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
  private isValidContent(element: HTMLElement): boolean {
    const text = element.textContent || '';
    return text.length > this.DEFAULT_OPTIONS.minTextLength!;
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

    // Word count factor
    if (wordCount > 100) confidence += 20;
    if (wordCount > 300) confidence += 20;
    if (wordCount > 500) confidence += 20;

    // Structure factor
    if (element.querySelector('h1, h2, h3')) confidence += 15;
    if (element.querySelectorAll('p').length > 3) confidence += 15;

    // Semantic HTML factor
    if (element.tagName === 'ARTICLE' || element.tagName === 'MAIN') {
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
}

// Export singleton instance
export const contentDetector = new ContentDetector();