export interface ExtractOptions {
  selectors?: string[];
  excludeSelectors?: string[];
  waitForDynamic?: boolean;
  timeout?: number;
  includeHidden?: boolean;
}

export interface ExtractedContent {
  html: string;
  title: string;
  url: string;
  isLoading: boolean;
  metadata?: {
    author?: string;
    description?: string;
    publishedDate?: string;
  };
}

export class ContentParser {
  async extractContent(options: ExtractOptions = {}): Promise<ExtractedContent> {
    const {
      selectors = [],
      excludeSelectors = [],
      waitForDynamic = false,
      timeout = 5000,
      includeHidden = false,
    } = options;

    // Wait for dynamic content if requested
    if (waitForDynamic) {
      await this.waitForContent(timeout);
    }

    // Get the document or create a clone to work with
    const doc = document.cloneNode(true) as Document;

    // Extract metadata first
    const metadata = this.extractMetadata(doc);

    // Apply selectors if provided
    let contentElement: Element | null = doc.body;
    if (selectors.length > 0) {
      const tempDiv = doc.createElement('div');
      for (const selector of selectors) {
        const elements = doc.querySelectorAll(selector);
        elements.forEach((el) => {
          tempDiv.appendChild(el.cloneNode(true));
        });
      }
      contentElement = tempDiv;
    }

    // Remove excluded elements
    if (excludeSelectors.length > 0 && contentElement) {
      for (const selector of excludeSelectors) {
        const elements = contentElement.querySelectorAll(selector);
        elements.forEach((el) => el.remove());
      }
    }

    // Remove hidden elements if not included
    if (!includeHidden && contentElement) {
      const hiddenElements = contentElement.querySelectorAll(
        '[style*="display: none"], [style*="display:none"], [hidden]'
      );
      hiddenElements.forEach((el) => el.remove());
    }

    // Check for loading state
    const isLoading = this.hasLoadingIndicators(contentElement);

    // Get HTML content
    let html = '';
    if (contentElement) {
      if (contentElement === doc.body) {
        // Return only the inner HTML if it's the body
        html = contentElement.innerHTML;
      } else {
        // Return outer HTML for custom selections
        html = (contentElement as Element).innerHTML;
      }
    }

    // Clean up the HTML
    html = this.cleanHTML(html);

    // Return empty string if body has no actual content
    if (html.trim() === '') {
      html = '';
    }

    return {
      html,
      title: document.title || metadata.title || '',
      url: window.location?.href || '',
      isLoading,
      metadata: {
        author: metadata.author,
        description: metadata.description,
        publishedDate: metadata.publishedDate,
      },
    };
  }

  private async waitForContent(timeout: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = 100;

      const check = () => {
        const elapsed = Date.now() - startTime;

        // Check if content has stabilized or timeout reached
        if (elapsed >= timeout || !this.hasLoadingIndicators(document.body)) {
          resolve();
        } else {
          setTimeout(check, checkInterval);
        }
      };

      setTimeout(check, checkInterval);
    });
  }

  private hasLoadingIndicators(element: Element | null): boolean {
    if (!element) return false;

    // Check for common loading indicators
    const loadingSelectors = ['.loading', '.spinner', '[data-loading]', '.skeleton'];

    for (const selector of loadingSelectors) {
      if (element.querySelector(selector)) {
        return true;
      }
    }

    return false;
  }

  extractMetadata(doc: Document): {
    title?: string;
    author?: string;
    description?: string;
    publishedDate?: string;
  } {
    const metadata: any = {};

    // Extract from meta tags
    const metaTags = doc.querySelectorAll('meta');
    metaTags.forEach((tag) => {
      const property = tag.getAttribute('property');
      const name = tag.getAttribute('name');
      const content = tag.getAttribute('content');

      if (!content) return;

      if (property === 'og:title' || name === 'twitter:title') {
        metadata.title = content;
      } else if (property === 'og:description' || name === 'description') {
        metadata.description = content;
      } else if (name === 'author') {
        metadata.author = content;
      } else if (property === 'article:published_time') {
        metadata.publishedDate = content;
      }
    });

    // Try to extract from JSON-LD
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach((script) => {
      try {
        const data = JSON.parse(script.textContent || '');
        if (data['@type'] === 'Article' || data['@type'] === 'BlogPosting') {
          metadata.author = metadata.author || data.author?.name;
          metadata.publishedDate = metadata.publishedDate || data.datePublished;
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    });

    return metadata;
  }

  cleanHTML(html: string): string {
    // Remove script and style tags content
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove comments
    html = html.replace(/<!--[\s\S]*?-->/g, '');

    // Trim whitespace
    html = html.trim();

    return html;
  }

  async waitForSelectors(selectors: string[], timeout: number = 5000): Promise<boolean> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const check = () => {
        const elapsed = Date.now() - startTime;

        // Check if all selectors are present
        const allPresent = selectors.every((selector) => document.querySelector(selector) !== null);

        if (allPresent || elapsed >= timeout) {
          resolve(allPresent);
        } else {
          setTimeout(check, 100);
        }
      };

      check();
    });
  }

  extractMetadataFromPage(): ExtractedContent['metadata'] {
    return this.extractMetadata(document);
  }

  observeMutations(callback: (mutations: MutationRecord[]) => void): MutationObserver {
    const observer = new MutationObserver(callback);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    return observer;
  }
}
