/**
 * Tab list component for selecting tabs to convert
 */

import { Component, For, createSignal, createEffect } from 'solid-js';
import type { TabInfo } from '~/types/messages.ts';

interface TabListProps {
  tabs: TabInfo[];
  onSelectionChange?: (selectedTabIds: string[]) => void;
}

export const TabList: Component<TabListProps> = (props) => {
  const [selectedTabs, setSelectedTabs] = createSignal<Set<string>>(new Set());

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
    <div class="space-y-2">
      <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={selectedTabs().size === props.tabs.length && props.tabs.length > 0}
            onChange={toggleAll}
            class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
          />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Select All ({selectedTabs().size}/{props.tabs.length})
          </span>
        </label>
      </div>

      <div class="space-y-1 max-h-96 overflow-y-auto">
        <For each={props.tabs}>
          {(tab) => (
            <div
              class="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              onClick={() => toggleTab(tab.id)}
            >
              <input
                type="checkbox"
                checked={selectedTabs().has(tab.id)}
                onChange={() => toggleTab(tab.id)}
                class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 mr-3"
                onClick={(e) => e.stopPropagation()}
              />

              <div class="flex items-center flex-1 min-w-0">
                {tab.faviconUrl && (
                  <img
                    src={tab.faviconUrl}
                    alt=""
                    class="w-4 h-4 mr-2 flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}

                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {tab.title}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {tab.url}
                  </div>
                </div>
              </div>

              <div class="flex items-center ml-2 space-x-1">
                {tab.isActive && (
                  <span class="px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900 rounded-full">
                    Active
                  </span>
                )}
                {tab.pinned && (
                  <span class="px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900 rounded-full">
                    Pinned
                  </span>
                )}
                {tab.audible && (
                  <span class="px-2 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                    Playing
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