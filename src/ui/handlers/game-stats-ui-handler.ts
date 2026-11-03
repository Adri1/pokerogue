import { loggedInUser } from "#app/account";
import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { speciesDataRegistry } from "#app/global-species-data-registry";
import { Button } from "#enums/buttons";
import { DexAttr } from "#enums/dex-attr";
import { TextStyle } from "#enums/text-style";
import type { GameData } from "#system/game-data";
import { addTextObject } from "#ui/text";
import { UiHandler } from "#ui/ui-handler";
import { addWindow } from "#ui/ui-theme";
import { formatFancyLargeNumber, formatNumberForCurrentLanguage, getPlayTimeString } from "#utils/common";
import { toTitleCase } from "#utils/strings";
import i18next from "i18next";
import Phaser from "phaser";

interface DisplayStat {
  label_key?: string;
  sourceFunc?: (gameData: GameData) => string;
  hidden?: boolean;
}

interface DisplayStats {
  [key: string]: DisplayStat | string;
}

const displayStats: DisplayStats = {
  playTime: {
    label_key: "playTime",
    sourceFunc: gameData => getPlayTimeString(gameData.gameStats.playTime),
  },
  battles: {
    label_key: "totalBattles",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.battles),
  },
  startersUnlocked: {
    label_key: "starters",
    sourceFunc: gameData => {
      const starterCount = gameData.getStarterCount(d => !!d.caughtAttr);
      const percentage = Math.floor((starterCount / speciesDataRegistry.getAllStarters().length) * 1000) / 10;
      return `${formatNumberForCurrentLanguage(starterCount)} (${formatNumberForCurrentLanguage(percentage, { maximumFractionDigits: 1 })}%)`;
    },
  },
  shinyStartersUnlocked: {
    label_key: "shinyStarters",
    sourceFunc: gameData => {
      const starterCount = gameData.getStarterCount(d => !!(d.caughtAttr & DexAttr.SHINY));
      const percentage = Math.floor((starterCount / speciesDataRegistry.getAllStarters().length) * 1000) / 10;
      return `${formatNumberForCurrentLanguage(starterCount)} (${formatNumberForCurrentLanguage(percentage, { maximumFractionDigits: 1 })}%)`;
    },
  },
  dexEncountered: {
    label_key: "speciesEncountered",
    sourceFunc: gameData => {
      const seenCount = gameData.getSpeciesCount(d => !!d.seenCount);
      const percentage = Math.floor((seenCount / Object.keys(gameData.dexData).length) * 1000) / 10;
      return `${formatNumberForCurrentLanguage(seenCount)} (${formatNumberForCurrentLanguage(percentage, { maximumFractionDigits: 1 })}%)`;
    },
  },
  dexSeen: {
    label_key: "speciesSeen",
    sourceFunc: gameData => {
      const seenCount = gameData.getSpeciesCount(d => !!d.seenAttr || !!d.caughtAttr);
      const percentage = Math.floor((seenCount / Object.keys(gameData.dexData).length) * 1000) / 10;
      return `${formatNumberForCurrentLanguage(seenCount)} (${formatNumberForCurrentLanguage(percentage, { maximumFractionDigits: 1 })}%)`;
    },
  },
  dexCaught: {
    label_key: "speciesCaught",
    sourceFunc: gameData => {
      const caughtCount = gameData.getSpeciesCount(d => !!d.caughtAttr);
      const percentage = Math.floor((caughtCount / Object.keys(gameData.dexData).length) * 1000) / 10;
      return `${formatNumberForCurrentLanguage(caughtCount)} (${formatNumberForCurrentLanguage(percentage, { maximumFractionDigits: 1 })}%)`;
    },
  },
  ribbonsOwned: {
    label_key: "ribbonsOwned",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.ribbonsOwned),
  },
  classicSessionsPlayed: {
    label_key: "classicRuns",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.classicSessionsPlayed),
  },
  sessionsWon: {
    label_key: "classicWins",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.sessionsWon),
  },
  dailyRunSessionsPlayed: {
    label_key: "dailyRunAttempts",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.dailyRunSessionsPlayed),
  },
  dailyRunSessionsWon: {
    label_key: "dailyRunWins",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.dailyRunSessionsWon),
  },
  endlessSessionsPlayed: {
    label_key: "endlessRuns",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.endlessSessionsPlayed),
    hidden: true,
  },
  highestEndlessWave: {
    label_key: "highestWaveEndless",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.highestEndlessWave),
    hidden: true,
  },
  highestMoney: {
    label_key: "highestMoney",
    sourceFunc: gameData => formatFancyLargeNumber(gameData.gameStats.highestMoney),
  },
  highestDamage: {
    label_key: "highestDamage",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.highestDamage),
  },
  highestHeal: {
    label_key: "highestHpHealed",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.highestHeal),
  },
  pokemonSeen: {
    label_key: "pokemonEncountered",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.pokemonSeen),
  },
  pokemonDefeated: {
    label_key: "pokemonDefeated",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.pokemonDefeated),
  },
  pokemonCaught: {
    label_key: "pokemonCaught",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.pokemonCaught),
  },
  pokemonHatched: {
    label_key: "eggsHatched",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.pokemonHatched),
  },
  subLegendaryPokemonSeen: {
    label_key: "subLegendsSeen",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.subLegendaryPokemonSeen),
    hidden: true,
  },
  subLegendaryPokemonCaught: {
    label_key: "subLegendsCaught",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.subLegendaryPokemonCaught),
    hidden: true,
  },
  subLegendaryPokemonHatched: {
    label_key: "subLegendsHatched",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.subLegendaryPokemonHatched),
    hidden: true,
  },
  legendaryPokemonSeen: {
    label_key: "legendsSeen",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.legendaryPokemonSeen),
    hidden: true,
  },
  legendaryPokemonCaught: {
    label_key: "legendsCaught",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.legendaryPokemonCaught),
    hidden: true,
  },
  legendaryPokemonHatched: {
    label_key: "legendsHatched",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.legendaryPokemonHatched),
    hidden: true,
  },
  mythicalPokemonSeen: {
    label_key: "mythicalsSeen",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.mythicalPokemonSeen),
    hidden: true,
  },
  mythicalPokemonCaught: {
    label_key: "mythicalsCaught",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.mythicalPokemonCaught),
    hidden: true,
  },
  mythicalPokemonHatched: {
    label_key: "mythicalsHatched",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.mythicalPokemonHatched),
    hidden: true,
  },
  shinyPokemonSeen: {
    label_key: "shiniesSeen",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.shinyPokemonSeen),
    hidden: true,
  },
  shinyPokemonCaught: {
    label_key: "shiniesCaught",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.shinyPokemonCaught),
    hidden: true,
  },
  shinyPokemonHatched: {
    label_key: "shiniesHatched",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.shinyPokemonHatched),
    hidden: true,
  },
  pokemonFused: {
    label_key: "pokemonFused",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.pokemonFused),
    hidden: true,
  },
  trainersDefeated: {
    label_key: "trainersDefeated",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.trainersDefeated),
  },
  eggsPulled: {
    label_key: "eggsPulled",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.eggsPulled),
    hidden: true,
  },
  rareEggsPulled: {
    label_key: "rareEggsPulled",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.rareEggsPulled),
    hidden: true,
  },
  epicEggsPulled: {
    label_key: "epicEggsPulled",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.epicEggsPulled),
    hidden: true,
  },
  legendaryEggsPulled: {
    label_key: "legendaryEggsPulled",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.legendaryEggsPulled),
    hidden: true,
  },
  manaphyEggsPulled: {
    label_key: "manaphyEggsPulled",
    sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats.manaphyEggsPulled),
    hidden: true,
  },
};

