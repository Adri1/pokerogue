export enum KeyboardLayout {
  QWERTY,
  AZERTY,
  QWERTZ,
  AUTO,
}

export type KeyboardLayoutPreset = Exclude<KeyboardLayout, KeyboardLayout.AUTO>;
