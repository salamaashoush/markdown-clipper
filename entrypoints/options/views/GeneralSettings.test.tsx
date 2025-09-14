/**
 * Tests for GeneralSettings UI component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { GeneralSettings } from './GeneralSettings';
import { DEFAULT_PREFERENCES } from '~/types/preferences';
import { NamingPattern, Theme } from '~/types/storage';

describe('GeneralSettings Component', () => {
  let mockOnUpdate: ReturnType<typeof vi.fn>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    cleanup();
    mockOnUpdate = vi.fn();
    user = userEvent.setup();
  });

  describe('Rendering', () => {
    it('should render all preference fields', () => {
      render(() => (
        <GeneralSettings
          preferences={DEFAULT_PREFERENCES}
          onUpdate={mockOnUpdate}
        />
      ));

      // Check all sections are rendered
      expect(screen.getByText('Basic Settings')).toBeDefined();
      expect(screen.getByText('Appearance')).toBeDefined();
      expect(screen.getByText('Keyboard Shortcuts')).toBeDefined();

      // Check all form fields are present
      expect(screen.getByLabelText(/Default Conversion Profile/i)).toBeDefined();
      expect(screen.getByLabelText(/Auto-download markdown files/i)).toBeDefined();
      expect(screen.getByLabelText(/File Naming Pattern/i)).toBeDefined();
      expect(screen.getByLabelText(/Show notifications/i)).toBeDefined();
      expect(screen.getByLabelText(/Theme/i)).toBeDefined();
    });

    it('should display current preference values', () => {
      const customPreferences = {
        ...DEFAULT_PREFERENCES,
        defaultProfile: 'custom-profile',
        autoDownload: true,
        fileNamingPattern: NamingPattern.TIMESTAMP,
        showNotifications: false,
        theme: Theme.DARK,
      };

      render(() => (
        <GeneralSettings
          preferences={customPreferences}
          onUpdate={mockOnUpdate}
        />
      ));

      // Check values are displayed correctly
      const profileSelect = screen.getByLabelText(/Default Conversion Profile/i) as HTMLSelectElement;
      expect(profileSelect.value).toBe('custom-profile');

      const autoDownloadCheckbox = screen.getByLabelText(/Auto-download markdown files/i) as HTMLInputElement;
      expect(autoDownloadCheckbox.checked).toBe(true);

      const namingSelect = screen.getByLabelText(/File Naming Pattern/i) as HTMLSelectElement;
      expect(namingSelect.value).toBe(NamingPattern.TIMESTAMP);

      const notificationsCheckbox = screen.getByLabelText(/Show notifications/i) as HTMLInputElement;
      expect(notificationsCheckbox.checked).toBe(false);

      const themeSelect = screen.getByLabelText(/Theme/i) as HTMLSelectElement;
      expect(themeSelect.value).toBe(Theme.DARK);
    });
  });

  describe('User Interactions', () => {
    it('should call onUpdate when default profile is changed', async () => {
      render(() => (
        <GeneralSettings
          preferences={DEFAULT_PREFERENCES}
          onUpdate={mockOnUpdate}
        />
      ));

      const profileSelect = screen.getByLabelText(/Default Conversion Profile/i) as HTMLSelectElement;

      fireEvent.change(profileSelect, { target: { value: 'default' } });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        defaultProfile: 'default',
      });
    });

    it('should call onUpdate when auto-download is toggled', async () => {
      render(() => (
        <GeneralSettings
          preferences={DEFAULT_PREFERENCES}
          onUpdate={mockOnUpdate}
        />
      ));

      const checkbox = screen.getByLabelText(/Auto-download markdown files/i) as HTMLInputElement;

      await user.click(checkbox);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        autoDownload: true,
      });
    });

    it('should call onUpdate when file naming pattern is changed', async () => {
      render(() => (
        <GeneralSettings
          preferences={DEFAULT_PREFERENCES}
          onUpdate={mockOnUpdate}
        />
      ));

      const select = screen.getByLabelText(/File Naming Pattern/i) as HTMLSelectElement;

      fireEvent.change(select, { target: { value: NamingPattern.DOMAIN_TITLE } });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        fileNamingPattern: NamingPattern.DOMAIN_TITLE,
      });
    });

    it('should call onUpdate when notifications are toggled', async () => {
      render(() => (
        <GeneralSettings
          preferences={DEFAULT_PREFERENCES}
          onUpdate={mockOnUpdate}
        />
      ));

      const checkbox = screen.getByLabelText(/Show notifications/i) as HTMLInputElement;

      await user.click(checkbox);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        showNotifications: false,
      });
    });

    it('should call onUpdate and setTheme when theme is changed', async () => {
      render(() => (
        <GeneralSettings
          preferences={DEFAULT_PREFERENCES}
          onUpdate={mockOnUpdate}
        />
      ));

      const select = screen.getByLabelText(/Theme/i) as HTMLSelectElement;

      fireEvent.change(select, { target: { value: Theme.DARK } });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        theme: Theme.DARK,
      });
    });
  });

  describe('All Naming Pattern Options', () => {
    it('should have all naming pattern options available', () => {
      render(() => (
        <GeneralSettings
          preferences={DEFAULT_PREFERENCES}
          onUpdate={mockOnUpdate}
        />
      ));

      const select = screen.getByLabelText(/File Naming Pattern/i) as HTMLSelectElement;
      const options = Array.from(select.options).map(opt => opt.value);

      expect(options).toContain(NamingPattern.TAB_TITLE);
      expect(options).toContain(NamingPattern.DOMAIN_TITLE);
      expect(options).toContain(NamingPattern.TIMESTAMP);
      expect(options).toContain(NamingPattern.CUSTOM_PREFIX);
    });
  });

  describe('All Theme Options', () => {
    it('should have all theme options available', () => {
      render(() => (
        <GeneralSettings
          preferences={DEFAULT_PREFERENCES}
          onUpdate={mockOnUpdate}
        />
      ));

      const select = screen.getByLabelText(/Theme/i) as HTMLSelectElement;
      const options = Array.from(select.options).map(opt => opt.value);

      expect(options).toContain(Theme.SYSTEM);
      expect(options).toContain(Theme.LIGHT);
      expect(options).toContain(Theme.DARK);
    });
  });

  describe('Keyboard Shortcuts Display', () => {
    it('should display default keyboard shortcuts', () => {
      render(() => (
        <GeneralSettings
          preferences={DEFAULT_PREFERENCES}
          onUpdate={mockOnUpdate}
        />
      ));

      expect(screen.getByText('Ctrl+Shift+C')).toBeDefined();
      expect(screen.getByText('Ctrl+Shift+M')).toBeDefined();
    });

    it('should display custom keyboard shortcuts when provided', () => {
      const customPreferences = {
        ...DEFAULT_PREFERENCES,
        shortcuts: {
          convertPage: 'Alt+C',
          openPopup: 'Alt+M',
          openOptions: 'Alt+O',
        },
      };

      render(() => (
        <GeneralSettings
          preferences={customPreferences}
          onUpdate={mockOnUpdate}
        />
      ));

      expect(screen.getByText('Alt+C')).toBeDefined();
      expect(screen.getByText('Alt+M')).toBeDefined();
    });
  });

  describe('State Management', () => {
    it('should update local state when preferences change', () => {
      const { rerender } = render(() => (
        <GeneralSettings
          preferences={DEFAULT_PREFERENCES}
          onUpdate={mockOnUpdate}
        />
      ));

      const updatedPreferences = {
        ...DEFAULT_PREFERENCES,
        autoDownload: true,
        theme: Theme.DARK,
      };

      rerender(() => (
        <GeneralSettings
          preferences={updatedPreferences}
          onUpdate={mockOnUpdate}
        />
      ));

      const autoDownloadCheckbox = screen.getByLabelText(/Auto-download markdown files/i) as HTMLInputElement;
      expect(autoDownloadCheckbox.checked).toBe(true);

      const themeSelect = screen.getByLabelText(/Theme/i) as HTMLSelectElement;
      expect(themeSelect.value).toBe(Theme.DARK);
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form controls', () => {
      render(() => (
        <GeneralSettings
          preferences={DEFAULT_PREFERENCES}
          onUpdate={mockOnUpdate}
        />
      ));

      // All form controls should have associated labels
      const selects = screen.getAllByRole('combobox');
      const checkboxes = screen.getAllByRole('checkbox');

      selects.forEach(select => {
        expect((select as HTMLElement).getAttribute('aria-label') ||
               (select as HTMLElement).parentElement?.querySelector('label')).toBeDefined();
      });

      checkboxes.forEach(checkbox => {
        expect((checkbox as HTMLElement).getAttribute('aria-label') ||
               (checkbox as HTMLElement).parentElement?.querySelector('label')).toBeDefined();
      });
    });

    it('should have descriptive text for settings', () => {
      render(() => (
        <GeneralSettings
          preferences={DEFAULT_PREFERENCES}
          onUpdate={mockOnUpdate}
        />
      ));

      // Check for helper text
      expect(screen.getByText(/Automatically download files after conversion/i)).toBeDefined();
      expect(screen.getByText(/Display success\/error notifications/i)).toBeDefined();
      expect(screen.getByText(/Keyboard shortcuts can be customized/i)).toBeDefined();
    });
  });
});
