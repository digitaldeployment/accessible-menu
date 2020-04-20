import Menu from "./menu";
import { preventEvent } from "./eventHandlers";
import { isHTMLElement, isMenu, isCSSSelector } from "./validate";

/**
 * A link or button that controls the visibility of a menu.
 */
class MenuToggle {
  /**
   * {@inheritdoc}
   *
   * @param {object}      param0                      - The menu toggle object.
   * @param {HTMLElement} param0.menuToggleElement    - The toggle element in the DOM.
   * @param {HTMLElement} param0.parentElement        - The element containing the menu.
   * @param {Menu}        param0.menu                 - The menu controlled by the this toggle.
   * @param {string}      [param0.openClass = "show"] - The class to use when a submenu is open.
   * @param {Menu|null}   [param0.parentMenu = null]  - The menu containing the toggle.
   */
  constructor({
    menuToggleElement,
    parentElement,
    menu,
    openClass = "show",
    parentMenu = null
  }) {
    // Run validations.
    isHTMLElement({ menuToggleElement, parentElement });
    parentMenu !== null ? isMenu({ menu, parentMenu }) : isMenu({ menu });
    isCSSSelector({ openClass });

    this.domElements = {
      toggle: menuToggleElement,
      parent: parentElement
    };
    this.elements = {
      menu: menu,
      parentMenu: parentMenu
    };
    this.openClass = openClass;
    this.show = false;

    this.initialize();
  }

  /**
   * Initialize the toggle by ensuring WAI-ARIA values are set,
   * handling click events, and adding new keydown events.
   */
  initialize() {
    // Add WAI-ARIA properties.
    this.element.setAttribute("aria-haspopup", "true");
    this.element.setAttribute("aria-expanded", "false");
    this.element.setAttribute("role", "button");

    // Ensure both toggle and menu have IDs.
    if (this.element.id === "" || this.menu.element.id === "") {
      const randomString = Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, "")
        .substr(0, 10);

      const id = `${this.element.innerText
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s/g, "-")}-${randomString}`;

      this.element.id = this.element.id || `${id}-menu-button`;
      this.menu.element.id = this.menu.element.id || `${id}-menu`;
    }

    // Set up proper aria label and control.
    this.menu.element.setAttribute("aria-labelledby", this.element.id);
    this.element.setAttribute("aria-controls", this.menu.element.id);

    // Add new events.
    this.handleClick();
  }

  /**
   * The toggle element in the DOM.
   *
   * @returns {HTMLElement} - The toggle element.
   */
  get element() {
    return this.domElements.toggle;
  }

  /**
   * The toggle's parent DOM element.
   *
   * @returns {HTMLElement} - The parent element.
   */
  get parentElement() {
    return this.domElements.parent;
  }

  /**
   * The menu controlled by the toggle.
   *
   * @returns {Menu} - The menu element.
   */
  get menu() {
    return this.elements.menu;
  }

  /**
   * The menu containing the toggle.
   *
   * @returns {Menu} - The menu element.
   */
  get parentMenu() {
    return this.elements.parentMenu;
  }

  /**
   * The open state on the menu.
   *
   * @returns {boolean} - The open state.
   */
  get isOpen() {
    return this.show;
  }

  /**
   * Set the open state on the menu.
   *
   * @param {boolean} value - The open state.
   */
  set isOpen(value) {
    isBoolean(value);

    this.show = value;
  }

  /**
   * Expands the submenu.
   */
  expand() {
    // Assign new WAI-ARIA/class values.
    this.element.setAttribute("aria-expanded", "true");
    this.parentElement.classList.add(this.openClass);
    this.menu.element.classList.add(this.openClass);
  }

  /**
   * Opens the submenu.
   */
  open() {
    // Set the open value.
    this.isOpen = true;

    // Expand the menu.
    this.expand();

    // Close all sibling menus.
    this.closeSiblings();

    // Set proper focus states to parent & child.
    if (this.parentMenu) this.parentMenu.currentFocus = "child";
    this.menu.currentFocus = "self";

    // Set the new focus.
    this.menu.focusFirstChild();
  }

  /**
   * Opens the submenu without focus entering it.
   */
  preview() {
    // Set the open value.
    this.isOpen = true;

    // Expand the menu.
    this.expand();

    // Close all sibling menus.
    this.closeSiblings();

    // Set proper focus states to parent & child.
    if (this.parentMenu) {
      this.parentMenu.currentFocus = "self";
      this.parentMenu.focusCurrentChild();
    }
    this.menu.currentFocus = "none";
  }

  /**
   * Closes the submenu.
   */
  close() {
    if (this.isOpen) {
      // Set the open value.
      this.isOpen = false;

      // Assign new WAI-ARIA/class values.
      this.element.setAttribute("aria-expanded", "false");
      this.parentElement.classList.remove(this.openClass);
      this.menu.element.classList.remove(this.openClass);
      this.menu.focusFirstChild();

      // Close all child menus.
      this.closeChildren();

      // Set proper focus states to parent & child.
      this.menu.blur();

      if (this.parentMenu) {
        this.parentMenu.currentFocus = "self";

        // Set the new focus.
        this.parentMenu.focusCurrentChild();
      } else if (this.menu.isTopLevel) {
        this.menu.focusController();
      }
    }
  }

  /**
   * Toggles the open state of the menu.
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Closes all sibling menus.
   */
  closeSiblings() {
    try {
      this.parentMenu.menuToggles.forEach(toggle => {
        if (toggle !== this) toggle.close();
      });
    } catch (error) {
      // Fail quietly. No parent exists.
    }
  }

  /**
   * Closes all child menus.
   */
  closeChildren() {
    this.menu.menuToggles.forEach(toggle => toggle.close());
  }

  /**
   * Handle click events required for proper menu usage.
   */
  handleClick() {
    // Handle toggling the menu on click.
    this.element.addEventListener("click", event => {
      preventEvent(event);

      this.toggle();
    });
  }
}

export default MenuToggle;
