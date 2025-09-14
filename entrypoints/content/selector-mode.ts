/**
 * CSS Selector Mode - Visual element selection for targeted conversion
 */

export interface SelectorModeOptions {
  highlightColor?: string;
  outlineWidth?: number;
  showTooltip?: boolean;
  multiSelect?: boolean;
  autoSuggest?: boolean;
}

export class SelectorMode {
  private isActive = false;
  private selectedElements: Set<Element> = new Set();
  private hoveredElement: Element | null = null;
  private overlay: HTMLDivElement | null = null;
  private tooltip: HTMLDivElement | null = null;
  private readonly options: Required<SelectorModeOptions>;
  private readonly originalStyles = new Map<Element, string>();
  private eventListeners: Array<{ element: Element; type: string; handler: EventListener }> = [];

  constructor(options: SelectorModeOptions = {}) {
    this.options = {
      highlightColor: '#3b82f6',
      outlineWidth: 2,
      showTooltip: true,
      multiSelect: true,
      autoSuggest: true,
      ...options,
    };
  }

  /**
   * Activate selector mode
   */
  public activate(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.createOverlay();
    this.attachEventListeners();
    this.injectStyles();

    // Show instructions
    this.showInstructions();
  }

  /**
   * Deactivate selector mode
   */
  public deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.removeOverlay();
    this.detachEventListeners();
    this.removeStyles();
    this.clearSelection();
  }

  /**
   * Get selected elements
   */
  public getSelectedElements(): Element[] {
    return Array.from(this.selectedElements);
  }

  /**
   * Get CSS selector for selected elements
   */
  public getSelector(): string {
    if (this.selectedElements.size === 0) return '';

    const selectors = Array.from(this.selectedElements).map(el =>
      this.generateSelector(el)
    );

    // Find common selector if multiple elements
    if (selectors.length > 1) {
      const commonSelector = this.findCommonSelector(Array.from(this.selectedElements));
      if (commonSelector) {
        return commonSelector;
      }
    }

    return selectors.join(', ');
  }

  /**
   * Create overlay UI
   */
  private createOverlay(): void {
    // Create main overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'copy-markdown-selector-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999999;
      pointer-events: none;
    `;

    // Create tooltip
    if (this.options.showTooltip) {
      this.tooltip = document.createElement('div');
      this.tooltip.id = 'copy-markdown-selector-tooltip';
      this.tooltip.style.cssText = `
        position: fixed;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
        z-index: 999999;
        pointer-events: none;
        display: none;
        max-width: 300px;
        word-break: break-all;
      `;
      document.body.appendChild(this.tooltip);
    }

    document.body.appendChild(this.overlay);
  }

  /**
   * Remove overlay UI
   */
  private removeOverlay(): void {
    this.overlay?.remove();
    this.overlay = null;
    this.tooltip?.remove();
    this.tooltip = null;
  }

  /**
   * Show instructions
   */
  private showInstructions(): void {
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 999999;
      text-align: center;
      line-height: 1.5;
    `;

    instructions.innerHTML = `
      <strong>Selection Mode Active</strong><br>
      Click to select elements • ${this.options.multiSelect ? 'Shift+Click for multiple' : ''}<br>
      Press ESC to cancel • Press Enter to confirm
    `;

    document.body.appendChild(instructions);

    // Auto-remove after 3 seconds
    setTimeout(() => instructions.remove(), 3000);
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Prevent default page interactions
    const preventHandler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Mouse move handler
    const mouseMoveHandler = (e: MouseEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target && target !== this.hoveredElement) {
        this.unhighlightElement(this.hoveredElement);
        this.highlightElement(target);
        this.hoveredElement = target;
        this.updateTooltip(target, e.clientX, e.clientY);
      }
    };

    // Click handler
    const clickHandler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target) {
        if (this.options.multiSelect && e.shiftKey) {
          // Multi-select mode
          if (this.selectedElements.has(target)) {
            this.deselectElement(target);
          } else {
            this.selectElement(target);
          }
        } else if (!this.options.multiSelect || !e.shiftKey) {
          // Single select or replace selection
          this.clearSelection();
          this.selectElement(target);
        }

        // Auto-suggest similar elements
        if (this.options.autoSuggest && this.selectedElements.size === 1) {
          this.suggestSimilarElements(target);
        }
      }
    };

    // Keyboard handler
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.deactivate();
        window.postMessage({ type: 'SELECTOR_MODE_CANCELLED' }, '*');
      } else if (e.key === 'Enter') {
        const selector = this.getSelector();
        const elements = this.getSelectedElements();
        this.deactivate();
        window.postMessage({
          type: 'SELECTOR_MODE_CONFIRMED',
          selector,
          elementCount: elements.length
        }, '*');
      }
    };

    // Add listeners
    document.addEventListener('mousemove', mouseMoveHandler, true);
    document.addEventListener('click', clickHandler, true);
    document.addEventListener('keydown', keyHandler, true);
    document.addEventListener('contextmenu', preventHandler, true);

    // Store for cleanup
    this.eventListeners = [
      { element: document, type: 'mousemove', handler: mouseMoveHandler },
      { element: document, type: 'click', handler: clickHandler },
      { element: document, type: 'keydown', handler: keyHandler },
      { element: document, type: 'contextmenu', handler: preventHandler },
    ];
  }

  /**
   * Detach event listeners
   */
  private detachEventListeners(): void {
    this.eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler, true);
    });
    this.eventListeners = [];
  }

  /**
   * Highlight element on hover
   */
  private highlightElement(element: Element | null): void {
    if (!element) return;

    const htmlElement = element as HTMLElement;
    this.originalStyles.set(element, htmlElement.style.outline);
    htmlElement.style.outline = `${this.options.outlineWidth}px solid ${this.options.highlightColor}`;
    htmlElement.style.outlineOffset = '2px';
  }

  /**
   * Remove highlight from element
   */
  private unhighlightElement(element: Element | null): void {
    if (!element) return;

    const htmlElement = element as HTMLElement;
    const originalStyle = this.originalStyles.get(element);
    if (originalStyle !== undefined) {
      htmlElement.style.outline = originalStyle;
      this.originalStyles.delete(element);
    }
  }

  /**
   * Select an element
   */
  private selectElement(element: Element): void {
    this.selectedElements.add(element);
    const htmlElement = element as HTMLElement;
    htmlElement.style.backgroundColor = `${this.options.highlightColor}33`;
    htmlElement.dataset.copyMarkdownSelected = 'true';
  }

  /**
   * Deselect an element
   */
  private deselectElement(element: Element): void {
    this.selectedElements.delete(element);
    const htmlElement = element as HTMLElement;
    htmlElement.style.backgroundColor = '';
    delete htmlElement.dataset.copyMarkdownSelected;
  }

  /**
   * Clear all selections
   */
  private clearSelection(): void {
    this.selectedElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.backgroundColor = '';
      delete htmlElement.dataset.copyMarkdownSelected;
    });
    this.selectedElements.clear();
  }

  /**
   * Update tooltip position and content
   */
  private updateTooltip(element: Element, x: number, y: number): void {
    if (!this.tooltip) return;

    const selector = this.generateSelector(element);
    const tagName = element.tagName.toLowerCase();
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const id = element.id ? `#${element.id}` : '';

    this.tooltip.innerHTML = `
      <strong>${tagName}${id}${className}</strong><br>
      ${selector}
    `;

    this.tooltip.style.display = 'block';
    this.tooltip.style.left = `${x + 10}px`;
    this.tooltip.style.top = `${y + 10}px`;

    // Adjust position if tooltip goes off-screen
    const rect = this.tooltip.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.tooltip.style.left = `${x - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
      this.tooltip.style.top = `${y - rect.height - 10}px`;
    }
  }

  /**
   * Generate CSS selector for element
   */
  private generateSelector(element: Element): string {
    const path: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      // Add ID if present
      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break; // ID is unique, no need to go further
      }

      // Add classes
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/)
          .filter(c => c && !c.startsWith('copy-markdown'));
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`;
        }
      }

      // Add nth-child if needed
      if (current.parentElement) {
        const siblings = Array.from(current.parentElement.children);
        const index = siblings.indexOf(current) + 1;
        if (siblings.length > 1) {
          selector += `:nth-child(${index})`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * Find common selector for multiple elements
   */
  private findCommonSelector(elements: Element[]): string | null {
    if (elements.length === 0) return null;

    // Check if all elements have the same class
    const firstClasses = elements[0].className.split(' ').filter(c => c);
    const commonClasses = firstClasses.filter(className =>
      elements.every(el => el.classList.contains(className))
    );

    if (commonClasses.length > 0) {
      return `.${commonClasses[0]}`;
    }

    // Check if all elements have the same tag
    const firstTag = elements[0].tagName;
    if (elements.every(el => el.tagName === firstTag)) {
      // Check if they're all in the same parent
      const firstParent = elements[0].parentElement;
      if (firstParent && elements.every(el => el.parentElement === firstParent)) {
        const parentSelector = this.generateSelector(firstParent);
        return `${parentSelector} > ${firstTag.toLowerCase()}`;
      }
      return firstTag.toLowerCase();
    }

    return null;
  }

  /**
   * Suggest similar elements
   */
  private suggestSimilarElements(element: Element): void {
    const selector = this.generateSelector(element);

    // Try to find similar elements
    const tagName = element.tagName;
    const className = element.className;

    if (className) {
      // Find elements with same class
      const similar = document.querySelectorAll(`.${className.split(' ')[0]}`);
      if (similar.length > 1 && similar.length < 20) {
        this.showSuggestion(`Found ${similar.length} similar elements. Shift+Click to select all.`);
      }
    }
  }

  /**
   * Show suggestion message
   */
  private showSuggestion(message: string): void {
    const suggestion = document.createElement('div');
    suggestion.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(59, 130, 246, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 999999;
    `;
    suggestion.textContent = message;
    document.body.appendChild(suggestion);

    setTimeout(() => suggestion.remove(), 3000);
  }

  /**
   * Inject required styles
   */
  private injectStyles(): void {
    const style = document.createElement('style');
    style.id = 'copy-markdown-selector-styles';
    style.textContent = `
      * {
        cursor: crosshair !important;
      }
      [data-copy-markdown-selected] {
        position: relative;
      }
      [data-copy-markdown-selected]::after {
        content: '✓';
        position: absolute;
        top: 0;
        right: 0;
        background: ${this.options.highlightColor};
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        z-index: 999998;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Remove injected styles
   */
  private removeStyles(): void {
    document.getElementById('copy-markdown-selector-styles')?.remove();
  }
}

// Export singleton instance
export const selectorMode = new SelectorMode();