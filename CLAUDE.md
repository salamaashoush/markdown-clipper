# Claude Code Context: MarkDown Clipper Extension

## Project Overview

MarkDown Clipper is a Chrome extension that converts web pages to well-formatted markdown for offline reading, sharing, and AI consumption. Built with WXT, SolidJS, Tailwind CSS, and TypeScript.

## Tech Stack

- **Framework**: WXT (Web Extension Toolkit) with Manifest V3
- **UI**: SolidJS + Tailwind CSS
- **Language**: TypeScript 5.x
- **Package Manager**: pnpm
- **Testing**: Vitest (unit), Playwright (E2E)
- **Markdown**: Turndown library with GFM plugin
- **Build**: Vite
- **Linting**: ESLint + Prettier

## Key Commands

```bash
pnpm dev          # Start development with HMR
pnpm build        # Production build
pnpm test         # Run all tests
pnpm lint         # Run ESLint
pnpm format       # Format with Prettier
pnpm typecheck    # TypeScript validation
```

## Project Structure

```
src/
├── entrypoints/     # WXT entry points
│   ├── popup/       # Extension popup (SolidJS)
│   ├── content/     # Content scripts (vanilla JS)
│   ├── background/  # Service worker
│   └── options/     # Options page (SolidJS)
├── lib/            # Core libraries
│   ├── converter/  # HTML→Markdown engine
│   ├── parser/     # DOM extraction
│   ├── storage/    # Chrome storage wrapper
│   └── utils/      # Helpers
├── components/     # Shared SolidJS components
├── styles/        # Tailwind styles
└── types/         # TypeScript definitions
```

## Core Features

1. **Context Menu Integration**: Right-click to copy/download
2. **Multi-Tab Processing**: Batch convert tabs
3. **Configurable Profiles**: Save conversion settings
4. **Multiple Markdown Flavors**: CommonMark, GFM, Minimal
5. **Smart Content Extraction**: Handle SSR/CSR pages

## Current Implementation Status

- [x] Technical architecture planned
- [x] Data models defined
- [x] API contracts specified
- [ ] Environment setup
- [ ] Core libraries implementation
- [ ] UI components
- [ ] Testing suite

## Development Guidelines

1. **TDD Required**: Write failing tests first
2. **No Wrappers**: Use frameworks directly
3. **Library-First**: Each feature as standalone library
4. **Type Safety**: Strict TypeScript everywhere
5. **Performance**: <2s conversion for typical pages

## Chrome APIs Used

- `chrome.contextMenus` - Right-click menu
- `chrome.storage` - User preferences
- `chrome.tabs` - Tab management
- `chrome.downloads` - File downloads
- `chrome.runtime` - Message passing

## Testing Approach

1. **Unit Tests** (Vitest): Test libraries in isolation
2. **Integration Tests**: Test Chrome API interactions
3. **E2E Tests** (Playwright): Full user workflows

## Common Tasks

### Add New Conversion Profile

```typescript
// In src/lib/storage/profiles.ts
const newProfile: ConversionProfile = {
  id: crypto.randomUUID(),
  name: 'Academic',
  markdownFlavor: MarkdownFlavor.GFM,
  // ... other settings
};
```

### Add Context Menu Item

```typescript
// In src/entrypoints/background/index.ts
chrome.contextMenus.create({
  id: 'convert-selection',
  title: 'Convert Selection',
  contexts: ['selection'],
});
```

### Handle Message from Content Script

```typescript
// In background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_CONTENT') {
    // Process extracted content
    const markdown = convertToMarkdown(message.payload);
    sendResponse({ success: true, markdown });
  }
});
```

## Debugging Tips

1. **Extension Logs**: View in chrome://extensions → Details → Inspect views
2. **Content Script Logs**: Check page DevTools console
3. **Storage Inspector**: chrome://extensions → Inspect views → Application tab
4. **Message Passing**: Log all messages in development mode

## Performance Considerations

- Lazy load Turndown library (200KB)
- Process large DOMs in chunks
- Use Web Workers for heavy conversion
- Cache converted content temporarily
- Limit concurrent tab processing