export class GameStatsUiHandler extends UiHandler {
  private gameStatsContainer: Phaser.GameObjects.Container;
  private statsContainer: Phaser.GameObjects.Container;

  /** The number of rows enabled per page. */
  private static readonly ROWS_PER_PAGE = 9;

  private statLabels: Phaser.GameObjects.Text[] = [];
  private statValues: Phaser.GameObjects.Text[] = [];

  private arrowUp: Phaser.GameObjects.Sprite;
  private arrowDown: Phaser.GameObjects.Sprite;

  /** Logged in username */
  private headerText: Phaser.GameObjects.Text;

  /** The game data to display */
  private gameData: GameData;

  /** A callback invoked when {@linkcode clear} is called */
  private exitCallback?: (() => void) | undefined;

  /** Whether the UI is single column mode */
  private get singleCol(): boolean {
    const resolvedLang = i18next.resolvedLanguage ?? "en";
    // NOTE TO TRANSLATION TEAM: Add more languages that want to display
    // in a single-column inside of the `[]` (e.g. `["ru", "fr"]`)
    const singleColumnLanguages = [
      "fr",
      "es-ES",
      "es-419",
      "it",
      "ja",
      "pt-BR",
      "ru",
      "id",
      "th",
      "tr",
      "sv",
      "uk",
      "eu",
      "vi",
      "pl",
    ];
    return singleColumnLanguages.includes(resolvedLang);
  }
  /** The number of columns used by this menu in the resolved language */
  private get columnCount(): 1 | 2 {
    return this.singleCol ? 1 : 2;
  }

  // #region Columnar-specific properties

  /** The with of each column in the stats view */
  private get colWidth(): number {
    return (globalScene.scaledCanvas.width - 2) / this.columnCount;
  }

  /** THe width of a column's background window */
  private get colBgWidth(): number {
    return this.colWidth - 2;
  }

