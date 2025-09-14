import { Component, createSignal, Show, For, onMount, createEffect } from 'solid-js';
import type { ConversionProfile } from '~/types/storage';
import { ProfileEditor } from '../components/ProfileEditor';
import { DEFAULT_PROFILE } from '~/types/storage';
import { Button } from '~/components/Button';

interface ProfileManagerProps {
  profiles: ConversionProfile[];
  onUpdate: (profile: ConversionProfile) => void;
  onDelete: (profileId: string) => void;
}

export const ProfileManager: Component<ProfileManagerProps> = (props) => {
  const [selectedProfile, setSelectedProfile] = createSignal<ConversionProfile | null>(null);
  const [isEditing, setIsEditing] = createSignal(false);
  const [isCreating, setIsCreating] = createSignal(false);

  const handleCreateNew = () => {
    const newProfile: ConversionProfile = {
      ...DEFAULT_PROFILE,
      id: `profile-${Date.now()}`,
      name: 'New Profile',
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSelectedProfile(newProfile);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleSave = (profile: ConversionProfile) => {
    props.onUpdate(profile);
    setSelectedProfile(null);
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSelectedProfile(null);
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleEdit = (profile: ConversionProfile) => {
    // Create a copy to avoid reference issues
    setSelectedProfile({ ...profile });
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleDelete = (profileId: string) => {
    if (confirm('Are you sure you want to delete this profile?')) {
      props.onDelete(profileId);
      if (selectedProfile()?.id === profileId) {
        setSelectedProfile(null);
      }
    }
  };

  const handleSetDefault = (profile: ConversionProfile) => {
    // Set this profile as default
    const updatedProfile = { ...profile, isDefault: true };
    props.onUpdate(updatedProfile);

    // Remove default from other profiles
    props.profiles.forEach(p => {
      if (p.id !== profile.id && p.isDefault) {
        props.onUpdate({ ...p, isDefault: false });
      }
    });
  };

  return (
    <div class="h-full ">
      <Show when={!isEditing()}>
        {/* Cards View */}
        <div class="space-y-6 animate-fadeIn p-6">
          {/* Header */}
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Conversion Profiles</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage your markdown conversion profiles for different use cases
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              variant="primary"
              class="gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Profile
            </Button>
          </div>

          {/* Profile Cards Grid */}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <For each={props.profiles}>
              {(profile) => (
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 group profile-card-hover flex flex-col h-full">
                  {/* Card Header */}
                  <div class="p-5 flex-1 flex flex-col">
                    <div class="flex justify-between items-start mb-3">
                      <div class="flex-1 min-w-0">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {profile.name}
                        </h3>
                        <div class="flex items-center gap-2 mt-1">
                          <Show when={profile.isDefault}>
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-800/20 dark:text-primary-300">
                              Default
                            </span>
                          </Show>
                          <Show when={profile.matchRules?.enabled}>
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300">
                              Auto
                            </span>
                          </Show>
                        </div>
                      </div>
                      <div class="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(profile)}
                          class="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          title="Edit profile"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <Show when={!profile.isDefault}>
                          <button
                            onClick={() => handleDelete(profile.id)}
                            class="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete profile"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </Show>
                      </div>
                    </div>

                    {/* Profile Details */}
                    <div class="space-y-3 flex-1 flex flex-col">
                      {/* Markdown Flavor */}
                      <div>
                        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Markdown Flavor</p>
                        <p class="text-sm text-gray-700 dark:text-gray-300">{profile.markdownFlavor}</p>
                      </div>

                      {/* Key Settings */}
                      <div>
                        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Key Settings</p>
                        <div class="flex flex-wrap gap-1">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {profile.conversionOptions.headingStyle}
                          </span>
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {profile.conversionOptions.codeBlockStyle}
                          </span>
                          <Show when={profile.outputFormat.addMetadata}>
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              metadata
                            </span>
                          </Show>
                          <Show when={profile.outputFormat.addTableOfContents}>
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              TOC
                            </span>
                          </Show>
                        </div>
                      </div>

                      {/* Match Rules */}
                      <Show when={profile.matchRules?.enabled && profile.matchRules.rules.length > 0}>
                        <div>
                          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Auto-Selection Rules</p>
                          <p class="text-xs text-gray-600 dark:text-gray-400">
                            {profile.matchRules.rules.length} rule{profile.matchRules.rules.length !== 1 ? 's' : ''} configured
                          </p>
                        </div>
                      </Show>

                      {/* Timestamps */}
                      <div class="pt-3 mt-auto border-t border-gray-100 dark:border-gray-700">
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          Created {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 h-4">
                          <Show when={profile.updatedAt !== profile.createdAt}>
                            Updated {new Date(profile.updatedAt).toLocaleDateString()}
                          </Show>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div class="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
                    <Show when={!profile.isDefault}>
                      <button
                        onClick={() => handleSetDefault(profile)}
                        class="text-xs font-medium text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                      >
                        Set as Default
                      </button>
                    </Show>
                    <Show when={profile.isDefault}>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        This is your default profile
                      </span>
                    </Show>
                  </div>
                </div>
              )}
            </For>

            {/* Empty State */}
            <Show when={props.profiles.length === 0}>
              <div class="col-span-full">
                <div class="text-center py-12">
                  <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No profiles yet</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Create your first profile to start customizing markdown conversion
                  </p>
                  <Button
                    onClick={handleCreateNew}
                    variant="primary"
                  >
                    Create First Profile
                  </Button>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={isEditing()}>
        {/* Editor View - replaces the cards list */}
        <div class="animate-slideInRight">
          <ProfileEditor
            profile={selectedProfile()!}
            isNew={isCreating()}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </Show>
    </div>
  );
};
