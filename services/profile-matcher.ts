/**
 * Profile matching service for auto-selecting profiles based on page criteria
 */

import type { ConversionProfile, ProfileMatchRule, ProfileMatchRules } from '~/types/storage';

export interface PageContext {
  url: string;
  title: string;
  domain?: string;
  metaTags?: Record<string, string>;
  hasSelector?: (selector: string) => boolean;
}

export class ProfileMatcher {
  /**
   * Find the best matching profile for a given page context
   */
  public findMatchingProfile(
    profiles: ConversionProfile[],
    context: PageContext
  ): ConversionProfile | null {
    // Filter profiles with enabled match rules
    const candidateProfiles = profiles.filter(
      p => p.matchRules?.enabled && p.matchRules.rules.length > 0
    );

    if (candidateProfiles.length === 0) {
      // Return default profile if no profiles have match rules
      return profiles.find(p => p.isDefault) || null;
    }

    // Find all matching profiles
    const matchingProfiles = candidateProfiles.filter(profile =>
      this.profileMatches(profile, context)
    );

    if (matchingProfiles.length === 0) {
      // No matches, return default
      return profiles.find(p => p.isDefault) || null;
    }

    // Sort by priority (higher priority first)
    matchingProfiles.sort((a, b) => {
      const priorityA = a.matchRules?.priority || 0;
      const priorityB = b.matchRules?.priority || 0;
      return priorityB - priorityA;
    });

    return matchingProfiles[0];
  }

  /**
   * Check if a profile matches the given page context
   */
  private profileMatches(profile: ConversionProfile, context: PageContext): boolean {
    const matchRules = profile.matchRules;
    if (!matchRules || !matchRules.enabled) {
      return false;
    }

    const results = matchRules.rules.map(rule =>
      this.ruleMatches(rule, context)
    );

    // Apply match type logic
    if (matchRules.matchType === 'all') {
      return results.every(r => r);
    } else {
      return results.some(r => r);
    }
  }

  /**
   * Check if a single rule matches the context
   */
  private ruleMatches(rule: ProfileMatchRule, context: PageContext): boolean {
    switch (rule.type) {
      case 'domain':
        return this.matchesPattern(
          context.domain || this.extractDomain(context.url),
          rule.pattern,
          rule.matchMode
        );

      case 'url_pattern':
        return this.matchesPattern(context.url, rule.pattern, rule.matchMode);

      case 'title':
        return this.matchesPattern(context.title, rule.pattern, rule.matchMode);

      case 'meta_tag':
        if (!context.metaTags) return false;
        // Pattern format: "name:content" or "property:content"
        const [metaName, metaValue] = rule.pattern.split(':');
        const actualValue = context.metaTags[metaName];
        return actualValue ? this.matchesPattern(actualValue, metaValue || '', rule.matchMode) : false;

      case 'selector':
        return context.hasSelector ? context.hasSelector(rule.pattern) : false;

      default:
        return false;
    }
  }

  /**
   * Match a value against a pattern using the specified mode
   */
  private matchesPattern(value: string, pattern: string, mode: string): boolean {
    if (!value) return false;

    const lowerValue = value.toLowerCase();
    const lowerPattern = pattern.toLowerCase();

    switch (mode) {
      case 'exact':
        return lowerValue === lowerPattern;

      case 'contains':
        // Special case: "*" matches everything
        if (pattern === '*') return true;
        return lowerValue.includes(lowerPattern);

      case 'starts_with':
        return lowerValue.startsWith(lowerPattern);

      case 'ends_with':
        return lowerValue.endsWith(lowerPattern);

      case 'regex':
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(value);
        } catch {
          console.error('Invalid regex pattern:', pattern);
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Get a description of why a profile matches
   */
  public getMatchReason(profile: ConversionProfile, context: PageContext): string[] {
    const reasons: string[] = [];
    const matchRules = profile.matchRules;

    if (!matchRules || !matchRules.enabled) {
      return reasons;
    }

    for (const rule of matchRules.rules) {
      if (this.ruleMatches(rule, context)) {
        reasons.push(this.getRuleDescription(rule));
      }
    }

    return reasons;
  }

  /**
   * Get human-readable description of a rule
   */
  private getRuleDescription(rule: ProfileMatchRule): string {
    const modeText = {
      exact: 'exactly matches',
      contains: 'contains',
      starts_with: 'starts with',
      ends_with: 'ends with',
      regex: 'matches pattern',
    }[rule.matchMode] || 'matches';

    const typeText = {
      domain: 'Domain',
      url_pattern: 'URL',
      title: 'Page title',
      meta_tag: 'Meta tag',
      selector: 'CSS selector',
    }[rule.type] || 'Field';

    return `${typeText} ${modeText} "${rule.pattern}"`;
  }
}

// Export singleton instance
export const profileMatcher = new ProfileMatcher();