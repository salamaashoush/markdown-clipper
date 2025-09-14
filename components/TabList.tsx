/**
 * Tab list component for selecting tabs to convert
 */

import { Component, For, Show, createSignal, createEffect } from 'solid-js';
import type { TabInfo } from '~/types/messages.ts';

interface TabListProps {
  tabs: TabInfo[];
  initialSelection?: string[];
  onSelectionChange?: (selectedTabIds: string[]) => void;
}

export const TabList: Component<TabListProps> = (props) => {
  const [selectedTabs, setSelectedTabs] = createSignal<Set<string>>(
    new Set(props.initialSelection || [])
  );

  // Update selection when initialSelection changes
  createEffect(() => {
    if (props.initialSelection && props.initialSelection.length > 0) {
      setSelectedTabs(new Set(props.initialSelection));
    }
  });

  const toggleTab = (tabId: string) => {
    const current = new Set(selectedTabs());
    if (current.has(tabId)) {
      current.delete(tabId);
    } else {
      current.add(tabId);
    }
    setSelectedTabs(current);
    props.onSelectionChange?.(Array.from(current));
  };

  const toggleAll = () => {
    const current = selectedTabs();
    if (current.size === props.tabs.length) {
      setSelectedTabs(new Set<string>());
      props.onSelectionChange?.([]);
    } else {
      const allIds = new Set<string>(props.tabs.map(tab => tab.id));
      setSelectedTabs(allIds);
      props.onSelectionChange?.(Array.from(allIds));
    }
  };

  let checkboxRef: HTMLInputElement | undefined;

  createEffect(() => {
    if (checkboxRef) {
      checkboxRef.indeterminate = selectedTabs().size > 0 && selectedTabs().size < props.tabs.length;
    }
  });

  return (
    <div>
      <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50">
        <label class="flex items-center gap-3 cursor-pointer group">
          <div class="relative">
            <input
              ref={checkboxRef}
              type="checkbox"
              checked={selectedTabs().size === props.tabs.length && props.tabs.length > 0}
              onChange={toggleAll}
              class="w-5 h-5 text-blue-600 border-2 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer"
            />
          </div>
          <div>
            <span class="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Select All Tabs
            </span>
            <span class="block text-xs text-gray-500 dark:text-gray-400">
              {selectedTabs().size} of {props.tabs.length} selected
            </span>
          </div>
        </label>
        <Show when={selectedTabs().size > 0}>
          <button
            onClick={() => {
              setSelectedTabs(new Set<string>());
              props.onSelectionChange?.([]);
            }}
            class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Clear selection
          </button>
        </Show>
      </div>

      <div>
        <For each={props.tabs}>
          {(tab) => (
            <div
              class={`group flex items-center px-3 py-2 transition-all duration-200 cursor-pointer border-l-2 ${
                selectedTabs().has(tab.id)
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500'
                  : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
              onClick={() => toggleTab(tab.id)}
            >
              <div class="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedTabs().has(tab.id)}
                  onChange={() => toggleTab(tab.id)}
                  class="w-5 h-5 text-blue-600 border-2 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <Show when={selectedTabs().has(tab.id)}>
                  <div class="absolute inset-0 w-5 h-5 bg-blue-600 rounded opacity-20 animate-ping pointer-events-none" />
                </Show>
              </div>

              <div class="flex items-center flex-1 min-w-0 ml-3">
                <div class="relative flex-shrink-0 mr-3">
                  {tab.faviconUrl ? (
                    <img
                      src={tab.faviconUrl}
                      alt=""
                      class="w-5 h-5 rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div class="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                  )}
                </div>

                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tab.title || 'Untitled'}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {new URL(tab.url).hostname}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 ml-2">
                {tab.isActive && (
                  <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 rounded-full">
                    <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Active
                  </span>
                )}
                {tab.pinned && (
                  <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                    Pinned
                  </span>
                )}
                {tab.audible && (
                  <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
                    </svg>
                    Audio
                  </span>
                )}
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};