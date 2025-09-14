/**
 * Batch export service for converting multiple tabs and creating zip files
 */

import JSZip from 'jszip';
import type { ConversionResult } from '~/types';
import { generateFileName } from './file-naming';
import type { UserPreferences } from '~/types/preferences';

export interface BatchExportOptions {
  organizeBy: 'domain' | 'date' | 'flat';
  includeIndex: boolean;
  indexFormat: 'markdown' | 'html';
  compressionLevel?: number;
}

export interface BatchExportResult {
  zipBlob: Blob;
  fileCount: number;
  totalSize: number;
  index?: string;
}

export class BatchExportService {
  private zip: JSZip;
  private options: BatchExportOptions;
  private indexEntries: Array<{
    filename: string;
    title: string;
    url: string;
    domain: string;
    timestamp: number;
  }> = [];

  constructor(options: Partial<BatchExportOptions> = {}) {
    this.zip = new JSZip();
    this.options = {
      organizeBy: 'domain',
      includeIndex: true,
      indexFormat: 'markdown',
      compressionLevel: 6,
      ...options
    };
  }

  /**
   * Add a conversion result to the zip
   */
  public addConversion(
    result: ConversionResult,
    preferences: UserPreferences,
    customFilename?: string
  ): void {
    const context = {
      title: result.metadata?.title || 'Untitled',
      url: result.metadata?.url || '',
      timestamp: Date.now()
    };

    // Generate filename
    let filename = customFilename || generateFileName(
      preferences.fileNamingPattern,
      preferences.customNamingTemplate,
      context
    );

    // Ensure .md extension
    if (!filename.endsWith('.md')) {
      filename += '.md';
    }

    // Organize by folder if needed
    let fullPath = filename;
    if (this.options.organizeBy !== 'flat') {
      const folder = this.getFolder(context);
      fullPath = `${folder}/${filename}`;
    }

    // Add to zip
    this.zip.file(fullPath, result.markdown);

    // Track for index
    this.indexEntries.push({
      filename: fullPath,
      title: context.title,
      url: context.url,
      domain: this.extractDomain(context.url),
      timestamp: context.timestamp
    });
  }

  /**
   * Add multiple conversions at once
   */
  public addMultipleConversions(
    results: ConversionResult[],
    preferences: UserPreferences
  ): void {
    results.forEach(result => {
      this.addConversion(result, preferences);
    });
  }

  /**
   * Generate and get the zip file
   */
  public async generateZip(): Promise<BatchExportResult> {
    // Add index if requested
    if (this.options.includeIndex && this.indexEntries.length > 0) {
      const index = this.generateIndex();
      const indexFilename = this.options.indexFormat === 'html'
        ? 'index.html'
        : 'index.md';
      this.zip.file(indexFilename, index);
    }

    // Generate zip blob
    const zipBlob = await this.zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: this.options.compressionLevel
      }
    });

    return {
      zipBlob,
      fileCount: this.indexEntries.length,
      totalSize: zipBlob.size,
      index: this.options.includeIndex ? this.generateIndex() : undefined
    };
  }

  /**
   * Get folder name based on organization method
   */
  private getFolder(context: { url: string; timestamp: number }): string {
    switch (this.options.organizeBy) {
      case 'domain':
        return this.extractDomain(context.url) || 'unknown';

      case 'date':
        const date = new Date(context.timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;

      default:
        return '';
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Generate index file content
   */
  private generateIndex(): string {
    if (this.options.indexFormat === 'html') {
      return this.generateHtmlIndex();
    }
    return this.generateMarkdownIndex();
  }

  /**
   * Generate markdown index
   */
  private generateMarkdownIndex(): string {
    const lines: string[] = [
      '# Copy as Markdown - Batch Export',
      '',
      `**Generated:** ${new Date().toLocaleString()}`,
      `**Total Files:** ${this.indexEntries.length}`,
      '',
      '## Contents',
      ''
    ];

    // Group by folder if organized
    if (this.options.organizeBy !== 'flat') {
      const grouped = this.groupByFolder();

      Object.entries(grouped).forEach(([folder, entries]) => {
        lines.push(`### ${folder}`);
        lines.push('');

        entries.forEach(entry => {
          const relativePath = entry.filename.replace(`${folder}/`, '');
          lines.push(`- [${entry.title}](./${entry.filename}) - [Original](${entry.url})`);
        });
        lines.push('');
      });
    } else {
      // Flat structure
      this.indexEntries.forEach(entry => {
        lines.push(`- [${entry.title}](./${entry.filename}) - [Original](${entry.url})`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Generate HTML index
   */
  private generateHtmlIndex(): string {
    const entries = this.options.organizeBy !== 'flat'
      ? this.groupByFolder()
      : { 'All Files': this.indexEntries };

    const sections = Object.entries(entries).map(([folder, items]) => {
      const listItems = items.map(entry => {
        const path = entry.filename;
        return `
          <li>
            <a href="${path}">${entry.title}</a>
            <span class="meta">
              (<a href="${entry.url}" target="_blank">Original</a>)
            </span>
          </li>`;
      }).join('');

      return folder !== 'All Files'
        ? `<h3>${folder}</h3><ul>${listItems}</ul>`
        : `<ul>${listItems}</ul>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Copy as Markdown - Batch Export</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h3 { color: #555; margin-top: 30px; }
    ul { list-style: none; padding: 0; }
    li {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .meta { color: #999; font-size: 0.9em; margin-left: 10px; }
    .stats {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>Copy as Markdown - Batch Export</h1>
  <div class="stats">
    <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
    <strong>Total Files:</strong> ${this.indexEntries.length}
  </div>
  <h2>Contents</h2>
  ${sections}
</body>
</html>`;
  }

  /**
   * Group entries by folder
   */
  private groupByFolder(): Record<string, typeof this.indexEntries> {
    const grouped: Record<string, typeof this.indexEntries> = {};

    this.indexEntries.forEach(entry => {
      const parts = entry.filename.split('/');
      const folder = parts.length > 1 ? parts[0] : 'Root';

      if (!grouped[folder]) {
        grouped[folder] = [];
      }
      grouped[folder].push(entry);
    });

    return grouped;
  }

  /**
   * Reset the zip for reuse
   */
  public reset(): void {
    this.zip = new JSZip();
    this.indexEntries = [];
  }
}

// Export singleton for simple use cases
export const batchExporter = new BatchExportService();