# Deployment Guide

This document explains how to build and manually upload extension packages to Chrome Web Store and Firefox Add-ons.

## 🔧 Setup Requirements

### 1. Web Store Accounts

**Chrome Web Store:**
1. Create a [Chrome Web Store Developer account](https://chrome.google.com/webstore/devconsole/) ($5 registration fee)
2. Create your extension listing in the Developer Dashboard

**Firefox Add-ons:**
1. Create a [Firefox Add-ons Developer account](https://addons.mozilla.org/developers/) (free)
2. Create your extension listing in the Developer Hub

### 2. No API Configuration Required

Since we're using manual uploads, you don't need to set up any API credentials or GitHub secrets. Simply build the packages and upload them through the web interfaces.

## 🚀 Deployment Workflows

### Continuous Integration (ci.yml)
**Triggers:** Push to `main`/`develop`, Pull Requests to `main`
**Actions:**
- Runs tests on Node.js 18 & 20
- Type checking, linting, formatting
- Builds both Chrome and Firefox versions
- Uploads build artifacts

### Release (release.yml)
**Triggers:** Push tags matching `v*` (e.g., `v1.0.0`)
**Actions:**
- Builds and packages extensions
- Creates GitHub release with downloadable zip files
- Provides ready-to-upload packages for manual submission

### Beta Release (beta-release.yml)
**Triggers:** Push tags matching `v*-beta*` or `v*-alpha*` (e.g., `v1.0.0-beta.1`)
**Actions:**
- Builds and packages extensions
- Creates GitHub pre-release with downloadable packages

## 📦 Release Process

### 1. Stable Release

```bash
# Update version in package.json
npm version patch  # or minor/major

# Push changes and tags
git push origin main --follow-tags

# This triggers the release workflow, which:
# 1. Builds both Chrome and Firefox packages
# 2. Creates a GitHub release with zip files
# 3. Provides download links for manual upload
```

### 2. Manual Upload to Web Stores

After the GitHub release is created:

**Chrome Web Store:**
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Select your extension
3. Click "Package" tab
4. Upload the `copy-as-markdown-X.X.X-chrome.zip` file
5. Fill in release notes and submit for review

**Firefox Add-ons:**
1. Go to [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)
2. Select your extension
3. Click "Upload New Version"
4. Upload the `copy-as-markdown-X.X.X-firefox.zip` file
5. Upload the `copy-as-markdown-X.X.X-sources.zip` file (source code)
6. Fill in release notes and submit for review

### 3. Beta Release

```bash
# Create beta version
npm version prerelease --preid=beta

# Push changes and tags
git push origin main --follow-tags

# This creates a GitHub pre-release with packages
# Upload manually to web stores as beta/unlisted versions
```

### 4. Local Development Builds

```bash
# Build and package locally
pnpm package:all

# This creates zip files in .output/ directory
# Upload manually for testing or submission
```

## 🔍 Monitoring Deployments

### GitHub Actions
- Check the **Actions** tab in your repository
- Monitor workflow runs and build logs
- Download release artifacts for manual upload

### Web Store Status
- **Chrome**: [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- **Firefox**: [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)

### Common Issues

#### Chrome Web Store
- **Review delays**: 1-3 business days for new submissions
- **Policy violations**: Check manifest permissions and privacy policy
- **Rejected updates**: Review feedback in Developer Dashboard

#### Firefox Add-ons
- **Validation errors**: Check AMO validation results during upload
- **Source code requirement**: Always upload the sources zip file
- **Review process**: Usually faster than Chrome, often same day

## 🛠 Local Testing

Before releasing, always test locally:

```bash
# Build and test Chrome version
pnpm build
# Load .output/chrome-mv3 as unpacked extension

# Build and test Firefox version
pnpm build:firefox
# Load .output/firefox-mv2 as temporary extension

# Run full test suite
pnpm test
pnpm lint
pnpm typecheck
```

## 📋 Pre-release Checklist

- [ ] All tests pass locally
- [ ] Version number updated in `package.json`
- [ ] `CHANGELOG.md` updated with new features/fixes
- [ ] Manual testing on both Chrome and Firefox
- [ ] Privacy policy updated (if needed)
- [ ] Extension description and screenshots current
- [ ] All required permissions justified

## 🔐 Security Notes

- Never commit sensitive data to the repository
- Review extension permissions before submitting
- Test extensions thoroughly before public release
- Keep dependencies updated for security patches

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs for detailed error messages
2. Verify all secrets are correctly configured
3. Test the build process locally first
4. Check web store developer documentation for policy updates