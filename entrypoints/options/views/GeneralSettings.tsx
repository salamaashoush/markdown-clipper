import { Component, createSignal, Show, For, createMemo } from 'solid-js';
import type { UserPreferences } from '~/types/preferences';
import { TEMPLATE_VARIABLES } from '~/types/preferences';
import { NamingPattern, Theme } from '~/types/storage';
import { useTheme } from '~/components/ThemeProvider';
import { validateTemplate, processTemplate } from '~/services/file-naming';

interface GeneralSettingsProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

export const GeneralSettings: Component<GeneralSettingsProps> = (props) => {
  const [localPrefs, setLocalPrefs] = createSignal(props.preferences);
  const [activeSection, setActiveSection] = createSignal<string>('basic');
  const { setTheme } = useTheme();

  // Validate custom template
  const templateValidation = createMemo(() => {
    if (localPrefs().fileNamingPattern === NamingPattern.CUSTOM_PREFIX) {
      return validateTemplate(localPrefs().customNamingTemplate || '');
    }
    return { valid: true, errors: [], usedVariables: [] };
  });

  // Preview file name
  const fileNamePreview = createMemo(() => {
    if (localPrefs().fileNamingPattern === NamingPattern.CUSTOM_PREFIX && localPrefs().customNamingTemplate) {
      return processTemplate(localPrefs().customNamingTemplate, {
        title: 'Example Page Title',
        url: 'https://example.com/page',
        domain: 'example.com'
      });
    }
    return '';
  });

  const handleChange = (key: keyof UserPreferences, value: any) => {
    const updated = { ...localPrefs(), [key]: value };
    setLocalPrefs(updated);
    props.onUpdate({ [key]: value });

    // If theme was changed, update it immediately
    if (key === 'theme') {
      setTheme(value as Theme);
    }
  };

  const sections = createMemo(() => [
    { id: 'basic', label: 'Basic Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { id: 'appearance', label: 'Appearance', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
    { id: 'detection', label: 'Smart Detection', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { id: 'shortcuts', label: 'Shortcuts', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
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
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">General Settings</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure your extension preferences and behavior
          </p>
        </div>

        {/* Scrollable Content */}
        <div class="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          {/* Basic Settings Section */}
          <Show when={activeSection() === 'basic'}>
            <section class="space-y-6 profile-section-enter">
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Core settings that control how the extension behaves by default.</p>
                </div>
              </div>

              <div class="space-y-6">
                {/* Default Profile */}
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Conversion Profile
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    value={localPrefs().defaultProfile}
                    onChange={(e) => handleChange('defaultProfile', e.currentTarget.value)}
                  >
                    <option value="default">Default</option>
                    {/* Additional profiles would be loaded here */}
                  </select>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    The profile to use when no specific profile is selected
                  </p>
                </div>

                {/* Auto Download */}
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Auto-download markdown files
                      </label>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Automatically download files after conversion instead of copying to clipboard
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                      checked={localPrefs().autoDownload}
                      onChange={(e) => handleChange('autoDownload', e.currentTarget.checked)}
                    />
                  </div>
                </div>

                {/* File Naming Pattern */}
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    File Naming Pattern
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    value={localPrefs().fileNamingPattern}
                    onChange={(e) => handleChange('fileNamingPattern', e.currentTarget.value)}
                  >
                    <option value={NamingPattern.TAB_TITLE}>Tab Title</option>
                    <option value={NamingPattern.DOMAIN_TITLE}>Domain + Title</option>
                    <option value={NamingPattern.TIMESTAMP}>Timestamp + Title</option>
                    <option value={NamingPattern.CUSTOM_PREFIX}>Custom Pattern</option>
                  </select>
                </div>

                {/* Custom Pattern Template */}
                <Show when={localPrefs().fileNamingPattern === NamingPattern.CUSTOM_PREFIX}>
                  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custom Naming Template
                    </label>
                    <input
                      type="text"
                      class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      value={localPrefs().customNamingTemplate || ''}
                      onChange={(e) => handleChange('customNamingTemplate', e.currentTarget.value)}
                      placeholder="e.g., {title}_{date}"
                    />
                    <div class="mt-3">
                      <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Available variables:</p>
                      <div class="flex flex-wrap gap-1">
                        <For each={Object.entries(TEMPLATE_VARIABLES)}>
                          {([variable, description]) => (
                            <button
                              type="button"
                              class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              onClick={() => {
                                const current = localPrefs().customNamingTemplate || '';
                                handleChange('customNamingTemplate', current + variable);
                              }}
                              title={description}
                            >
                              {variable}
                            </button>
                          )}
                        </For>
                      </div>

                      {/* Validation feedback */}
                      <Show when={!templateValidation().valid && templateValidation().errors.length > 0}>
                        <div class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p class="text-xs text-red-600 dark:text-red-400 font-medium">Template issues:</p>
                          <ul class="text-xs text-red-500 dark:text-red-400 mt-1 list-disc list-inside">
                            <For each={templateValidation().errors}>
                              {(error) => <li>{error}</li>}
                            </For>
                          </ul>
                        </div>
                      </Show>

                      {/* File name preview */}
                      <Show when={fileNamePreview() && templateValidation().valid}>
                        <div class="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <p class="text-xs text-green-600 dark:text-green-400 font-medium">Preview:</p>
                          <p class="text-xs text-green-700 dark:text-green-300 mt-1 font-mono">
                            {fileNamePreview()}.md
                          </p>
                        </div>
                      </Show>
                    </div>
                  </div>
                </Show>

                {/* Show Notifications */}
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Show notifications
                      </label>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Display success and error notifications for actions
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                      checked={localPrefs().showNotifications}
                      onChange={(e) => handleChange('showNotifications', e.currentTarget.checked)}
                    />
                  </div>
                </div>
              </div>
            </section>
          </Show>

          {/* Appearance Section */}
          <Show when={activeSection() === 'appearance'}>
            <section class="space-y-6 profile-section-enter">
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Customize the visual appearance of the extension.</p>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <div class="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleChange('theme', 'system')}
                    class={`p-4 rounded-lg border-2 transition-all ${
                      localPrefs().theme === 'system'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p class="text-sm font-medium">System</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Follow OS theme</p>
                  </button>

                  <button
                    onClick={() => handleChange('theme', 'light')}
                    class={`p-4 rounded-lg border-2 transition-all ${
                      localPrefs().theme === 'light'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p class="text-sm font-medium">Light</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Always light</p>
                  </button>

                  <button
                    onClick={() => handleChange('theme', 'dark')}
                    class={`p-4 rounded-lg border-2 transition-all ${
                      localPrefs().theme === 'dark'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <p class="text-sm font-medium">Dark</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Always dark</p>
                  </button>
                </div>
              </div>
            </section>
          </Show>

          {/* Smart Detection Section */}
          <Show when={activeSection() === 'detection'}>
            <section class="space-y-6 profile-section-enter">
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Automatically detect and extract main content from web pages.</p>
                </div>
              </div>

              <div class="space-y-6">
                {/* Enable Smart Detection */}
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enable Smart Detection
                      </label>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Use AI-powered content extraction for better results
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                      checked={localPrefs().smartDetection?.enabled || false}
                      onChange={(e) => handleChange('smartDetection', {
                        ...localPrefs().smartDetection,
                        enabled: e.currentTarget.checked
                      })}
                    />
                  </div>
                </div>

                {/* Smart Detection Options */}
                <Show when={localPrefs().smartDetection?.enabled}>
                  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Detection Options</h5>
                    <div class="space-y-3">
                      <label class="flex items-center justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Auto-detect main content</span>
                        <input
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          checked={localPrefs().smartDetection?.autoDetectMainContent ?? true}
                          onChange={(e) => handleChange('smartDetection', {
                            ...localPrefs().smartDetection,
                            autoDetectMainContent: e.currentTarget.checked
                          })}
                        />
                      </label>

                      <label class="flex items-center justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Remove navigation menus</span>
                        <input
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          checked={localPrefs().smartDetection?.removeNavigation ?? true}
                          onChange={(e) => handleChange('smartDetection', {
                            ...localPrefs().smartDetection,
                            removeNavigation: e.currentTarget.checked
                          })}
                        />
                      </label>

                      <label class="flex items-center justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Remove footers</span>
                        <input
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          checked={localPrefs().smartDetection?.removeFooter ?? true}
                          onChange={(e) => handleChange('smartDetection', {
                            ...localPrefs().smartDetection,
                            removeFooter: e.currentTarget.checked
                          })}
                        />
                      </label>

                      <label class="flex items-center justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Remove sidebars</span>
                        <input
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          checked={localPrefs().smartDetection?.removeSidebars ?? true}
                          onChange={(e) => handleChange('smartDetection', {
                            ...localPrefs().smartDetection,
                            removeSidebars: e.currentTarget.checked
                          })}
                        />
                      </label>

                      <label class="flex items-center justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Remove advertisements</span>
                        <input
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          checked={localPrefs().smartDetection?.removeAds ?? true}
                          onChange={(e) => handleChange('smartDetection', {
                            ...localPrefs().smartDetection,
                            removeAds: e.currentTarget.checked
                          })}
                        />
                      </label>

                      <label class="flex items-center justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Remove comment sections</span>
                        <input
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          checked={localPrefs().smartDetection?.removeComments ?? true}
                          onChange={(e) => handleChange('smartDetection', {
                            ...localPrefs().smartDetection,
                            removeComments: e.currentTarget.checked
                          })}
                        />
                      </label>

                      <label class="flex items-center justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Remove cookie banners</span>
                        <input
                          type="checkbox"
                          class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          checked={localPrefs().smartDetection?.removeCookieBanners ?? true}
                          onChange={(e) => handleChange('smartDetection', {
                            ...localPrefs().smartDetection,
                            removeCookieBanners: e.currentTarget.checked
                          })}
                        />
                      </label>

                      <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <label class="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Minimum confidence threshold (%)
                        </label>
                        <div class="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            class="flex-1"
                            value={localPrefs().smartDetection?.minConfidenceThreshold || 50}
                            onChange={(e) => handleChange('smartDetection', {
                              ...localPrefs().smartDetection,
                              minConfidenceThreshold: parseInt(e.currentTarget.value) || 50
                            })}
                          />
                          <span class="w-12 text-sm text-gray-700 dark:text-gray-300">
                            {localPrefs().smartDetection?.minConfidenceThreshold || 50}%
                          </span>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Only use smart detection if confidence is above this threshold
                        </p>
                      </div>
                    </div>
                  </div>
                </Show>

                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div class="flex gap-3">
                    <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p class="text-sm text-blue-700 dark:text-blue-300 font-medium">How it works</p>
                      <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Smart detection uses DOM analysis and heuristic algorithms to identify the main content area of web pages.
                        It works best on article pages, blog posts, and documentation sites.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </Show>

          {/* Keyboard Shortcuts Section */}
          <Show when={activeSection() === 'shortcuts'}>
            <section class="space-y-6 profile-section-enter">
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Quick keyboard shortcuts for common actions.</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Copy Current Page</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Copy the entire page as markdown to clipboard
                        </p>
                      </div>
                      <div class="flex items-center gap-2">
                        <kbd class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded font-mono">
                          Ctrl+Shift+M
                        </kbd>
                        <span class="text-xs text-gray-500 dark:text-gray-400">or</span>
                        <kbd class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded font-mono">
                          ⌘+Shift+M
                        </kbd>
                      </div>
                    </div>

                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Download Current Page</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Download the entire page as a markdown file
                        </p>
                      </div>
                      <div class="flex items-center gap-2">
                        <kbd class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded font-mono">
                          Ctrl+Shift+L
                        </kbd>
                        <span class="text-xs text-gray-500 dark:text-gray-400">or</span>
                        <kbd class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded font-mono">
                          ⌘+Shift+L
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div class="flex gap-3">
                    <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p class="text-sm text-amber-700 dark:text-amber-300 font-medium">Customize shortcuts</p>
                      <p class="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Keyboard shortcuts can be customized in your browser's extension settings
                      </p>
                      <button
                        onClick={() => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })}
                        class="mt-2 text-xs text-amber-700 dark:text-amber-300 underline hover:no-underline"
                      >
                        Open shortcut settings →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </Show>
        </div>
      </div>
    </div>
  );
};
