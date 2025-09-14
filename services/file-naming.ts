/**
 * File naming utilities for generating markdown file names
 */

import { TEMPLATE_VARIABLES, type TemplateVariable } from '~/types/preferences';

export interface FileNameContext {
  title: string;
  url: string;
  domain?: string;
  timestamp?: number;
}

/**
 * Validate a custom naming template
 */
export function validateTemplate(template: string): {
  valid: boolean;
  errors: string[];
  usedVariables: TemplateVariable[];
} {
  const errors: string[] = [];
  const usedVariables: TemplateVariable[] = [];

  if (!template || template.trim().length === 0) {
    errors.push('Template cannot be empty');
    return { valid: false, errors, usedVariables };
  }

  // Check for invalid characters in file names
  const invalidChars = /[<>:"|?*\\/]/g;
  const nonVariablePart = template.replace(/\{[^}]+\}/g, '');
  if (invalidChars.test(nonVariablePart)) {
    errors.push('Template contains invalid characters for file names: < > : " | ? * \\ /');
  }

  // Find all variables in the template
  const variablePattern = /\{([^}]+)\}/g;
  let match;
  while ((match = variablePattern.exec(template)) !== null) {
    const variable = `{${match[1]}}` as TemplateVariable;
    if (variable in TEMPLATE_VARIABLES) {
      usedVariables.push(variable);
    } else {
      errors.push(`Unknown variable: ${variable}`);
    }
  }

  // Warn if no variables are used
  if (usedVariables.length === 0) {
    errors.push('Template should include at least one variable');
  }

  return {
    valid: errors.length === 0,
    errors,
    usedVariables
  };
}

/**
 * Process a template with actual values
 */
export function processTemplate(template: string, context: FileNameContext): string {
  const now = new Date(context.timestamp || Date.now());

  // Extract domain and host from URL
  let domain = context.domain || '';
  let host = '';
  try {
    const url = new URL(context.url);
    domain = url.hostname;
    host = domain.replace(/^www\./, '').split('.')[0];
  } catch {
    // Invalid URL, use empty values
  }

  // Replace all template variables
  let fileName = template;

  // Title
  fileName = fileName.replace(/\{title\}/g, sanitizeFileName(context.title));

  // Domain and host
  fileName = fileName.replace(/\{domain\}/g, domain);
  fileName = fileName.replace(/\{host\}/g, host);

  // Date and time
  fileName = fileName.replace(/\{date\}/g, formatDate(now));
  fileName = fileName.replace(/\{time\}/g, formatTime(now));
  fileName = fileName.replace(/\{timestamp\}/g, now.getTime().toString());
  fileName = fileName.replace(/\{year\}/g, now.getFullYear().toString());
  fileName = fileName.replace(/\{month\}/g, String(now.getMonth() + 1).padStart(2, '0'));
  fileName = fileName.replace(/\{day\}/g, String(now.getDate()).padStart(2, '0'));

  // Clean up the final filename
  return sanitizeFileName(fileName);
}

/**
 * Sanitize a string to be safe for file names
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"|?*\\/]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^\w\-_.]/g, '') // Keep only word chars, dash, underscore, dot
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^[._]/, '') // Remove leading dots or underscores
    .replace(/[._]$/, '') // Remove trailing dots or underscores
    .slice(0, 200); // Limit length
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time as HH-MM-SS
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}-${minutes}-${seconds}`;
}

/**
 * Generate a file name based on the naming pattern
 */
export function generateFileName(
  pattern: string,
  customTemplate: string | undefined,
  context: FileNameContext
): string {
  switch (pattern) {
    case 'tab_title':
      return sanitizeFileName(context.title);

    case 'domain_title': {
      let domain = '';
      try {
        const url = new URL(context.url);
        domain = url.hostname.replace(/^www\./, '');
      } catch {
        domain = 'unknown';
      }
      return sanitizeFileName(`${domain}_${context.title}`);
    }

    case 'timestamp':
      return sanitizeFileName(`${formatDate(new Date())}_${context.title}`);

    case 'custom_prefix':
      if (customTemplate) {
        return processTemplate(customTemplate, context);
      }
      // Fallback to title if no template
      return sanitizeFileName(context.title);

    default:
      return sanitizeFileName(context.title);
  }
}