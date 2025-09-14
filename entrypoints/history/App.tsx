/**
 * History page - Full page for viewing conversion history
 */

import { Component } from 'solid-js';
import { History } from './History';

const App: Component = () => {
  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="max-w-6xl mx-auto p-6">
        <header class="mb-8 flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Conversion History</h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">View and manage your markdown conversions</p>
          </div>
          <button
            onClick={() => window.close()}
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <History />
      </div>
    </div>
  );
};

export default App;
