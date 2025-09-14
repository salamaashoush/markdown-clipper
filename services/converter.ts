import TurndownService from 'turndown';
// @ts-ignore - turndown-plugin-gfm doesn't have proper types
import { tables } from 'turndown-plugin-gfm';
import type { ConversionProfile } from '~/types/storage';

export interface ConversionMetadata {
  url?: string;
  title?: string;
  author?: string;
  description?: string;
  publishedDate?: string;
}

export interface ConversionResult {
  content: string;
  fileName: string;
  sizeBytes: number;
  checksum?: string;
  metadata?: ConversionMetadata;
}

export class MarkdownConverter {
  private turndown: TurndownService;
  private profile: ConversionProfile;

  constructor(profile: ConversionProfile) {
    this.profile = profile;
    this.turndown = this.createTurndownService();
  }

  private createTurndownService(): TurndownService {
    const { conversionOptions, formatting } = this.profile;

    const service = new TurndownService({
      headingStyle: conversionOptions.headingStyle as 'atx' | 'setext',
      hr: formatting.hrStyle,
      bulletListMarker: conversionOptions.bulletListMarker,
      codeBlockStyle: conversionOptions.codeBlockStyle as 'indented' | 'fenced',
      fence: conversionOptions.fence,
      emDelimiter: conversionOptions.emDelimiter as '_' | '*',
      strongDelimiter: conversionOptions.strongDelimiter as '__' | '**',
      linkStyle: conversionOptions.linkStyle as 'inlined' | 'referenced',
      linkReferenceStyle: conversionOptions.linkReferenceStyle as 'full' | 'collapsed' | 'shortcut',
    });

    // Apply GFM plugins if needed
    if (this.profile.markdownFlavor === 'gfm' || this.profile.markdownFlavor === 'github') {
      // Use only the tables plugin
      service.use(tables);

      // Remove default handling of del first
      service.remove('del');
      service.remove('s');

      // Add our own strikethrough with double tildes (GFM standard)
      service.addRule('strikethrough', {
        filter: function (node) {
          const tagName = node.nodeName.toLowerCase();
          return tagName === 'del' || tagName === 's' || tagName === 'strike';
        },
        replacement: function (content) {
          return '~~' + content + '~~';
        },
      });
    }

    // Configure link handling
    if (this.profile.linkHandling.style === 'remove') {
      // Remove all links, keep only text content
      service.addRule('removeLinks', {
        filter: 'a',
        replacement: (content) => content,
      });
    } else if (this.profile.linkHandling.removeTrackingParams) {
      // Keep links but remove tracking parameters
      service.addRule('cleanLinks', {
        filter: 'a',
        replacement: (content, node) => {
          const anchor = node as HTMLAnchorElement;
          let href = anchor.getAttribute('href') || '';

          // Remove tracking parameters
          if (href) {
            try {
              const isRelative = !href.startsWith('http');
              const baseUrl = isRelative ? 'https://example.com' : undefined;
              const url = new URL(href, baseUrl);
              const trackingParams = [
                'utm_source',
                'utm_medium',
                'utm_campaign',
                'utm_term',
                'utm_content',
                'fbclid',
                'gclid',
              ];

              trackingParams.forEach((param) => url.searchParams.delete(param));

              if (isRelative) {
                href = url.pathname + url.search + url.hash;
              } else {
                // Use href property to avoid trailing slash issues
                href = url.href;
                // Remove trailing slash if it wasn't in the original
                if (!anchor.getAttribute('href')?.endsWith('/') && href.endsWith('/')) {
                  href = href.slice(0, -1);
                }
              }
            } catch (e) {
              // Invalid URL, keep as is
            }
          }

          const title = anchor.title ? ' "' + anchor.title + '"' : '';
          return '[' + content + '](' + href + title + ')';
        },
      });
    }

    // Configure image handling
    const { strategy } = this.profile.imageHandling;
    if (strategy === 'skip') {
      service.remove('img');
    } else {
      // Default handling or LINK strategy
      service.addRule('imageHandling', {
        filter: 'img',
        replacement: (_content, node) => {
          const img = node as HTMLImageElement;
          const alt = img.alt || this.profile.imageHandling.fallbackAltText || 'Image';
          let src = img.getAttribute('src') || '';

          // Handle relative URLs - just use the src as-is for relative paths
          // Turndown will handle it correctly
          const title = img.title ? ' "' + img.title + '"' : '';
          return `![${alt}](${src}${title})`;
        },
      });
    }

    // Handle max heading level
    const { maxHeadingLevel } = this.profile.contentFilters;
    if (maxHeadingLevel < 6) {
      for (let level = maxHeadingLevel + 1; level <= 6; level++) {
        service.addRule(`heading${level}`, {
          filter: (node) => node.nodeName.toLowerCase() === `h${level}`,
          replacement: (content) => {
            // Convert to bold instead of heading
            return '\n\n**' + content + '**\n\n';
          },
        });
      }
    }

    return service;
  }

