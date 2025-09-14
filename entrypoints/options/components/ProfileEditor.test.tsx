/**
 * Tests for ProfileEditor UI component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { ProfileEditor } from './ProfileEditor';
import { DEFAULT_PROFILE, MarkdownFlavor } from '~/types/storage';
import type { ConversionProfile } from '~/types/storage';

describe('ProfileEditor Component', () => {
  let mockOnSave: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;
  let testProfile: ConversionProfile;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    cleanup();
    mockOnSave = vi.fn();
    mockOnCancel = vi.fn();
    user = userEvent.setup();

    testProfile = {
      ...DEFAULT_PROFILE,
      id: 'test-profile',
      name: 'Test Profile',
    };
  });

  describe('Rendering', () => {
    it('should render all profile sections', () => {
      render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      // Check all sections are rendered
      expect(screen.getByText('Basic Information')).toBeDefined();
      expect(screen.getByText('Conversion Options')).toBeDefined();
      expect(screen.getByText('Content Filters')).toBeDefined();
      expect(screen.getByText('Output Format')).toBeDefined();
      expect(screen.getByText('URL & Link Handling')).toBeDefined();
    });

    it('should display correct title for new vs editing', () => {
      const { rerender } = render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={true}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      expect(screen.getByText('Create New Profile')).toBeDefined();

      rerender(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      expect(screen.getByText('Edit Profile')).toBeDefined();
    });

    it('should disable name field for default profile', () => {
      const defaultProfile = {
        ...DEFAULT_PROFILE,
        id: 'default',
      };

      render(() => (
        <ProfileEditor
          profile={defaultProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const nameInput = screen.getByLabelText(/Profile Name/i) as HTMLInputElement;
      expect(nameInput.disabled).toBe(true);
    });
  });

  describe('Basic Information Settings', () => {
    it('should update profile name', async () => {
      render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const nameInput = screen.getByLabelText(/Profile Name/i) as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Profile Name');

      const saveButton = screen.getByText('Save Profile');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Profile Name',
        })
      );
    });

    it('should have all markdown flavor options', () => {
      render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const flavorSelect = screen.getByLabelText(/Markdown Flavor/i) as HTMLSelectElement;
      const options = Array.from(flavorSelect.options).map(opt => opt.value);

      expect(options).toContain(MarkdownFlavor.COMMONMARK);
      expect(options).toContain(MarkdownFlavor.GITHUB);
      expect(options).toContain(MarkdownFlavor.GITLAB);
      expect(options).toContain(MarkdownFlavor.REDDIT);
      expect(options).toContain(MarkdownFlavor.DISCORD);
    });
  });

  describe('Conversion Options', () => {
    it('should update heading style', async () => {
      render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const headingSelect = screen.getByLabelText(/Heading Style/i) as HTMLSelectElement;
      fireEvent.change(headingSelect, { target: { value: 'setext' } });

      const saveButton = screen.getByText('Save Profile');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          conversionOptions: expect.objectContaining({
            headingStyle: 'setext',
          }),
        })
      );
    });

    it('should update bullet list marker', async () => {
      render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const bulletSelect = screen.getByLabelText(/Bullet List Marker/i) as HTMLSelectElement;
      fireEvent.change(bulletSelect, { target: { value: '*' } });

      const saveButton = screen.getByText('Save Profile');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          conversionOptions: expect.objectContaining({
            bulletListMarker: '*',
          }),
        })
      );
    });

    it('should update code block style', async () => {
      render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const codeBlockSelect = screen.getByLabelText(/Code Block Style/i) as HTMLSelectElement;
      fireEvent.change(codeBlockSelect, { target: { value: 'indented' } });

      const saveButton = screen.getByText('Save Profile');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          conversionOptions: expect.objectContaining({
            codeBlockStyle: 'indented',
          }),
        })
      );
    });

    it('should update emphasis and strong delimiters', async () => {
      render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const emphasisSelect = screen.getByLabelText(/Emphasis Delimiter/i) as HTMLSelectElement;
      fireEvent.change(emphasisSelect, { target: { value: '_' } });

      const strongSelect = screen.getByLabelText(/Strong Delimiter/i) as HTMLSelectElement;
      fireEvent.change(strongSelect, { target: { value: '__' } });

      const saveButton = screen.getByText('Save Profile');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          conversionOptions: expect.objectContaining({
            emDelimiter: '_',
            strongDelimiter: '__',
          }),
        })
      );
    });
  });

  describe('Content Filters', () => {
    it('should update exclude CSS selectors', async () => {
      render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const excludeInput = screen.getByPlaceholderText(/e.g., .ads, .sidebar, #footer/i) as HTMLInputElement;
      await user.clear(excludeInput);
      await user.type(excludeInput, '.ads, .navigation, #cookie-banner');

      const saveButton = screen.getByText('Save Profile');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          contentFilters: expect.objectContaining({
            excludeCss: ['.ads', '.navigation', '#cookie-banner'],
          }),
        })
      );
    });

    it('should toggle content filter checkboxes', async () => {
      render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const includeHidden = screen.getByLabelText(/Include hidden elements/i) as HTMLInputElement;
      const includeIframes = screen.getByLabelText(/Include iframes/i) as HTMLInputElement;
      const includeScripts = screen.getByLabelText(/Include scripts/i) as HTMLInputElement;
      const includeComments = screen.getByLabelText(/Include comments/i) as HTMLInputElement;

      await user.click(includeHidden);
      await user.click(includeIframes);
      await user.click(includeScripts);
      await user.click(includeComments);

      const saveButton = screen.getByText('Save Profile');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          contentFilters: expect.objectContaining({
            includeHidden: true,
            includeIframes: true,
            includeScripts: true,
            includeComments: true,
          }),
        })
      );
    });
  });

  describe('Output Format', () => {
    it('should toggle output format options', async () => {
      render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const addMetadata = screen.getByLabelText(/Add metadata frontmatter/i) as HTMLInputElement;
      const addToc = screen.getByLabelText(/Add table of contents/i) as HTMLInputElement;
      const addFootnotes = screen.getByLabelText(/Add footnotes/i) as HTMLInputElement;
      const preserveNewlines = screen.getByLabelText(/Preserve newlines/i) as HTMLInputElement;

      await user.click(addMetadata);
      await user.click(addToc);
      await user.click(addFootnotes);
      await user.click(preserveNewlines);

      const saveButton = screen.getByText('Save Profile');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          outputFormat: expect.objectContaining({
            addMetadata: false,
            addTableOfContents: true,
            addFootnotes: false,
            preserveNewlines: true,
          }),
        })
      );
    });
  });

  describe('URL & Link Handling', () => {
    it('should toggle URL handling options', async () => {
      render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const convertRelative = screen.getByLabelText(/Convert relative URLs to absolute/i) as HTMLInputElement;
      const removeTracking = screen.getByLabelText(/Remove tracking parameters/i) as HTMLInputElement;

      await user.click(convertRelative);
      await user.click(removeTracking);

      const saveButton = screen.getByText('Save Profile');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          linkHandling: expect.objectContaining({
            convertRelativeUrls: false,
            removeTrackingParams: false,
          }),
        })
      );
    });
  });

  describe('Save and Cancel Actions', () => {
    it('should call onSave with updated profile and timestamp', async () => {
      render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const nameInput = screen.getByLabelText(/Profile Name/i) as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, 'Modified Name');

      const saveButton = screen.getByText('Save Profile');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Modified Name',
          updatedAt: expect.any(Number),
        })
      );
    });

    it('should call onCancel when cancel button is clicked', async () => {
      render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Complex Settings Updates', () => {
    it('should handle multiple nested updates correctly', async () => {
      render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      // Update multiple settings across different sections
      const nameInput = screen.getByLabelText(/Profile Name/i) as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, 'Complex Profile');

      const flavorSelect = screen.getByLabelText(/Markdown Flavor/i) as HTMLSelectElement;
      fireEvent.change(flavorSelect, { target: { value: MarkdownFlavor.GITHUB } });

      const bulletSelect = screen.getByLabelText(/Bullet List Marker/i) as HTMLSelectElement;
      fireEvent.change(bulletSelect, { target: { value: '+' } });

      const includeHidden = screen.getByLabelText(/Include hidden elements/i) as HTMLInputElement;
      await user.click(includeHidden);

      const addToc = screen.getByLabelText(/Add table of contents/i) as HTMLInputElement;
      await user.click(addToc);

      const removeTracking = screen.getByLabelText(/Remove tracking parameters/i) as HTMLInputElement;
      await user.click(removeTracking);

      const saveButton = screen.getByText('Save Profile');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Complex Profile',
          markdownFlavor: MarkdownFlavor.GITHUB,
          conversionOptions: expect.objectContaining({
            bulletListMarker: '+',
          }),
          contentFilters: expect.objectContaining({
            includeHidden: true,
          }),
          outputFormat: expect.objectContaining({
            addTableOfContents: true,
          }),
          linkHandling: expect.objectContaining({
            removeTrackingParams: false,
          }),
        })
      );
    });
  });

  describe('Profile Updates on Props Change', () => {
    it('should update form when profile prop changes', () => {
      const { rerender } = render(() => (
        <ProfileEditor
          profile={testProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const updatedProfile = {
        ...testProfile,
        name: 'Updated Profile',
        markdownFlavor: MarkdownFlavor.REDDIT,
      };

      rerender(() => (
        <ProfileEditor
          profile={updatedProfile}
          isNew={false}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      ));

      const nameInput = screen.getByLabelText(/Profile Name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Updated Profile');

      const flavorSelect = screen.getByLabelText(/Markdown Flavor/i) as HTMLSelectElement;
      expect(flavorSelect.value).toBe(MarkdownFlavor.REDDIT);
    });
  });
});
