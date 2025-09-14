import { Component, createSignal, createEffect, Show, For, createMemo } from 'solid-js';
import type { ConversionProfile, ProfileMatchRule } from '~/types/storage';
import { MarkdownFlavor, ProfileMatchType, MatchMode } from '~/types/storage';
import { Button } from '~/components/Button';

interface ProfileEditorProps {
  profile: ConversionProfile;
  isNew: boolean;
  onSave: (profile: ConversionProfile) => void;
  onCancel: () => void;
}

export const ProfileEditor: Component<ProfileEditorProps> = (props) => {
  // Create a deep copy of the profile to avoid mutating the original
  const [editedProfile, setEditedProfile] = createSignal<ConversionProfile>(
    JSON.parse(JSON.stringify(props.profile))
  );
  const [activeSection, setActiveSection] = createSignal<string>('basic');

  const updateField = (path: string, value: any) => {
    const updated = { ...editedProfile() };
    const keys = path.split('.');
    let obj: any = updated;

    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
    setEditedProfile(updated);
  };

  const handleSave = () => {
    props.onSave({
      ...editedProfile(),
      updatedAt: Date.now(),
    });
  };

  const sections = createMemo(() => [
    { id: 'basic', label: 'Basic Info', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'conversion', label: 'Conversion', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'filters', label: 'Content Filters', icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' },
    { id: 'output', label: 'Output Format', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'links', label: 'Links', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    { id: 'rules', label: 'Auto-Selection', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  ]);

  return (
    <div class="flex h-full bg-white dark:bg-gray-800">
      {/* Sidebar Navigation */}
      <div class="w-52 border-r border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
        <div class="space-y-1">
          <For each={sections()}>
            {(section) => (
              <button
                onClick={() => setActiveSection(section.id)}
                class={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeSection() === section.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={section.icon} />
                </svg>
                <span class="text-left">{section.label}</span>
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Content Area */}
      <div class="flex-1 flex flex-col">
        {/* Header */}
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {props.isNew ? 'Create New Profile' : editedProfile().name}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {props.isNew ? 'Configure your new conversion profile' : 'Customize conversion settings for this profile'}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <Button
              onClick={props.onCancel}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
              class="gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Save Profile
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div class="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          {/* Basic Info */}
          <Show when={activeSection() === 'basic'}>
            <section class="space-y-6 profile-section-enter">
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Basic settings that define how this profile is identified and categorized.</p>
                </div>
              </div>

              <div class="space-y-5">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Name
                  </label>
                  <input
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    value={editedProfile().name}
                    onChange={(e) => updateField('name', e.currentTarget.value)}
                    disabled={editedProfile().id === 'default'}
                    placeholder="Enter profile name"
                  />
                  <Show when={editedProfile().id === 'default'}>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Default profile name cannot be changed</p>
                  </Show>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Markdown Flavor
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    value={editedProfile().markdownFlavor}
                    onChange={(e) => updateField('markdownFlavor', e.currentTarget.value)}
                  >
                    <option value={MarkdownFlavor.COMMONMARK}>CommonMark</option>
                    <option value={MarkdownFlavor.GITHUB}>GitHub Flavored Markdown</option>
                    <option value={MarkdownFlavor.GITLAB}>GitLab Flavored Markdown</option>
                    <option value={MarkdownFlavor.REDDIT}>Reddit Markdown</option>
                    <option value={MarkdownFlavor.DISCORD}>Discord Markdown</option>
                  </select>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Choose the markdown syntax that works best with your target platform
                  </p>
                </div>
              </div>
            </section>
          </Show>

          {/* Conversion Options */}
          <Show when={activeSection() === 'conversion'}>
            <section class="space-y-6 profile-section-enter">
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Control how HTML elements are converted to markdown syntax.</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Heading Style
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    value={editedProfile().conversionOptions.headingStyle}
                    onChange={(e) => updateField('conversionOptions.headingStyle', e.currentTarget.value)}
                  >
                    <option value="atx">ATX (# Heading)</option>
                    <option value="setext">Setext (Underline)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bullet List Marker
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    value={editedProfile().conversionOptions.bulletListMarker}
                    onChange={(e) => updateField('conversionOptions.bulletListMarker', e.currentTarget.value)}
                  >
                    <option value="-">- (Dash)</option>
                    <option value="*">* (Asterisk)</option>
                    <option value="+">+ (Plus)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Code Block Style
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    value={editedProfile().conversionOptions.codeBlockStyle}
                    onChange={(e) => updateField('conversionOptions.codeBlockStyle', e.currentTarget.value)}
                  >
                    <option value="fenced">Fenced (```)</option>
                    <option value="indented">Indented</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Link Style
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    value={editedProfile().conversionOptions.linkStyle}
                    onChange={(e) => updateField('conversionOptions.linkStyle', e.currentTarget.value)}
                  >
                    <option value="inlined">Inline</option>
                    <option value="referenced">Reference</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Emphasis Delimiter
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    value={editedProfile().conversionOptions.emDelimiter}
                    onChange={(e) => updateField('conversionOptions.emDelimiter', e.currentTarget.value)}
                  >
                    <option value="*">*italic*</option>
                    <option value="_">_italic_</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Strong Delimiter
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    value={editedProfile().conversionOptions.strongDelimiter}
                    onChange={(e) => updateField('conversionOptions.strongDelimiter', e.currentTarget.value)}
                  >
                    <option value="**">**bold**</option>
                    <option value="__">__bold__</option>
                  </select>
                </div>
              </div>
            </section>
          </Show>

          {/* Content Filters */}
          <Show when={activeSection() === 'filters'}>
            <section class="space-y-6 profile-section-enter">
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Filter out unwanted content during conversion.</p>
                </div>
              </div>

              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exclude CSS Selectors
                  </label>
                  <input
                    type="text"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    value={editedProfile().contentFilters.excludeCss.join(', ')}
                    onChange={(e) => {
                      const selectors = e.currentTarget.value.split(',').map(s => s.trim()).filter(Boolean);
                      updateField('contentFilters.excludeCss', selectors);
                    }}
                    placeholder="e.g., .ads, .sidebar, #footer"
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Comma-separated CSS selectors to exclude from conversion
                  </p>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Content Types</h5>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        class="mr-3 w-4 h-4 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                        checked={editedProfile().contentFilters.includeHidden}
                        onChange={(e) => updateField('contentFilters.includeHidden', e.currentTarget.checked)}
                      />
                      <span class="text-sm text-gray-700 dark:text-gray-300">Include hidden elements</span>
                    </label>

                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        class="mr-3 w-4 h-4 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                        checked={editedProfile().contentFilters.includeIframes}
                        onChange={(e) => updateField('contentFilters.includeIframes', e.currentTarget.checked)}
                      />
                      <span class="text-sm text-gray-700 dark:text-gray-300">Include iframes</span>
                    </label>

                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        class="mr-3 w-4 h-4 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                        checked={editedProfile().contentFilters.includeScripts}
                        onChange={(e) => updateField('contentFilters.includeScripts', e.currentTarget.checked)}
                      />
                      <span class="text-sm text-gray-700 dark:text-gray-300">Include scripts</span>
                    </label>

                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        class="mr-3 w-4 h-4 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                        checked={editedProfile().contentFilters.includeComments}
                        onChange={(e) => updateField('contentFilters.includeComments', e.currentTarget.checked)}
                      />
                      <span class="text-sm text-gray-700 dark:text-gray-300">Include comments</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>
          </Show>

          {/* Output Format */}
          <Show when={activeSection() === 'output'}>
            <section class="space-y-6 profile-section-enter">
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Customize the structure and formatting of the generated markdown.</p>
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Output Options</h5>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      class="mr-3 w-4 h-4 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                      checked={editedProfile().outputFormat.addMetadata}
                      onChange={(e) => updateField('outputFormat.addMetadata', e.currentTarget.checked)}
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Add metadata frontmatter</span>
                  </label>

                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      class="mr-3 w-4 h-4 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                      checked={editedProfile().outputFormat.addTableOfContents}
                      onChange={(e) => updateField('outputFormat.addTableOfContents', e.currentTarget.checked)}
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Add table of contents</span>
                  </label>

                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      class="mr-3 w-4 h-4 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                      checked={editedProfile().outputFormat.addFootnotes}
                      onChange={(e) => updateField('outputFormat.addFootnotes', e.currentTarget.checked)}
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Add footnotes</span>
                  </label>

                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      class="mr-3 w-4 h-4 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                      checked={editedProfile().outputFormat.preserveNewlines}
                      onChange={(e) => updateField('outputFormat.preserveNewlines', e.currentTarget.checked)}
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Preserve newlines</span>
                  </label>
                </div>
              </div>
            </section>
          </Show>

          {/* URL Handling - now part of Link Handling */}
          <Show when={activeSection() === 'links'}>
            <section class="space-y-6 profile-section-enter">
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Configure how links and URLs are processed.</p>
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Link Processing</h5>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      class="mr-3 w-4 h-4 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                      checked={editedProfile().linkHandling.convertRelativeUrls}
                      onChange={(e) => updateField('linkHandling.convertRelativeUrls', e.currentTarget.checked)}
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Convert relative URLs to absolute</span>
                  </label>

                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      class="mr-3 w-4 h-4 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                      checked={editedProfile().linkHandling.removeTrackingParams}
                      onChange={(e) => updateField('linkHandling.removeTrackingParams', e.currentTarget.checked)}
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Remove tracking parameters</span>
                  </label>
                </div>
              </div>
            </section>
          </Show>

          {/* Profile Match Rules */}
          <Show when={activeSection() === 'rules'}>
            <section class="space-y-6 profile-section-enter">
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Define rules to automatically select this profile based on page content.</p>
                </div>
              </div>

              <div class="space-y-6">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    class="mr-3 w-4 h-4 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                    checked={editedProfile().matchRules?.enabled || false}
                    onChange={(e) => {
                      const current = editedProfile().matchRules || {
                        enabled: false,
                        priority: 10,
                        rules: [],
                        matchType: 'any' as const,
                      };
                      updateField('matchRules', { ...current, enabled: e.currentTarget.checked });
                    }}
                  />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable automatic profile selection
                  </span>
                </label>

                <Show when={editedProfile().matchRules?.enabled}>
                  <div class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Priority
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                          value={editedProfile().matchRules?.priority || 10}
                          onChange={(e) => {
                            const current = editedProfile().matchRules!;
                            updateField('matchRules', { ...current, priority: parseInt(e.currentTarget.value) || 10 });
                          }}
                        />
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Higher number = higher priority</p>
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Match Type
                        </label>
                        <select
                          class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                          value={editedProfile().matchRules?.matchType || 'any'}
                          onChange={(e) => {
                            const current = editedProfile().matchRules!;
                            updateField('matchRules', { ...current, matchType: e.currentTarget.value as 'any' | 'all' });
                          }}
                        >
                          <option value="any">Match any rule</option>
                          <option value="all">Match all rules</option>
                        </select>
                      </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div class="flex justify-between items-center mb-4">
                        <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Match Rules
                        </h5>
                        <Button
                          type="button"
                          onClick={() => {
                            const current = editedProfile().matchRules!;
                            const newRule: ProfileMatchRule = {
                              type: ProfileMatchType.DOMAIN,
                              pattern: '',
                              matchMode: MatchMode.CONTAINS,
                            };
                            updateField('matchRules', {
                              ...current,
                              rules: [...(current.rules || []), newRule],
                            });
                          }}
                          variant="primary"
                          size="sm"
                          class="gap-1.5"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                          </svg>
                          Add Rule
                        </Button>
                      </div>

                      <div class="space-y-3">
                        <For each={editedProfile().matchRules?.rules || []}>
                          {(rule, index) => (
                            <div class="flex gap-2 items-center bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                              <select
                                class="w-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={rule.type}
                                onChange={(e) => {
                                  const current = editedProfile().matchRules!;
                                  const rules = [...current.rules];
                                  rules[index()] = { ...rules[index()], type: e.currentTarget.value as ProfileMatchType };
                                  updateField('matchRules', { ...current, rules });
                                }}
                              >
                                <option value={ProfileMatchType.DOMAIN}>Domain</option>
                                <option value={ProfileMatchType.URL_PATTERN}>URL</option>
                                <option value={ProfileMatchType.TITLE}>Title</option>
                                <option value={ProfileMatchType.META_TAG}>Meta Tag</option>
                                <option value={ProfileMatchType.SELECTOR}>CSS Selector</option>
                              </select>

                              <select
                                class="w-28 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={rule.matchMode}
                                onChange={(e) => {
                                  const current = editedProfile().matchRules!;
                                  const rules = [...current.rules];
                                  rules[index()] = { ...rules[index()], matchMode: e.currentTarget.value as MatchMode };
                                  updateField('matchRules', { ...current, rules });
                                }}
                              >
                                <option value={MatchMode.EXACT}>Exact</option>
                                <option value={MatchMode.CONTAINS}>Contains</option>
                                <option value={MatchMode.STARTS_WITH}>Starts with</option>
                                <option value={MatchMode.ENDS_WITH}>Ends with</option>
                                <option value={MatchMode.REGEX}>Regex</option>
                              </select>

                              <input
                                type="text"
                                placeholder={rule.type === ProfileMatchType.META_TAG ? "name:content" : "Pattern..."}
                                class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={rule.pattern}
                                onChange={(e) => {
                                  const current = editedProfile().matchRules!;
                                  const rules = [...current.rules];
                                  rules[index()] = { ...rules[index()], pattern: e.currentTarget.value };
                                  updateField('matchRules', { ...current, rules });
                                }}
                              />

                              <button
                                type="button"
                                onClick={() => {
                                  const current = editedProfile().matchRules!;
                                  const rules = current.rules.filter((_, i) => i !== index());
                                  updateField('matchRules', { ...current, rules });
                                }}
                                class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                title="Remove rule"
                              >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </For>

                        <Show when={(!editedProfile().matchRules?.rules || editedProfile().matchRules.rules.length === 0)}>
                          <div class="text-center py-6">
                            <svg class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                              No rules defined yet
                            </p>
                            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Add rules to auto-select this profile
                            </p>
                          </div>
                        </Show>
                      </div>
                    </div>
                  </div>
                </Show>
              </div>
            </section>
          </Show>
        </div>
      </div>
    </div>
  );
};
