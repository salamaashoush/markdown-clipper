import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import type { ConversionProfile, ProfileMatchRule } from '~/types/storage';
import { MarkdownFlavor, ProfileMatchType, MatchMode } from '~/types/storage';

interface ProfileEditorProps {
  profile: ConversionProfile;
  isNew: boolean;
  onSave: (profile: ConversionProfile) => void;
  onCancel: () => void;
}

export const ProfileEditor: Component<ProfileEditorProps> = (props) => {
  const [editedProfile, setEditedProfile] = createSignal<ConversionProfile>(props.profile);

  // Update edited profile when props.profile changes
  createEffect(() => {
    setEditedProfile(props.profile);
  });

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

  return (
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {props.isNew ? 'Create New Profile' : 'Edit Profile'}
        </h3>
        <div class="space-x-2">
          <button
            onClick={props.onCancel}
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Save Profile
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <section>
        <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-3">Basic Information</h4>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Profile Name
            </label>
            <input
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editedProfile().name}
              onChange={(e) => updateField('name', e.currentTarget.value)}
              disabled={editedProfile().id === 'default'}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Markdown Flavor
            </label>
            <select
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editedProfile().markdownFlavor}
              onChange={(e) => updateField('markdownFlavor', e.currentTarget.value)}
            >
              <option value={MarkdownFlavor.COMMONMARK}>CommonMark</option>
              <option value={MarkdownFlavor.GITHUB}>GitHub Flavored Markdown</option>
              <option value={MarkdownFlavor.GITLAB}>GitLab Flavored Markdown</option>
              <option value={MarkdownFlavor.REDDIT}>Reddit Markdown</option>
              <option value={MarkdownFlavor.DISCORD}>Discord Markdown</option>
            </select>
          </div>
        </div>
      </section>

      {/* Conversion Options */}
      <section>
        <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-3">Conversion Options</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Heading Style
            </label>
            <select
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editedProfile().conversionOptions.headingStyle}
              onChange={(e) => updateField('conversionOptions.headingStyle', e.currentTarget.value)}
            >
              <option value="atx">ATX (# Heading)</option>
              <option value="setext">Setext (Underline)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bullet List Marker
            </label>
            <select
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editedProfile().conversionOptions.bulletListMarker}
              onChange={(e) => updateField('conversionOptions.bulletListMarker', e.currentTarget.value)}
            >
              <option value="-">- (Dash)</option>
              <option value="*">* (Asterisk)</option>
              <option value="+">+ (Plus)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Code Block Style
            </label>
            <select
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editedProfile().conversionOptions.codeBlockStyle}
              onChange={(e) => updateField('conversionOptions.codeBlockStyle', e.currentTarget.value)}
            >
              <option value="fenced">Fenced (```)</option>
              <option value="indented">Indented</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Link Style
            </label>
            <select
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editedProfile().conversionOptions.linkStyle}
              onChange={(e) => updateField('conversionOptions.linkStyle', e.currentTarget.value)}
            >
              <option value="inlined">Inline</option>
              <option value="referenced">Reference</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Emphasis Delimiter
            </label>
            <select
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editedProfile().conversionOptions.emDelimiter}
              onChange={(e) => updateField('conversionOptions.emDelimiter', e.currentTarget.value)}
            >
              <option value="*">*italic*</option>
              <option value="_">_italic_</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Strong Delimiter
            </label>
            <select
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editedProfile().conversionOptions.strongDelimiter}
              onChange={(e) => updateField('conversionOptions.strongDelimiter', e.currentTarget.value)}
            >
              <option value="**">**bold**</option>
              <option value="__">__bold__</option>
            </select>
          </div>
        </div>
      </section>

      {/* Content Filters */}
      <section>
        <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-3">Content Filters</h4>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exclude CSS Selectors
            </label>
            <input
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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

          <div class="grid grid-cols-2 gap-4">
            <label class="flex items-center">
              <input
                type="checkbox"
                class="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                checked={editedProfile().contentFilters.includeHidden}
                onChange={(e) => updateField('contentFilters.includeHidden', e.currentTarget.checked)}
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Include hidden elements</span>
            </label>

            <label class="flex items-center">
              <input
                type="checkbox"
                class="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                checked={editedProfile().contentFilters.includeIframes}
                onChange={(e) => updateField('contentFilters.includeIframes', e.currentTarget.checked)}
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Include iframes</span>
            </label>

            <label class="flex items-center">
              <input
                type="checkbox"
                class="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                checked={editedProfile().contentFilters.includeScripts}
                onChange={(e) => updateField('contentFilters.includeScripts', e.currentTarget.checked)}
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Include scripts</span>
            </label>

            <label class="flex items-center">
              <input
                type="checkbox"
                class="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                checked={editedProfile().contentFilters.includeComments}
                onChange={(e) => updateField('contentFilters.includeComments', e.currentTarget.checked)}
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Include comments</span>
            </label>
          </div>
        </div>
      </section>

      {/* Output Format */}
      <section>
        <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-3">Output Format</h4>
        <div class="grid grid-cols-2 gap-4">
          <label class="flex items-center">
            <input
              type="checkbox"
              class="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              checked={editedProfile().outputFormat.addMetadata}
              onChange={(e) => updateField('outputFormat.addMetadata', e.currentTarget.checked)}
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Add metadata frontmatter</span>
          </label>

          <label class="flex items-center">
            <input
              type="checkbox"
              class="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              checked={editedProfile().outputFormat.addTableOfContents}
              onChange={(e) => updateField('outputFormat.addTableOfContents', e.currentTarget.checked)}
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Add table of contents</span>
          </label>

          <label class="flex items-center">
            <input
              type="checkbox"
              class="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              checked={editedProfile().outputFormat.addFootnotes}
              onChange={(e) => updateField('outputFormat.addFootnotes', e.currentTarget.checked)}
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Add footnotes</span>
          </label>

          <label class="flex items-center">
            <input
              type="checkbox"
              class="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              checked={editedProfile().outputFormat.preserveNewlines}
              onChange={(e) => updateField('outputFormat.preserveNewlines', e.currentTarget.checked)}
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Preserve newlines</span>
          </label>
        </div>
      </section>

      {/* URL Handling - now part of Link Handling */}
      <section>
        <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-3">URL & Link Handling</h4>
        <div class="grid grid-cols-2 gap-4">
          <label class="flex items-center">
            <input
              type="checkbox"
              class="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              checked={editedProfile().linkHandling.convertRelativeUrls}
              onChange={(e) => updateField('linkHandling.convertRelativeUrls', e.currentTarget.checked)}
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Convert relative URLs to absolute</span>
          </label>

          <label class="flex items-center">
            <input
              type="checkbox"
              class="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              checked={editedProfile().linkHandling.removeTrackingParams}
              onChange={(e) => updateField('linkHandling.removeTrackingParams', e.currentTarget.checked)}
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Remove tracking parameters</span>
          </label>
        </div>
      </section>

      {/* Profile Match Rules */}
      <section>
        <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-3">Auto-Selection Rules</h4>
        <div class="space-y-4">
          <label class="flex items-center">
            <input
              type="checkbox"
              class="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
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
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Enable auto-selection for this profile
            </span>
          </label>

          <Show when={editedProfile().matchRules?.enabled}>
            <div class="pl-6 space-y-4">
              {/* Priority */}
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority (higher number = higher priority)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  class="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editedProfile().matchRules?.priority || 10}
                  onChange={(e) => {
                    const current = editedProfile().matchRules!;
                    updateField('matchRules', { ...current, priority: parseInt(e.currentTarget.value) || 10 });
                  }}
                />
              </div>

              {/* Match Type */}
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Match Type
                </label>
                <select
                  class="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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

              {/* Rules */}
              <div>
                <div class="flex justify-between items-center mb-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Match Rules
                  </label>
                  <button
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
                    class="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Add Rule
                  </button>
                </div>

                <div class="space-y-2">
                  <For each={editedProfile().matchRules?.rules || []}>
                    {(rule, index) => (
                      <div class="flex gap-2 items-center">
                        <select
                          class="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                          class="w-28 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                          class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                          class="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </For>

                  <Show when={(!editedProfile().matchRules?.rules || editedProfile().matchRules.rules.length === 0)}>
                    <p class="text-sm text-gray-500 dark:text-gray-400 italic">
                      No rules defined. Add rules to auto-select this profile when visiting matching pages.
                    </p>
                  </Show>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </section>
    </div>
  );
};