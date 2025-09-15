# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CI/CD workflows for automated publishing to Chrome Web Store and Firefox Add-ons
- Comprehensive deployment documentation

### Changed
- Updated README with complete feature documentation

### Fixed
- Auto-selection bug where default profile was always selected
- History storage to properly save markdown content for copy/download actions
- Storage breakdown to show real data instead of hardcoded values

## [1.0.0] - 2024-01-XX

### Added
- Chrome extension for converting web pages to markdown
- Multiple conversion profiles with customizable settings
- Auto-selection rules based on URL patterns, domains, and page content
- Conversion history with copy and download functionality
- Storage management with detailed breakdown
- Dark/light mode support
- Context menu integration
- Multi-tab processing
- Modern UI with SolidJS and Tailwind CSS

### Technical Features
- Built with WXT framework and Manifest V3
- TypeScript for type safety
- Comprehensive test suite with Vitest
- ESLint and Prettier for code quality
- Chrome storage API integration
- Turndown library for HTML to Markdown conversion

[Unreleased]: https://github.com/salamaashoush/markdown-clipper/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/salamaashoush/markdown-clipper/releases/tag/v1.0.0