  /**
   * Calculate the `x` position of the stat label based on its index.
   *
   * @remarks
   * Should be used for stat labels (e.g. stat name, not its value). For stat value, use {@linkcode calcTextX}.
   * @param index - The index of the stat label
   * @returns The `x` position for the stat label
   */
  private calcLabelX(index: number): number {
    if (this.singleCol || !(index & 1)) {
      return 8;
    }
    return 8 + (index & 1 ? this.colBgWidth : 0);
  }

  /**
   * Calculate the `y` position of the stat label/text based on its index.
   * @param index - The index of the stat label
   * @returns The `y` position for the stat label
   */
  private calcEntryY(index: number): number {
    if (!this.singleCol) {
      // Floor division by 2 as we want 1 to go to 0
      index >>= 1;
    }
    return 28 + index * 16;
  }

  /**
   * Calculate the `x` position of the stat value based on its index.
   * @param index - The index of the stat value
   * @returns The calculated `x` position
   */
  private calcTextX(index: number): number {
    if (this.singleCol || !(index & 1)) {
      return this.colBgWidth - 8;
    }
    return this.colBgWidth * 2 - 8;
  }

  /** The number of stats on screen at one time (varies with column count) */
  private get statsPerPage(): number {
    return GameStatsUiHandler.ROWS_PER_PAGE * this.columnCount;
  }

  /**
   * Returns the username of logged in user. If the username is hidden, the trainer name based on gender will be displayed.
   * @returns The username of logged in user
   */
  private getUsername(): string {
    const usernameReplacement = settings.isPlayerFemale
      ? i18next.t("trainerNames:playerF")
      : i18next.t("trainerNames:playerM");

    const displayName = settings.display.hideUsername
      ? usernameReplacement
      : (loggedInUser?.username ?? i18next.t("common:guest"));

    return i18next.t("gameStatsUiHandler:stats", { username: displayName });
  }

  // #endregion Columnar-specific properties