  convert(html: string, metadata?: ConversionMetadata): ConversionResult {
    // Parse HTML string to DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Apply content filters before conversion
    this.applyContentFilters(doc);

    // Get the HTML to convert
    const htmlToConvert = doc.body.innerHTML;

    // Convert to markdown
    let content = this.turndown.turndown(htmlToConvert);

    // Post-process to fix list formatting
    // Remove extra spaces that Turndown adds
    content = content
      .replace(/^(-|\*|\+)\s{2,}/gm, '$1 ') // Fix bullet list spacing
      .replace(/^(\d+\.)\s{2,}/gm, '$1 '); // Fix ordered list spacing

    // Add metadata if enabled
    if (this.profile.outputFormat.addMetadata && metadata) {
      content = this.addMetadata(content, metadata);
    }

    // Clean up extra whitespace
    content = content.replace(/\n{3,}/g, '\n\n').trim();

    // Generate filename
    const fileName = this.generateFileName(metadata?.title);

    // Calculate size
    const sizeBytes = new TextEncoder().encode(content).length;

    // Generate checksum
    const checksum = this.generateChecksum(content);

    return {
      content,
      fileName,
      sizeBytes,
      checksum,
      metadata,
    };
  }

  private applyContentFilters(doc: Document): void {
    const { excludeCss, includeHidden } = this.profile.contentFilters;

    // Remove excluded elements BEFORE conversion
    if (excludeCss && excludeCss.length > 0) {
      excludeCss.forEach((selector) => {
        try {
          const elements = doc.body.querySelectorAll(selector);
          elements.forEach((el) => el.remove());
        } catch (e) {
          // Invalid selector, skip
        }
      });
    }

    // Remove hidden elements if not included
    if (!includeHidden) {
      const hiddenElements = doc.body.querySelectorAll(
        '[style*="display: none"], [style*="display:none"], [hidden]'
      );
      hiddenElements.forEach((el) => el.remove());
    }
  }

  private addMetadata(content: string, metadata: ConversionMetadata): string {
    const metaLines: string[] = ['---'];

    if (metadata.title) {
      // Add quotes around title if it contains special characters
      const needsQuotes = /[:\-\[\]{}|>\"']/.test(metadata.title);
      metaLines.push(
        `title: ${needsQuotes ? `"${metadata.title.replace(/"/g, '\\"')}"` : metadata.title}`
      );
    }
    if (metadata.url) {
      metaLines.push(`url: ${metadata.url}`);
    }
    if (metadata.author) {
      metaLines.push(`author: "${metadata.author}"`);
    }
    if (metadata.description) {
      metaLines.push(`description: "${metadata.description}"`);
    }
    if (metadata.publishedDate) {
      metaLines.push(`published: ${metadata.publishedDate}`);
    }

    // Add conversion metadata
    metaLines.push(`converted: ${new Date().toISOString()}`);
    metaLines.push(`converter: Copy as Markdown Extension`);
    metaLines.push(`profile: ${this.profile.name}`);

    metaLines.push('---');

    return metaLines.join('\n') + '\n\n' + content;
  }

  private generateFileName(title?: string): string {
    if (!title) {
      const timestamp = new Date().toISOString().split('T')[0];
      return `markdown-${timestamp}.md`;
    }

    // Sanitize title for filename
    const sanitized = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);

    return sanitized ? `${sanitized}.md` : 'markdown.md';
  }

  private generateChecksum(content: string): string {
    // Simple checksum for demo purposes
    // In production, use a proper hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}
