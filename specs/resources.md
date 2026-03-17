# Resources

LifeRPG tracks three player resources: energy, hydration, and gold. Energy and hydration decay over real time to model real-world health habits. Gold is a persistent currency with no decay.

---

## Energy

### Range & Meaning

Energy is a percentage value from 0 to 100. It represents the player's current stamina or readiness. At 100 the player is fully rested; at 0 they are exhausted.

### Decay

Energy decays continuously while the app is open (and catches up on re-open). Decay is configurable:

- **Decay enabled**: Boolean toggle. When disabled, energy only changes via explicit quest costs/rewards or item use.
- **Minutes per day**: The number of minutes over which energy drains from 100% to 0%. Default is 960 minutes (16 hours). This means a fully rested player becomes exhausted in 16 hours of real time.

**Formula**:
```
decayPerMinute = 100 / minutesPerDay
elapsedMinutes = (now - lastUpdated) / 60000
energyLost = decayPerMinute × elapsedMinutes
newEnergy = max(0, energy - energyLost)
```

`lastUpdated` is refreshed every time energy changes (quest cost, item use, or decay tick).

### Gaining & Spending Energy

- **Quest rewards**: `energyReward` on a quest adds the specified % on completion.
- **Quest costs**: `energyCost` on a quest deducts the specified % on completion (applied after rewards).
- **Item use**: Inventory items can have an `energyEffect` (positive or negative percentage).
- **Full rest**: The character screen provides a "Full Rest" button that sets energy to 100%.

### Display

Energy is shown as a percentage bar in the HUD bar at the top of every screen. The bar is color-coded based on value:
- High (≥66%): green
- Medium (33–65%): yellow/orange
- Low (<33%): red

---

## Hydration

### Range & Meaning

Hydration is a percentage value from 0 to 120. The 100% mark represents the player's daily water goal; values above 100 indicate the player has exceeded their goal (a 20% buffer). At 0 the player is fully dehydrated.

### Decay

Hydration decays at a fixed rate: it drains from 100% to 0% in exactly 24 hours, regardless of settings.

```
decayPerMinute = 100 / (24 × 60) ≈ 0.0694% per minute
elapsedMinutes = (now - lastUpdated) / 60000
hydrationLost = decayPerMinute × elapsedMinutes
newHydration = max(0, hydration - hydrationLost)
```

`lastUpdated` is refreshed every time hydration changes.

### Drinking Water

The primary way to gain hydration is via the "Drink Water" action in the HUD bar.

Each drink adds `100 / dailyWaterServings` percentage points. For example, if the goal is 8 servings per day, each drink adds 12.5%.

**Water unit setting**: The player can choose between imperial (fluid ounces) and metric (milliliters) display. This affects labels only — the percentage math is the same.

**Daily servings setting**: Configurable in the character screen. Determines how many drinks equal 100% hydration.

### Gaining & Spending Hydration

- **Drinking water**: Primary source; adds one serving worth of percentage.
- **Quest rewards**: `hydrationReward` adds the specified % on quest completion.
- **Quest costs**: `hydrationCost` deducts the specified % on quest completion.
- **Item use**: Inventory items can have a `hydrationEffect` (positive or negative percentage).

### Display

Hydration is shown as a percentage bar in the HUD bar alongside energy. A water drop icon accompanies it. The bar can visually exceed 100% (up to 120%) to reflect the overage buffer.

---

## Gold

### Range & Meaning

Gold is a non-negative integer currency. It has no cap and no decay. The player earns gold by completing quests and spends it in the shop.

### Earning Gold

Every quest has a `goldReward` field (default 0). On quest completion, the reward amount is added to the player's gold balance.

### Spending Gold

Gold is spent when purchasing items from the shop. If the player's gold balance is less than the item's cost, the purchase is rejected.

### Display

Gold is displayed in the HUD bar with a coin icon. It is always shown as a whole number.

---

## Decay Timing

Energy and hydration decay are applied in two situations:

1. **App startup / foreground**: When the app is opened or brought back to the foreground, the elapsed time since `lastUpdated` is calculated and decay is applied in one batch.
2. **Periodic tick**: While the app is open, decay is applied every 60 seconds via hooks mounted in the root layout (`useEnergyDecay`, `useHydrationDecay`).

Both hooks use the store's `getState()` method (not a reactive selector) to avoid triggering unnecessary re-renders, and run with empty dependency arrays.

---

## Resource Interactions Summary

| Action | Energy | Hydration | Gold |
|---|---|---|---|
| Complete quest | ± reward/cost | ± reward/cost | + reward |
| Skip quest | No change | No change | No change |
| Use inventory item | ± effect | ± effect | No change |
| Purchase shop item | No change | No change | − cost |
| Full rest (character screen) | → 100% | No change | No change |
| Drink water (HUD) | No change | + 1 serving | No change |
| Real-time decay | − (if enabled) | − (always) | No change |
