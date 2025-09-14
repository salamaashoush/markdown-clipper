# Research Findings: Copy as Markdown Chrome Extension

**Date**: 2025-09-13
**Feature**: Copy as Markdown Chrome Extension
**Researchers**: Technical Architecture Team

## Executive Summary
This document consolidates research findings for implementing a Chrome extension that converts web pages to markdown format. All technical decisions have been made based on the requirements specified and modern best practices for browser extension development.

## 1. WXT Framework Setup and Configuration

**Decision**: Use WXT with pnpm as package manager
**Rationale**:
- WXT provides modern development experience with HMR, TypeScript, and auto-reload
- Built-in support for Manifest V3
- Excellent SolidJS integration
- Active community and maintenance

**Alternatives Considered**:
- Plasmo: Good but less flexible for our specific needs
- CRXJS: Limited SolidJS support
- Manual Webpack: Too much boilerplate

**Setup Requirements**:
```bash
pnpm create wxt@latest
pnpm add solid-js @solidjs/router
pnpm add -D tailwindcss postcss autoprefixer
```

## 2. HTML to Markdown Conversion Libraries

**Decision**: Turndown with custom rules
**Rationale**:
- Most mature and battle-tested library
- Extensible rule system for custom conversions
- Handles complex HTML well
- CommonMark compliant by default

**Alternatives Considered**:
- html-to-md: Less mature, fewer features
- rehype-remark: Overly complex for browser environment
- Custom implementation: Too time-consuming

**Implementation Notes**:
- Use Turndown's plugin system for tables (turndown-plugin-gfm)
- Custom rules for preserving code blocks with syntax highlighting
- Configurable heading levels and link handling

## 3. Chrome Extension Manifest V3 Requirements

**Decision**: Full Manifest V3 compliance
**Rationale**:
- Required for Chrome Web Store as of 2024
- Better security and performance
- Service workers instead of background pages

**Key Requirements**:
- Service workers for background scripts
- declarativeNetRequest for network handling
- host_permissions for content access
- activeTab permission for current tab access

**Permissions Needed**:
```json
{
  "permissions": ["contextMenus", "storage", "activeTab", "tabs", "downloads"],
  "host_permissions": ["<all_urls>"]
}
```

## 4. SolidJS + WXT Integration Patterns

**Decision**: SolidJS for popup and options UI only
**Rationale**:
- Content scripts remain vanilla JS for performance
- SolidJS provides reactive UI for complex interactions
- Small bundle size critical for extensions

**Architecture**:
- Popup: SolidJS app with tab management
- Options: SolidJS app for settings
- Content: Vanilla JS for DOM extraction
- Background: Service worker with message handling

**State Management**:
- Use SolidJS stores for UI state
- Chrome Storage API for persistence
- Message passing for cross-context communication

## 5. Chrome Storage API Limits and Patterns

**Decision**: Use chrome.storage.sync with fallback to local
**Rationale**:
- Sync provides cross-device settings
- Local storage for large data or fallback
- IndexedDB for temporary caching if needed

**Limits**:
- sync: 100KB total, 8KB per item
- local: 10MB total
- Sufficient for user preferences

**Schema Design**:
```typescript
interface StorageSchema {
  preferences: UserPreferences;
  profiles: ConversionProfile[];
  recentConversions: RecentItem[];
}
```

## 6. Cross-Origin Content Access Solutions

**Decision**: Content script injection with activeTab
**Rationale**:
- activeTab permission minimizes permission warnings
- Content scripts have full DOM access
- Works with both SSR and CSR pages

**Implementation Strategy**:
1. Inject content script on demand (not all pages)
2. Use MutationObserver for dynamic content
3. Clone DOM to avoid modifying original
4. Serialize and send to service worker for processing

**CSR Handling**:
- Wait for document.readyState === 'complete'
- Optional delay for SPA route changes
- MutationObserver for dynamic content

## 7. Additional Technical Decisions

### Testing Strategy
**Decision**: Vitest + Playwright
- Vitest for unit testing libraries
- Playwright for E2E extension testing
- Mock Chrome APIs with webextension-polyfill

### Build Pipeline
**Decision**: WXT + Vite
- WXT handles manifest generation
- Vite for fast builds and HMR
- Auto-reload in development

### Code Quality
**Decision**: TypeScript + ESLint + Prettier
- Strict TypeScript configuration
- ESLint with recommended rules
- Prettier for consistent formatting
- Pre-commit hooks with husky

### Performance Optimizations
**Decision**: Lazy loading and code splitting
- Dynamic imports for large libraries
- Separate bundles per entrypoint
- Web Workers for heavy processing if needed

## Risk Mitigation

**Identified Risks**:
1. **Large page handling**: Implement streaming/chunking for pages >10MB
2. **Memory constraints**: Process DOM in chunks, clear references
3. **CSP restrictions**: Use content scripts, not inline scripts
4. **Rate limiting**: Implement request throttling for image URLs

**Mitigation Strategies**:
- Progressive enhancement for large pages
- Graceful degradation for restricted pages
- Clear error messaging for users
- Fallback options for all operations

## Conclusion

All technical decisions have been made with a focus on:
- User experience and performance
- Maintainability and testing
- Chrome Web Store compliance
- Future extensibility

The chosen stack (WXT + SolidJS + Turndown) provides the optimal balance of developer experience, performance, and feature completeness for this Chrome extension project.