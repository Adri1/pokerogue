import type { KeyboardLayoutPreset } from "#enums/keyboard-layout";
import { KeyboardLayout } from "#enums/keyboard-layout";
import { CFG_KEYBOARD_QWERTY } from "#inputs/cfg-keyboard-qwerty";
import type { KeyboardConfig } from "#types/inputs";
import { deepCopy } from "#utils/data";

interface KeyboardLayoutMapLike {
  get(code: string): string | undefined;
}

interface NavigatorWithKeyboardLayoutMap extends Navigator {
  keyboard?: {
    getLayoutMap?: () => Promise<KeyboardLayoutMapLike>;
  };
}

/**
 * Pairs of keys whose default bindings are exchanged, so that the default binds keep the same
 * physical position as on a QWERTY keyboard.
 */
const LAYOUT_KEY_SWAPS: Record<KeyboardLayoutPreset, readonly (readonly [string, string])[]> = {
  [KeyboardLayout.QWERTY]: [],
  [KeyboardLayout.AZERTY]: [
    ["KEY_A", "KEY_Q"],
    ["KEY_W", "KEY_Z"],
    ["KEY_M", "KEY_COMMA"],
  ],
  [KeyboardLayout.QWERTZ]: [["KEY_Y", "KEY_Z"]],
};

/**
 * Get the keyboard config whose default binds match the given keyboard layout preset.
 * @param layout - The {@linkcode KeyboardLayout} preset
 * @returns A fresh copy of the keyboard config
 */
export function getKeyboardConfigForLayout(layout: KeyboardLayoutPreset): KeyboardConfig {
  const config = deepCopy(CFG_KEYBOARD_QWERTY) as KeyboardConfig;
  const defaults = config.default as Record<string, unknown>;
  for (const [a, b] of LAYOUT_KEY_SWAPS[layout] ?? []) {
    [defaults[a], defaults[b]] = [defaults[b], defaults[a]];
  }
  return config;
}

/**
 * Detect the keyboard layout of the user's system, using the Keyboard Layout Map API.
 * @returns The detected {@linkcode KeyboardLayout}, or `null` if it couldn't be determined
 * (unsupported browser, or a layout that isn't one of the presets)
 */
export async function detectKeyboardLayout(): Promise<KeyboardLayoutPreset | null> {
  try {
    const layoutMap = await (navigator as NavigatorWithKeyboardLayoutMap).keyboard?.getLayoutMap?.();
    if (!layoutMap) {
      return null;
    }
    if (layoutMap.get("KeyQ") === "a") {
      return KeyboardLayout.AZERTY;
    }
    if (layoutMap.get("KeyY") === "z") {
      return KeyboardLayout.QWERTZ;
    }
    if (layoutMap.get("KeyQ") === "q" && layoutMap.get("KeyY") === "y") {
      return KeyboardLayout.QWERTY;
    }
  } catch {
    // The API can throw (e.g. in iframes without permission); fall back to the default layout
  }
  return null;
}

/**
 * Infer the keyboard layout from a physical key and the character it produces.
 * @param code - The physical key (`KeyboardEvent.code`)
 * @param key - The produced character (`KeyboardEvent.key`)
 * @returns The detected layout, or `null` if the key isn't conclusive
 */
export function detectKeyboardLayoutFromKey(code: string, key: string): KeyboardLayoutPreset | null {
  const char = key.toLowerCase();
  switch (code) {
    case "KeyQ":
      return char === "a" ? KeyboardLayout.AZERTY : char === "q" ? KeyboardLayout.QWERTY : null;
    case "KeyA":
      return char === "q" ? KeyboardLayout.AZERTY : char === "a" ? KeyboardLayout.QWERTY : null;
    case "KeyW":
      return char === "z" ? KeyboardLayout.AZERTY : char === "w" ? KeyboardLayout.QWERTY : null;
    case "KeyZ":
      return char === "w"
        ? KeyboardLayout.AZERTY
        : char === "y"
          ? KeyboardLayout.QWERTZ
          : char === "z"
            ? KeyboardLayout.QWERTY
            : null;
    case "KeyY":
      return char === "z" ? KeyboardLayout.QWERTZ : char === "y" ? KeyboardLayout.QWERTY : null;
    default:
      return null;
  }
}

/**
 * Build the custom bindings to use when switching layout presets, keeping the user's own changes.
 * A binding is considered custom if it differs from the previous preset's default.
 * Settings that the user has rebound or unbound are not given a new default bind.
 * @param from - The previously used preset
 * @param to - The preset being switched to
 * @param custom - The current bindings (key name => setting name, or `-1` if unbound)
 * @returns The new bindings
 */
export function mergeCustomBindings(
  from: KeyboardLayoutPreset,
  to: KeyboardLayoutPreset,
  custom: NonNullable<KeyboardConfig["custom"]>,
): NonNullable<KeyboardConfig["custom"]> {
  const oldDefaults = getKeyboardConfigForLayout(from).default;
  const result = { ...getKeyboardConfigForLayout(to).default };

  const customKeys = (Object.keys(custom) as (keyof typeof custom)[]).filter(key => custom[key] !== oldDefaults[key]);
  const touchedSettings = new Set<(typeof custom)[keyof typeof custom]>();
  for (const key of customKeys) {
    touchedSettings.add(custom[key]);
    touchedSettings.add(oldDefaults[key]);
  }
  touchedSettings.delete(-1);

  for (const key of Object.keys(result) as (keyof typeof result)[]) {
    if (touchedSettings.has(result[key])) {
      result[key] = -1;
    }
  }
  for (const key of customKeys) {
    result[key] = custom[key];
  }
  return result;
}
