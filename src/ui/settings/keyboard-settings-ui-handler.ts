import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { Device } from "#enums/devices";
import { KeyboardLayout } from "#enums/keyboard-layout";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { CFG_KEYBOARD_QWERTY } from "#inputs/cfg-keyboard-qwerty";
import { deleteBind } from "#inputs/config-handler";
import {
  getKeyboardLayoutOptionIndex,
  SettingKeyboard,
  setSettingKeyboard,
  settingKeyboardBlackList,
  settingKeyboardDefaults,
  settingKeyboardOptions,
} from "#system/settings-keyboard";
import type { InterfaceConfig } from "#types/inputs";
import { BaseControlSettingsUiHandler } from "#ui/base-control-settings-ui-handler";
import { addTextObject } from "#ui/text";
import { truncateString } from "#utils/common";
import { toUpperSnakeCase } from "#utils/strings";
import i18next from "i18next";
import Phaser from "phaser";

/** Class representing the settings UI handler for keyboards */
export class SettingsKeyboardUiHandler extends BaseControlSettingsUiHandler {
  constructor() {
    super();

    this.titleSelected = "Keyboard";
    this.setting = SettingKeyboard;
    this.settingDeviceDefaults = settingKeyboardDefaults;
    this.settingDeviceOptions = settingKeyboardOptions;
    this.configs = [CFG_KEYBOARD_QWERTY];
    this.commonSettingsCount = 1;
    this.textureOverride = "keyboard";
    this.settingBlacklisted = settingKeyboardBlackList;
    this.device = Device.KEYBOARD;

    const deleteEvent = globalScene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE);
    const restoreDefaultEvent = globalScene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.HOME);
    deleteEvent?.on("up", this.onDeleteDown, this);
    restoreDefaultEvent?.on("up", this.onHomeDown, this);
  }

  setSetting = setSettingKeyboard;

  private deleteIcon?: Phaser.GameObjects.Sprite;
  private deleteLabel?: Phaser.GameObjects.Text;

  /** Whether the cursor is on the "Keyboard Layout" row, which has no binding to delete */
  private isOnLayoutRow(): boolean {
    return this.cursor + this.scrollCursor === 0;
  }

  override setCursor(cursor: number): boolean {
    const ret = super.setCursor(cursor);
    const showDelete = !this.isOnLayoutRow();
    this.deleteIcon?.setVisible(showDelete);
    this.deleteLabel?.setVisible(showDelete);
    return ret;
  }

  setup() {
    super.setup();
    // If no gamepads are detected, set up a default UI prompt in the settings container.
    this.layout["noKeyboard"] = new Map();
    const optionsContainer = globalScene.add.container(0, 0);
    optionsContainer.setVisible(false); // Initially hide the container as no gamepads are connected.
    const label = addTextObject(8, 28, i18next.t("settings:keyboardPleasePress"), TextStyle.SETTINGS_LABEL);
    label.setOrigin(0, 0);
    optionsContainer.add(label);
    this.settingsContainer.add(optionsContainer);

    const iconDelete = globalScene.add.sprite(0, 0, "keyboard");
    iconDelete.setOrigin(0, -0.1);
    iconDelete.setPositionRelative(this.actionsBg, this.tabMenu.width - 260, 4);
    this.navigationIcons["BUTTON_DELETE"] = iconDelete;

    const deleteText = addTextObject(0, 0, i18next.t("settings:delete"), TextStyle.SETTINGS_LABEL);
    deleteText.setOrigin(0, 0.15);
    deleteText.setPositionRelative(iconDelete, -deleteText.width / 6 - 2, 0);

    this.settingsContainer.add(iconDelete);
    this.settingsContainer.add(deleteText);
    this.deleteIcon = iconDelete;
    this.deleteLabel = deleteText;

    // Map the 'noKeyboard' layout options for easy access.
    this.layout["noKeyboard"].optionsContainer = optionsContainer;
    this.layout["noKeyboard"].label = label;
  }

  /**
   * Handle the home key press event.
   */
  onHomeDown(): void {
    if (![UiMode.SETTINGS_KEYBOARD, UiMode.SETTINGS_GAMEPAD].includes(globalScene.ui.mode)) {
      return;
    }
    const isKeyboard = globalScene.ui.mode === UiMode.SETTINGS_KEYBOARD;
    if (isKeyboard && this.isOnLayoutRow()) {
      if (settings.keyboard.layout === KeyboardLayout.AUTO) {
        void globalScene.inputController.redetectKeyboardLayout();
      } else {
        this.setOptionCursor(0, getKeyboardLayoutOptionIndex(KeyboardLayout.AUTO), true);
      }
      return;
    }
    globalScene.gameData.resetMappingToDefault(isKeyboard ? Device.KEYBOARD : Device.GAMEPAD);
    this.tabMenu?.updateIcons();
  }

  /**
   * Handle the delete key press event.
   */
  onDeleteDown(): void {
    if (globalScene.ui.mode !== UiMode.SETTINGS_KEYBOARD || this.isOnLayoutRow()) {
      return;
    }
    const cursor = this.cursor + this.scrollCursor; // Calculate the absolute cursor position.
    const selection = this.settingLabels[cursor].text;
    const key = toUpperSnakeCase(selection);
    const settingName = SettingKeyboard[key];
    const activeConfig = this.getActiveConfig();
    const success = activeConfig != null && deleteBind(activeConfig, settingName);
    if (success) {
      globalScene.gameData.saveMappingConfigs(
        globalScene.inputController?.selectedDevice[Device.KEYBOARD],
        activeConfig,
      );
      this.updateBindings();
      this.tabMenu?.updateIcons();
    }
  }

  /**
   * Set the layout for the active configuration.
   *
   * @param activeConfig - The active keyboard configuration.
   * @returns `true` if the layout was successfully applied, otherwise `false`.
   */
  setLayout(activeConfig: InterfaceConfig | null): activeConfig is InterfaceConfig {
    // Check if there is no active configuration (e.g., no gamepad connected).
    if (!activeConfig) {
      // Retrieve the layout for when no gamepads are connected.
      const layout = this.layout["noKeyboard"];
      // Make the options container visible to show message.
      layout.optionsContainer.setVisible(true);
      // Return false indicating the layout application was not successful due to lack of gamepad.
      return false;
    }

    return super.setLayout(activeConfig);
  }

  /**
   * Update the display of the chosen keyboard layout.
   */
  updateChosenKeyboardDisplay(): void {
    // Update any bindings that might have changed since the last update.
    this.updateBindings();

    // Iterate over the keys in the settingDevice enumeration.
    for (const [index, key] of Object.keys(this.setting).entries()) {
      const setting = this.setting[key]; // Get the actual setting value using the key.

      // Check if the current setting corresponds to the layout setting.
      if (setting === this.setting.Default_Layout) {
        // Iterate over all layouts excluding the 'noGamepads' special case.
        for (const layoutKey of this.layout.keys()) {
          if (layoutKey === "noKeyboard") {
            continue;
          } // Skip updating the no gamepad layout.
          // Update the text of the first option label under the current setting to the name of the chosen gamepad,
          // truncating the name to 30 characters if necessary.
          this.layout[layoutKey].optionValueLabels[index][0].setText(
            truncateString(globalScene.inputController.selectedDevice[Device.KEYBOARD], 22),
          );
        }
      }
    }
  }
}
