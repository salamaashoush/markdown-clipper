/**
 * Options page main component
 */

import { Component, createSignal, onMount, Show } from 'solid-js';
import { GeneralSettings } from './views/GeneralSettings';
import { ProfileManager } from './views/ProfileManager';
import { AdvancedSettings } from './views/AdvancedSettings';
import { storage } from '~/services/storage';
import type { UserPreferences, ConversionProfile } from '~/types';

type TabView = 'general' | 'profiles' | 'advanced';

const App: Component = () => {
  const [activeTab, setActiveTab] = createSignal<TabView>('general');
  const [preferences, setPreferences] = createSignal<UserPreferences | null>(null);
  const [profiles, setProfiles] = createSignal<ConversionProfile[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [saveStatus, setSaveStatus] = createSignal<string | null>(null);

  onMount(async () => {
    await loadData();
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prefs, profileList] = await Promise.all([
        storage.getPreferences(),
        storage.getProfiles(),
      ]);
      setPreferences(prefs);
      setProfiles(profileList);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (updates: Partial<UserPreferences>) => {
    try {
      await storage.savePreferences(updates);
      const updated = await storage.getPreferences();
      setPreferences(updated);
      showSaveStatus('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      showSaveStatus('Failed to save settings');
    }
  };

  const handleProfileUpdate = async (profile: ConversionProfile) => {
    try {
      await storage.saveProfile(profile);
      const updated = await storage.getProfiles();
      setProfiles(updated);
      showSaveStatus('Profile saved successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
      showSaveStatus('Failed to save profile');
    }
  };

  const handleProfileDelete = async (profileId: string) => {
    try {
      await storage.deleteProfile(profileId);
      const updated = await storage.getProfiles();
      setProfiles(updated);
      showSaveStatus('Profile deleted successfully');
    } catch (error) {
      console.error('Failed to delete profile:', error);
      showSaveStatus('Failed to delete profile');
    }
  };

  const showSaveStatus = (message: string) => {
    setSaveStatus(message);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const tabClass = (tab: TabView) =>
    `px-4 py-2 font-medium rounded-t-lg transition-colors ${
      activeTab() === tab
        ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
    }`;

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="max-w-4xl mx-auto p-6">
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Copy as Markdown Settings</h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">Customize how web pages are converted to markdown</p>
        </header>

        <Show when={loading()}>
          <div class="flex justify-center items-center h-64">
            <div class="text-gray-500 dark:text-gray-400">Loading settings...</div>
          </div>
        </Show>

        <Show when={!loading()}>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
            {/* Tab Navigation */}
            <nav class="flex space-x-1 border-b border-gray-200 dark:border-gray-700 px-4">
              <button
                class={tabClass('general')}
                onClick={() => setActiveTab('general')}
              >
                General
              </button>
              <button
                class={tabClass('profiles')}
                onClick={() => setActiveTab('profiles')}
              >
                Conversion Profiles
              </button>
              <button
                class={tabClass('advanced')}
                onClick={() => setActiveTab('advanced')}
              >
                Advanced
              </button>
            </nav>

            {/* Tab Content */}
            <div class="p-6">
              <Show when={activeTab() === 'general' && preferences()}>
                <GeneralSettings
                  preferences={preferences()!}
                  onUpdate={handlePreferencesUpdate}
                />
              </Show>

              <Show when={activeTab() === 'profiles'}>
                <ProfileManager
                  profiles={profiles()}
                  onUpdate={handleProfileUpdate}
                  onDelete={handleProfileDelete}
                />
              </Show>

              <Show when={activeTab() === 'advanced' && preferences()}>
                <AdvancedSettings
                  preferences={preferences()!}
                  onUpdate={handlePreferencesUpdate}
                />
              </Show>
            </div>
          </div>
        </Show>

        {/* Save Status Notification */}
        <Show when={saveStatus()}>
          <div class="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
            {saveStatus()}
          </div>
        </Show>
      </div>
    </div>
  );
};

export default App;