  setup() {
    const ui = this.getUi();

    /** The scaled width of the global canvas */
    const sWidth = globalScene.scaledCanvas.width;
    /** The scaled height of the global canvas */
    const sHeight = globalScene.scaledCanvas.height;

    const gameStatsContainer = globalScene.add.container(1, -sHeight + 1);
    this.gameStatsContainer = gameStatsContainer;

    this.gameStatsContainer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, sWidth, sHeight),
      Phaser.Geom.Rectangle.Contains,
    );

    const headerBg = addWindow(0, 0, sWidth - 2, 24).setOrigin(0);

    this.headerText = addTextObject(0, 0, this.getUsername(), TextStyle.HEADER_LABEL)
      .setOrigin(0)
      .setPositionRelative(headerBg, 8, 4);

    this.gameStatsContainer.add([headerBg, this.headerText]);

    const colWidth = this.colWidth;

    {
      const columnCount = this.columnCount;
      const headerHeight = headerBg.height;
      const statsBgHeight = Math.floor(globalScene.scaledCanvas.height - headerBg.height - 2);
      const maskOffsetX = columnCount === 1 ? 0 : -3;
      for (let i = 0; i < columnCount; i++) {
        gameStatsContainer.add(
          addWindow(i * this.colBgWidth, headerHeight, colWidth, statsBgHeight, false, false, maskOffsetX, 1, undefined) // formatting
            .setOrigin(0),
        );
      }
    }

    const length = this.statsPerPage;
    this.statLabels = Array.from({ length }, (_, i) =>
      addTextObject(this.calcLabelX(i), this.calcEntryY(i), "", TextStyle.STATS_LABEL).setOrigin(0),
    );

    this.statValues = Array.from({ length }, (_, i) =>
      addTextObject(this.calcTextX(i), this.calcEntryY(i), "", TextStyle.STATS_VALUE).setOrigin(1, 0),
    );
    this.statsContainer = globalScene.add.container(0, 0, [...this.statLabels, ...this.statValues]);

    this.gameStatsContainer.add(this.statsContainer);

    // arrows to show that we can scroll through the stats
    const isLegacyTheme = settings.isLegacyTheme;
    const arrowX = this.singleCol ? colWidth / 2 : colWidth;
    this.arrowDown = globalScene.add.sprite(arrowX, sHeight - (isLegacyTheme ? 9 : 5), "prompt");

    this.arrowUp = globalScene.add
      .sprite(arrowX, headerBg.height + (isLegacyTheme ? 7 : 3), "prompt") //
      .setFlipY(true);

    this.gameStatsContainer.add([this.arrowDown, this.arrowUp]);

    ui.add(this.gameStatsContainer);

    this.setCursor(0);
    this.gameStatsContainer.setVisible(false);
  }

  show([username, data, callback]: [] | [username: string, data: GameData, callback?: () => void]): boolean {
    super.show([]);

    if (username != null && data != null) {
      this.gameData = data;
      this.exitCallback = callback;
      this.headerText.setText(username);
    } else {
      this.gameData = globalScene.gameData;
      this.exitCallback = undefined;
      // show updated username on every render
      this.headerText.setText(this.getUsername());
    }

    this.gameStatsContainer.setActive(true).setVisible(true);

    this.arrowUp.setActive(true).play("prompt").setVisible(false);
    this.arrowDown.setActive(true).play("prompt");
    /* `setCursor` handles updating stats if the position is different from before.
       When opening this UI, we want to update stats regardless of the prior position. */
    if (!this.setCursor(0)) {
      this.updateStats();
    }
    if (settings.isLegacyTheme) {
      this.arrowUp.setTint(0x484848);
      this.arrowDown.setTint(0x484848);
    }

    this.getUi()
      .moveTo(this.gameStatsContainer, this.getUi().length - 1)
      .hideTooltip();

    return true;
  }

  /**
   * Update the stat labels and values to reflect the current cursor position.
   *
   * @remarks
   *
   * Invokes each stat's {@linkcode DisplayStat.sourceFunc | sourceFunc} to obtain its value.
   * Stat labels are shown as `???` if the stat is marked as hidden and its value is zero.
   */
  private updateStats(): void {
    const perPage = this.statsPerPage;
    const columns = this.columnCount;
    const statKeys = Object.keys(displayStats).slice(this.cursor * columns, this.cursor * columns + perPage);
    statKeys.forEach((key, s) => {
      const stat = displayStats[key] as DisplayStat;
      const value = stat.sourceFunc?.(this.gameData) ?? "-";
      const valAsInt = Number.parseInt(value);
      this.statLabels[s].setText(
        !stat.hidden || Number.isNaN(value) || valAsInt ? i18next.t(`gameStatsUiHandler:${stat.label_key}`) : "???",
      );
      this.statValues[s].setText(value);
    });
    for (let s = statKeys.length; s < perPage; s++) {
      this.statLabels[s].setText("");
      this.statValues[s].setText("");
    }
  }

  /** The maximum cursor position */
  private get maxCursorPos(): number {
    return Math.ceil((Object.keys(displayStats).length - this.statsPerPage) / this.columnCount);
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    /** The direction to move the cursor (up/down) */
    let dir: 1 | -1 = 1;
    switch (button) {
      case Button.CANCEL:
        success = true;
        globalScene.ui.revertMode();
        break;
      // biome-ignore lint/suspicious/noFallthroughSwitchClause: intentional
      case Button.UP:
        dir = -1;
      case Button.DOWN:
        success = this.setCursor(this.cursor + dir);
    }

    if (success) {
      ui.playSelect();
      return true;
    }

    return false;
  }

  /**
   * Set the cursor to the specified position, if able and update the stats display.
   *
   * @remarks
   *
   * If `newCursor` is not between `0` and {@linkcode maxCursorPos}, or if it is the same as {@linkcode newCursor}
   * then no updates happen and `false` is returned.
   *
   * Otherwise, updates the up/down arrow visibility and calls {@linkcode updateStats}
   *
   * @param newCursor - The position to set the cursor to.
   * @returns Whether the cursor successfully moved to a new position
   */
  override setCursor(newCursor: number): boolean {
    if (newCursor < 0 || newCursor > this.maxCursorPos || this.cursor === newCursor) {
      return false;
    }

    this.cursor = newCursor;

    this.updateStats();
    // NOTE: Do not toggle the arrows' "active" property here, as this would cause their animations to desync
    this.arrowUp.setVisible(this.cursor > 0);
    this.arrowDown.setVisible(this.cursor < this.maxCursorPos);

    return true;
  }

  clear() {
    super.clear();
    this.gameStatsContainer.setVisible(false).setActive(false);

    const callback = this.exitCallback;
    if (callback != null) {
      this.exitCallback = undefined;
      callback();
    }
  }
}

export function initStatsKeys() {
  const statKeys = Object.keys(displayStats);

  for (const key of statKeys) {
    if (typeof displayStats[key] === "string") {
      let label = displayStats[key] as string;
      let hidden = false;
      if (label.endsWith("?")) {
        label = label.slice(0, -1);
        hidden = true;
      }
      displayStats[key] = {
        label_key: label,
        sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats[key]),
        hidden,
      };
    } else if (displayStats[key] === null) {
      displayStats[key] = {
        sourceFunc: gameData => formatNumberForCurrentLanguage(gameData.gameStats[key]),
      };
    }
    if (!displayStats[key].label_key) {
      const splittableKey = key.replace(/([a-z]{2,})([A-Z]{1}(?:[^A-Z]|$))/g, "$1_$2");
      displayStats[key].label_key = toTitleCase(splittableKey);
    }
  }
}
