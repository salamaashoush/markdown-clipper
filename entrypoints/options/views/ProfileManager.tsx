import { Component, createSignal, Show, For, onMount, createEffect } from 'solid-js';
import type { ConversionProfile } from '~/types/storage';
import { ProfileEditor } from '../components/ProfileEditor';
import { DEFAULT_PROFILE } from '~/types/storage';

interface ProfileManagerProps {
  profiles: ConversionProfile[];
  onUpdate: (profile: ConversionProfile) => void;
  onDelete: (profileId: string) => void;
}

export const ProfileManager: Component<ProfileManagerProps> = (props) => {
  const [selectedProfile, setSelectedProfile] = createSignal<ConversionProfile | null>(null);
  const [isCreating, setIsCreating] = createSignal(false);

  // Select default profile on mount
  onMount(() => {
    const defaultProfile = props.profiles.find(p => p.isDefault || p.id === 'default');
    if (defaultProfile) {
      setSelectedProfile(defaultProfile);
    }
  });

  // Update selected profile when it changes in props
  createEffect(() => {
    const current = selectedProfile();
    if (current && !isCreating()) {
      const updated = props.profiles.find(p => p.id === current.id);
      if (updated) {
        setSelectedProfile(updated);
      }
    }
  });

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
  };

  const handleSave = (profile: ConversionProfile) => {
    props.onUpdate(profile);
    setSelectedProfile(null);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setSelectedProfile(null);
    setIsCreating(false);
  };

  const handleEdit = (profile: ConversionProfile) => {
    setSelectedProfile(profile);
    setIsCreating(false);
  };

  const handleDelete = (profileId: string) => {
    if (confirm('Are you sure you want to delete this profile?')) {
      props.onDelete(profileId);
      if (selectedProfile()?.id === profileId) {
        setSelectedProfile(null);
      }
    }
  };

  return (
    <div class="flex gap-6">
      {/* Profile List */}
      <div class="w-1/3">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Profiles</h3>
          <button
            onClick={handleCreateNew}
            class="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
          >
            New Profile
          </button>
        </div>

        <div class="space-y-2">
          <For each={props.profiles}>
            {(profile) => (
              <div
                class={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedProfile()?.id === profile.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleEdit(profile)}
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-gray-100">{profile.name}</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {profile.isDefault ? 'Default profile' : `Created ${new Date(profile.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Show when={!profile.isDefault}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(profile.id);
                      }}
                      class="text-red-600 hover:text-red-800"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Profile Editor */}
      <div class="flex-1">
        <Show when={selectedProfile()}>
          <ProfileEditor
            profile={selectedProfile()!}
            isNew={isCreating()}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </Show>

        <Show when={!selectedProfile()}>
          <div class="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            Select a profile to edit or create a new one
          </div>
        </Show>
      </div>
    </div>
  );
};