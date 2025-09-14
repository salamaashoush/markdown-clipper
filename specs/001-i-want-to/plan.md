# Implementation Plan: Copy as Markdown Chrome Extension

**Branch**: `001-i-want-to` | **Date**: 2025-09-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-i-want-to/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Building a Chrome extension that converts web pages to well-formatted markdown for offline reading, sharing, and AI consumption. The extension will use WXT framework with SolidJS for UI, Tailwind for styling, and TypeScript throughout. Features include context menu integration, multi-tab processing, and extensive user configuration options.

## Technical Context
**Language/Version**: TypeScript 5.x
**Primary Dependencies**: WXT (Web Extension Framework), SolidJS, Tailwind CSS, pnpm
**Storage**: Chrome Extension Storage API for user preferences
**Testing**: Vitest for unit tests, Playwright for E2E tests
**Target Platform**: Chrome/Chromium browsers (Manifest V3)
**Project Type**: single (browser extension with popup and content scripts)
**Performance Goals**: Convert pages <2s, handle pages up to 10MB HTML
**Constraints**: Browser memory limits, cross-origin restrictions, CSP policies
**Scale/Scope**: Single user extension, unlimited tabs processing

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (browser extension)
- Using framework directly? Yes (WXT, SolidJS without wrappers)
- Single data model? Yes (UserPreferences, ConversionOptions)
- Avoiding patterns? Yes (direct state management, no unnecessary abstractions)

**Architecture**:
- EVERY feature as library? Yes (markdown converter, DOM parser, file handler)
- Libraries listed:
  - html-to-markdown: Core conversion engine
  - dom-parser: Extract and clean page content
  - file-handler: Download and naming utilities
  - preferences: User settings management
  - tab-manager: Multi-tab operations
- CLI per library: N/A (browser extension context)
- Library docs: llms.txt format planned? Yes

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes
- Git commits show tests before implementation? Yes
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (actual Chrome APIs, not mocks)
- Integration tests for: new libraries, contract changes, shared schemas? Yes
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? Yes (console with levels)
- Frontend logs → backend? N/A (extension only)
- Error context sufficient? Yes (page URL, error type, stack)

**Versioning**:
- Version number assigned? 1.0.0
- BUILD increments on every change? Yes
- Breaking changes handled? Yes (storage migration)

## Project Structure

### Documentation (this feature)
```
specs/001-i-want-to/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Browser Extension Structure
src/
├── entrypoints/         # WXT entry points
│   ├── popup/          # Extension popup UI
│   ├── content/        # Content scripts
│   ├── background/     # Service worker
│   └── options/        # Options page
├── lib/                # Core libraries
│   ├── converter/      # HTML to Markdown
│   ├── parser/         # DOM extraction
│   ├── storage/        # Preferences
│   └── utils/          # Helpers
├── components/         # SolidJS components
├── styles/            # Tailwind styles
└── types/             # TypeScript definitions

tests/
├── unit/              # Vitest unit tests
├── integration/       # API integration tests
└── e2e/              # Playwright tests

public/                # Static assets
├── icons/            # Extension icons
└── manifest.json     # Generated by WXT
```

**Structure Decision**: Single project with WXT-specific structure for browser extension

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context**:
   - WXT framework best practices for Chrome extensions
   - SolidJS integration with WXT
   - Manifest V3 requirements and limitations
   - HTML to Markdown conversion libraries
   - Chrome Extension API capabilities and restrictions
   - Cross-origin content access patterns

2. **Generate and dispatch research agents**:
   ```
   Task: "Research WXT framework setup and configuration"
   Task: "Find best HTML to Markdown conversion libraries"
   Task: "Research Chrome Extension Manifest V3 requirements"
   Task: "Investigate SolidJS + WXT integration patterns"
   Task: "Research Chrome Storage API limits and patterns"
   Task: "Find solutions for cross-origin content access"
   ```

3. **Consolidate findings** in `research.md`

**Output**: research.md with all technical decisions documented

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - UserPreferences (settings entity)
   - ConversionOptions (runtime configuration)
   - TabInfo (tab metadata)
   - MarkdownDocument (output format)

2. **Generate API contracts** from functional requirements:
   - Chrome Extension messaging API contracts
   - Storage API schemas
   - Context menu API integration
   - Downloads API integration

3. **Generate contract tests** from contracts:
   - Message passing tests
   - Storage operation tests
   - Permission validation tests

4. **Extract test scenarios** from user stories:
   - Single page conversion flow
   - Multi-tab selection and processing
   - Configuration persistence
   - Error handling scenarios

5. **Update CLAUDE.md** for Claude Code context

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Setup and configuration tasks (WXT, pnpm, TypeScript, ESLint, Prettier)
- Library implementation tasks (converter, parser, storage)
- UI component tasks (popup, options page)
- Content script tasks (DOM extraction, message handling)
- Background service worker tasks (context menu, downloads)
- Integration tasks (connect all parts)
- Testing tasks (unit, integration, E2E)

**Ordering Strategy**:
- Environment setup first
- Core libraries before UI
- Tests before implementation per TDD
- Integration tests after components

**Estimated Output**: 30-35 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No violations - project follows constitutional principles*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | - | - |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*