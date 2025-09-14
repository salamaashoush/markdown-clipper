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
    `relative px-6 py-3 font-medium transition-all duration-200 ${
      activeTab() === tab
        ? 'text-primary-600 dark:text-primary-400'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
    }`;

  const getTabIcon = (tab: TabView) => {
    switch (tab) {
      case 'general':
        return (
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'profiles':
        return (
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'advanced':
        return (
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        );
    }
  };

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="max-w-6xl mx-auto p-6">
        <header class="mb-10">
          <div class="flex items-center gap-3 mb-3">
            <div class="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <svg class="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Copy as Markdown</h1>
              <p class="text-gray-600 dark:text-gray-400">Configure your markdown conversion preferences</p>
            </div>
          </div>
        </header>

        <Show when={loading()}>
          <div class="flex justify-center items-center h-64">
            <div class="flex items-center gap-3">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span class="text-gray-500 dark:text-gray-400">Loading settings...</span>
            </div>
          </div>
        </Show>

        <Show when={!loading()}>
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            {/* Enhanced Tab Navigation */}
            <nav class="relative bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center">
                {(['general', 'profiles', 'advanced'] as TabView[]).map((tab) => (
                  <button
                    class={tabClass(tab)}
                    onClick={() => setActiveTab(tab)}
                  >
                    <div class="flex items-center gap-2">
                      {getTabIcon(tab)}
                      <span class="hidden sm:inline">{tab === 'profiles' ? 'Conversion Profiles' : tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                      <span class="sm:hidden">{tab === 'profiles' ? 'Profiles' : tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                    </div>
                    <Show when={activeTab() === tab}>
                      <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"></div>
                    </Show>
                  </button>
                ))}
              </div>
            </nav>

            {/* Tab Content */}
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
        </Show>

        {/* Save Status Notification */}
        <Show when={saveStatus()}>
          <div class="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slideInRight">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {saveStatus()}
          </div>
        </Show>
      </div>
    </div>
  );
};

export default App;
