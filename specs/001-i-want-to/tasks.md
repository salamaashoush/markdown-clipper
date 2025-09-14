# Tasks: Copy as Markdown Chrome Extension

**Input**: Design documents from `/specs/001-i-want-to/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- Browser extension structure: `src/entrypoints/`, `src/lib/`, `src/components/`
- Tests: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- All paths are relative to repository root

## Phase 3.1: Setup
- [ ] T001 Initialize WXT project with pnpm create wxt@latest
- [ ] T002 Install core dependencies: solid-js, @solidjs/router, tailwindcss, postcss, autoprefixer
- [ ] T003 Install markdown dependencies: turndown, turndown-plugin-gfm
- [ ] T004 [P] Configure TypeScript with strict mode in tsconfig.json
- [ ] T005 [P] Setup ESLint with recommended rules in .eslintrc.json
- [ ] T006 [P] Configure Prettier in .prettierrc
- [ ] T007 [P] Setup Vitest configuration in vitest.config.ts
- [ ] T008 [P] Configure Tailwind CSS in tailwind.config.js and src/styles/globals.css
- [ ] T009 Create project structure: src/entrypoints/, src/lib/, src/components/, src/types/
- [ ] T010 [P] Setup husky pre-commit hooks for linting and formatting

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests
- [ ] T011 [P] Message API contract test for CONVERT_PAGE in tests/contract/message-api/convert-page.test.ts
- [ ] T012 [P] Message API contract test for CONVERT_TABS in tests/contract/message-api/convert-tabs.test.ts
- [ ] T013 [P] Message API contract test for GET_ALL_TABS in tests/contract/message-api/get-tabs.test.ts
- [ ] T014 [P] Storage API contract test for preferences operations in tests/contract/storage-api/preferences.test.ts
- [ ] T015 [P] Storage API contract test for profiles operations in tests/contract/storage-api/profiles.test.ts
- [ ] T016 [P] Chrome API contract test for context menu in tests/contract/chrome-api/context-menu.test.ts
- [ ] T017 [P] Chrome API contract test for downloads in tests/contract/chrome-api/downloads.test.ts
- [ ] T018 [P] Chrome API contract test for tabs in tests/contract/chrome-api/tabs.test.ts

### Integration Tests
- [ ] T019 [P] Integration test for single page conversion flow in tests/integration/single-page-conversion.test.ts
- [ ] T020 [P] Integration test for multi-tab batch processing in tests/integration/multi-tab-batch.test.ts
- [ ] T021 [P] Integration test for custom profile creation and usage in tests/integration/profile-management.test.ts
- [ ] T022 [P] Integration test for CSR/dynamic content handling in tests/integration/dynamic-content.test.ts
- [ ] T023 [P] Integration test for error handling scenarios in tests/integration/error-handling.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Type Definitions
- [ ] T024 [P] Create type definitions for UserPreferences in src/types/preferences.ts
- [ ] T025 [P] Create type definitions for ConversionProfile in src/types/profile.ts
- [ ] T026 [P] Create type definitions for TabInfo and ConversionOptions in src/types/conversion.ts
- [ ] T027 [P] Create type definitions for MarkdownDocument in src/types/document.ts
- [ ] T028 [P] Create type definitions for messages in src/types/messages.ts

### Core Libraries
- [ ] T029 [P] Implement HTML to Markdown converter in src/lib/converter/index.ts
- [ ] T030 [P] Create Turndown configuration and custom rules in src/lib/converter/rules.ts
- [ ] T031 [P] Implement DOM parser and content extractor in src/lib/parser/index.ts
- [ ] T032 [P] Create content filters and selectors in src/lib/parser/filters.ts
- [ ] T033 [P] Implement Chrome storage wrapper in src/lib/storage/index.ts
- [ ] T034 [P] Create preferences manager in src/lib/storage/preferences.ts
- [ ] T035 [P] Create profiles manager in src/lib/storage/profiles.ts
- [ ] T036 [P] Implement file handler and naming utilities in src/lib/utils/files.ts
- [ ] T037 [P] Create tab manager utilities in src/lib/utils/tabs.ts
- [ ] T038 [P] Implement clipboard utilities in src/lib/utils/clipboard.ts

### Entry Points - Background Service Worker
- [ ] T039 Create background service worker entry point in src/entrypoints/background/index.ts
- [ ] T040 Implement message handler for conversion requests in src/entrypoints/background/handlers/conversion.ts
- [ ] T041 Implement message handler for tab operations in src/entrypoints/background/handlers/tabs.ts
- [ ] T042 Implement message handler for storage operations in src/entrypoints/background/handlers/storage.ts
- [ ] T043 Setup context menu creation and handlers in src/entrypoints/background/context-menu.ts
- [ ] T044 Implement download manager in src/entrypoints/background/downloads.ts

### Entry Points - Content Script
- [ ] T045 Create content script entry point in src/entrypoints/content/index.ts
- [ ] T046 Implement DOM extraction logic in src/entrypoints/content/extractor.ts
- [ ] T047 Create MutationObserver for dynamic content in src/entrypoints/content/observer.ts
- [ ] T048 Implement message listener for extraction requests in src/entrypoints/content/messaging.ts

### UI Components - Shared
- [ ] T049 [P] Create Button component in src/components/Button.tsx
- [ ] T050 [P] Create Checkbox component in src/components/Checkbox.tsx
- [ ] T051 [P] Create TabList component in src/components/TabList.tsx
- [ ] T052 [P] Create ProfileSelector component in src/components/ProfileSelector.tsx
- [ ] T053 [P] Create NotificationToast component in src/components/NotificationToast.tsx
- [ ] T054 [P] Create LoadingSpinner component in src/components/LoadingSpinner.tsx

### Entry Points - Popup UI
- [ ] T055 Create popup entry point in src/entrypoints/popup/index.tsx
- [ ] T056 Implement popup App component with SolidJS in src/entrypoints/popup/App.tsx
- [ ] T057 Create TabSelection view in src/entrypoints/popup/views/TabSelection.tsx
- [ ] T058 Create QuickActions view in src/entrypoints/popup/views/QuickActions.tsx
- [ ] T059 Implement popup state management in src/entrypoints/popup/store.ts
- [ ] T060 Add popup styling with Tailwind in src/entrypoints/popup/style.css

### Entry Points - Options Page
- [ ] T061 Create options entry point in src/entrypoints/options/index.tsx
- [ ] T062 Implement options App component with SolidJS in src/entrypoints/options/App.tsx
- [ ] T063 Create GeneralSettings view in src/entrypoints/options/views/GeneralSettings.tsx
- [ ] T064 Create ProfileManager view in src/entrypoints/options/views/ProfileManager.tsx
- [ ] T065 Create ProfileEditor component in src/entrypoints/options/components/ProfileEditor.tsx
- [ ] T066 Create AdvancedSettings view in src/entrypoints/options/views/AdvancedSettings.tsx
- [ ] T067 Add options page styling in src/entrypoints/options/style.css

## Phase 3.4: Integration

### Chrome Extension Manifest
- [ ] T068 Configure manifest.json with WXT config in wxt.config.ts
- [ ] T069 Add extension icons in public/icons/ (16, 32, 48, 128px)
- [ ] T070 Setup permissions and host_permissions in manifest

### Message Passing Integration
- [ ] T071 Connect popup to background message passing
- [ ] T072 Connect content script to background communication
- [ ] T073 Connect options page to storage sync
- [ ] T074 Implement error boundaries and fallbacks

### Storage Migration
- [ ] T075 Create storage migration system in src/lib/storage/migration.ts
- [ ] T076 Add version checking and upgrade logic

## Phase 3.5: Polish

### Unit Tests
- [ ] T077 [P] Unit tests for converter library in tests/unit/converter.test.ts
- [ ] T078 [P] Unit tests for parser library in tests/unit/parser.test.ts
- [ ] T079 [P] Unit tests for storage library in tests/unit/storage.test.ts
- [ ] T080 [P] Unit tests for file utilities in tests/unit/utils/files.test.ts
- [ ] T081 [P] Unit tests for tab utilities in tests/unit/utils/tabs.test.ts

### E2E Tests
- [ ] T082 E2E test for complete user flow in tests/e2e/user-flow.test.ts
- [ ] T083 E2E test for profile switching in tests/e2e/profile-switching.test.ts
- [ ] T084 E2E test for batch operations in tests/e2e/batch-operations.test.ts

### Documentation and Performance
- [ ] T085 [P] Create user documentation in docs/USER_GUIDE.md
- [ ] T086 [P] Create developer documentation in docs/DEVELOPER.md
- [ ] T087 [P] Add JSDoc comments to all public APIs
- [ ] T088 Performance optimization for large pages (>5MB)
- [ ] T089 Memory leak testing and fixes
- [ ] T090 Bundle size optimization with code splitting

### Final Validation
- [ ] T091 Run full test suite: unit, integration, E2E
- [ ] T092 Manual testing following quickstart.md scenarios
- [ ] T093 Build production bundle and test in Chrome
- [ ] T094 Update CLAUDE.md with final implementation details

## Dependencies
- Setup (T001-T010) must complete first
- All tests (T011-T023) before implementation (T024-T067)
- Type definitions (T024-T028) before library implementation
- Core libraries (T029-T038) before entry points
- Background worker (T039-T044) before UI components
- Shared components (T049-T054) before popup/options UI
- All implementation before integration (T068-T076)
- Integration before polish (T077-T094)

## Parallel Execution Examples

### Setup Phase
```bash
# Launch T004-T010 together (all configuration files):
Task: "Configure TypeScript with strict mode in tsconfig.json"
Task: "Setup ESLint with recommended rules in .eslintrc.json"
Task: "Configure Prettier in .prettierrc"
Task: "Setup Vitest configuration in vitest.config.ts"
Task: "Configure Tailwind CSS in tailwind.config.js"
Task: "Setup husky pre-commit hooks"
```

### Contract Tests Phase
```bash
# Launch T011-T018 together (all contract tests):
Task: "Message API contract test for CONVERT_PAGE"
Task: "Message API contract test for CONVERT_TABS"
Task: "Storage API contract test for preferences"
Task: "Chrome API contract test for context menu"
# ... etc
```

### Type Definitions Phase
```bash
# Launch T024-T028 together (all type files):
Task: "Create type definitions for UserPreferences"
Task: "Create type definitions for ConversionProfile"
Task: "Create type definitions for TabInfo"
Task: "Create type definitions for MarkdownDocument"
Task: "Create type definitions for messages"
```

### Core Libraries Phase
```bash
# Launch T029-T038 together (independent libraries):
Task: "Implement HTML to Markdown converter"
Task: "Implement DOM parser and content extractor"
Task: "Implement Chrome storage wrapper"
Task: "Implement file handler utilities"
Task: "Create tab manager utilities"
```

## Notes
- [P] tasks = different files, no dependencies
- Each task must create a failing test first (TDD)
- Commit after each task with descriptive message
- Run `pnpm typecheck` after TypeScript changes
- Run `pnpm lint` after each implementation phase
- Test in Chrome after each UI component

## Validation Checklist
*GATE: Checked before execution*

- [x] All contracts have corresponding tests (T011-T018)
- [x] All entities have type definitions (T024-T028)
- [x] All tests come before implementation
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Chrome extension specific tasks included
- [x] WXT framework tasks properly ordered