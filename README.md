# MarkDown Clipper 📝

A powerful Chrome extension that converts web pages to well-formatted markdown for offline reading, sharing, and AI consumption. Built with modern web technologies for performance and reliability.

## ✨ Features

### 🎯 Core Functionality
- **One-Click Conversion**: Convert any web page to markdown instantly
- **Context Menu Integration**: Right-click to copy or download markdown
- **Multi-Tab Processing**: Batch convert multiple tabs at once
- **Smart Content Detection**: Automatically extract main content from web pages

### 🔧 Conversion Profiles
- **Multiple Markdown Flavors**: CommonMark, GitHub Flavored Markdown (GFM), Minimal, and more
- **Customizable Settings**: Configure image handling, link processing, content filters
- **Auto-Selection Rules**: Automatically select profiles based on URL patterns, domains, or page content
- **Profile Priority System**: Multiple matching profiles ranked by priority

### 📊 Advanced Features
- **Conversion History**: Track all conversions with metadata and full content storage
- **Copy & Download Actions**: Quick access to previously converted content
- **Storage Management**: Monitor extension storage usage with detailed breakdown
- **Real-time Preview**: See conversion settings applied in real-time

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Seamless theme switching
- **Responsive Design**: Works perfectly across all screen sizes
- **Visual Feedback**: Clear indicators for auto-selected profiles and conversion status
- **Accessible Interface**: Built with accessibility best practices

## 🛠 Tech Stack

- **Framework**: [WXT](https://wxt.dev) (Web Extension Toolkit) with Manifest V3
- **UI Library**: [SolidJS](https://solidjs.com) for reactive components
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) for modern design
- **Language**: TypeScript 5.x for type safety
- **Package Manager**: pnpm for fast, efficient dependency management
- **Testing**: Vitest (unit tests) + Playwright (E2E tests)
- **Markdown Engine**: Turndown with GFM plugin for accurate conversion
- **Build System**: Vite for fast development and optimized builds

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Chrome browser for development

### Development Setup

```bash
# Clone the repository
git clone https://github.com/salamaashoush/markdown-clipper.git
cd markdown-clipper

# Install dependencies
pnpm install

# Start development server with hot reload
pnpm dev

# For Firefox development
pnpm dev:firefox
```

### Building for Production

```bash
# Build for Chrome
pnpm build

# Build for Firefox
pnpm build:firefox

# Create distribution packages
pnpm zip
pnpm zip:firefox
```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `.output/chrome-mv3` directory
4. The extension icon should appear in your toolbar

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with HMR |
| `pnpm build` | Production build for Chrome |
| `pnpm build:firefox` | Production build for Firefox |
| `pnpm build:all` | Build for both Chrome and Firefox |
| `pnpm package:all` | Build and package both versions |
| `pnpm test` | Run all tests |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm typecheck` | TypeScript validation |

## 🏗 Project Structure

```
src/
├── entrypoints/          # WXT entry points
│   ├── popup/           # Extension popup (SolidJS)
│   ├── content/         # Content scripts
│   ├── background/      # Service worker
│   ├── options/         # Settings page (SolidJS)
│   └── history/         # History page (SolidJS)
├── components/          # Shared SolidJS components
├── services/           # Core business logic
│   ├── storage.ts      # Chrome storage management
│   ├── history.ts      # Conversion history
│   ├── converter.ts    # HTML to Markdown conversion
│   └── profile-matcher.ts # Auto-selection logic
├── types/              # TypeScript definitions
└── assets/             # Static assets
```

## 🔧 Configuration

The extension supports extensive customization through conversion profiles:

### Profile Settings
- **Markdown Flavor**: Choose output format (CommonMark, GFM, etc.)
- **Image Handling**: Link, skip, download, or embed as base64
- **Link Processing**: Absolute, relative, reference, or remove links
- **Content Filters**: Include/exclude specific elements
- **Formatting Options**: Code blocks, tables, lists, and typography

### Auto-Selection Rules
Create rules to automatically select profiles based on:
- **Domain matching**: `github.com`, `*.google.com`
- **URL patterns**: Regex or wildcard matching
- **Page title**: Text matching with various modes
- **Meta tags**: Target specific meta content
- **CSS selectors**: Detect page elements

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests in watch mode
pnpm test --watch
```

## 📈 Performance

- **Fast Conversion**: <2s for typical web pages
- **Memory Efficient**: Optimized for large documents
- **Background Processing**: Non-blocking conversion
- **Smart Caching**: Temporary storage for improved performance

## 🚀 Deployment & CI/CD

The project includes CI/CD workflows for building and packaging extensions for manual upload:

### Automated Workflows
- **Continuous Integration**: Runs tests, builds, and validates on every push/PR
- **Release Builds**: Creates GitHub releases with ready-to-upload packages
- **Beta Releases**: Separate workflow for pre-release versions

### Release Process
```bash
# Create and push a release tag
npm version patch  # or minor/major
git push origin main --follow-tags

# This automatically:
# 1. Builds both Chrome and Firefox versions
# 2. Creates a GitHub release with downloadable zip files
# 3. Provides packages ready for manual upload to web stores
```

### Manual Upload
After GitHub release is created:
1. Download the zip files from the GitHub release
2. Upload `chrome.zip` to [Chrome Web Store](https://chrome.google.com/webstore/devconsole/)
3. Upload `firefox.zip` and `sources.zip` to [Firefox Add-ons](https://addons.mozilla.org/developers/)

### Local Development
```bash
# Build and package locally
pnpm package:all
# Creates zip files in .output/ directory for manual upload
```

For detailed instructions, see [`.github/DEPLOYMENT.md`](.github/DEPLOYMENT.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Follow TypeScript strict mode
- Use Prettier for code formatting
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Salama Ashoush** - [GitHub](https://github.com/salamaashoush)

## 🙏 Acknowledgments

- [WXT](https://wxt.dev) for the excellent web extension framework
- [SolidJS](https://solidjs.com) for the reactive UI library
- [Turndown](https://github.com/mixmark-io/turndown) for HTML to Markdown conversion
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework

---

Made with ❤️ and modern web technologies