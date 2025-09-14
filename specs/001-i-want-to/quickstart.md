# Quick Start Guide: Copy as Markdown Chrome Extension

## Installation

### Prerequisites
- Node.js 18+ and pnpm installed
- Chrome/Chromium browser for testing

### Setup Steps
```bash
# Clone the repository
git clone [repository-url]
cd copy-as-markdown

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

### Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `dist` folder from the project
5. The extension icon should appear in your toolbar

## Basic Usage

### Convert Current Page

#### Method 1: Context Menu
1. Right-click anywhere on a web page
2. Select "Copy as Markdown" to copy to clipboard
3. Or select "Download as Markdown" to save as file

#### Method 2: Extension Button
1. Click the extension icon in the toolbar
2. The current tab is pre-selected
3. Click "Copy" or "Download"

### Convert Multiple Tabs

1. Click the extension icon
2. Select multiple tabs using checkboxes
3. Choose action:
   - "Copy All" - Combines into one markdown document
   - "Download All" - Saves as separate files
   - "Download as ZIP" - Creates archive with all files

### Configure Settings

1. Right-click the extension icon
2. Select "Options" or click settings in popup
3. Configure:
   - Default conversion profile
   - File naming pattern
   - Markdown flavor (CommonMark, GFM, Minimal)
   - Image handling (link, skip, download)
   - Content filters

## Testing Scenarios

### Scenario 1: Basic Page Conversion
```gherkin
Given I am on https://example.com
When I right-click and select "Copy as Markdown"
Then The page content should be in my clipboard as markdown
```

**Test Steps:**
1. Navigate to https://example.com
2. Right-click → "Copy as Markdown"
3. Paste into text editor
4. Verify markdown formatting

### Scenario 2: Multi-Tab Download
```gherkin
Given I have 3 tabs open
When I select all tabs and click "Download All"
Then 3 markdown files should be downloaded
```

**Test Steps:**
1. Open 3 different websites
2. Click extension icon
3. Select all tabs
4. Click "Download All"
5. Verify 3 .md files in Downloads

### Scenario 3: Custom Profile
```gherkin
Given I create a profile with GFM and no images
When I convert a page with images
Then The markdown should use GFM syntax without images
```

**Test Steps:**
1. Open Options
2. Create new profile:
   - Name: "No Images"
   - Markdown: GFM
   - Images: Skip
3. Convert a page with images
4. Verify no image tags in output

### Scenario 4: Dynamic Content
```gherkin
Given I am on a page with lazy-loaded content
When I scroll and convert the page
Then All visible content should be included
```

**Test Steps:**
1. Navigate to infinite scroll page
2. Scroll to load more content
3. Convert page
4. Verify loaded content is included

### Scenario 5: Error Handling
```gherkin
Given I am on a restricted page
When I try to convert it
Then I should see an error message
```

**Test Steps:**
1. Navigate to chrome://settings
2. Try to convert
3. Verify error notification appears

## Advanced Features

### Keyboard Shortcuts
- `Alt+Shift+C` - Convert current page
- `Alt+Shift+D` - Download current page
- `Alt+Shift+O` - Open options

### Batch Operations
```bash
# Convert all tabs matching pattern
1. Click extension icon
2. Use search filter: "github.com"
3. Select all filtered tabs
4. Convert selection
```

### Custom CSS Selectors
```javascript
// In options, add custom selectors:
Include: article, main, .content
Exclude: .ads, .sidebar, #comments
```

## Troubleshooting

### Extension Not Working
1. Check permissions in chrome://extensions
2. Reload the extension
3. Check DevTools console for errors

### Content Not Converting
1. Verify page is fully loaded
2. Check if page has CSP restrictions
3. Try different conversion profile

### Download Issues
1. Check Chrome download settings
2. Verify disk space
3. Check file name validity

## Command Reference

### Development Commands
```bash
pnpm dev          # Start dev server with HMR
pnpm build        # Production build
pnpm test         # Run all tests
pnpm test:unit    # Unit tests only
pnpm test:e2e     # E2E tests only
pnpm lint         # Run ESLint
pnpm format       # Run Prettier
pnpm typecheck    # TypeScript check
```

### Project Structure
```
src/
├── entrypoints/     # Extension entry points
│   ├── popup/       # Popup UI (SolidJS)
│   ├── content/     # Content scripts
│   ├── background/  # Service worker
│   └── options/     # Options page (SolidJS)
├── lib/            # Core libraries
│   ├── converter/  # Markdown conversion
│   ├── parser/     # DOM parsing
│   └── storage/    # Preferences management
└── components/     # Shared UI components
```

## Performance Benchmarks

| Page Size | Conversion Time | Memory Usage |
|-----------|----------------|--------------|
| < 100KB   | < 0.5s         | < 10MB       |
| < 1MB     | < 1s           | < 50MB       |
| < 10MB    | < 2s           | < 200MB      |

## API Integration

### Message Passing Example
```javascript
// From popup to background
chrome.runtime.sendMessage({
  type: 'CONVERT_PAGE',
  payload: {
    profileId: 'default',
    mode: 'copy'
  }
});

// From content to background
chrome.runtime.sendMessage({
  type: 'EXTRACT_CONTENT',
  payload: {
    html: document.documentElement.outerHTML,
    title: document.title
  }
});
```

### Storage API Example
```javascript
// Save preferences
await chrome.storage.sync.set({
  preferences: {
    theme: 'dark',
    autoDownload: true
  }
});

// Get preferences
const { preferences } = await chrome.storage.sync.get('preferences');
```

## Support

- GitHub Issues: [repository-url]/issues
- Documentation: [repository-url]/wiki
- Chrome Web Store: [when published]

## License

MIT License - See LICENSE file for details