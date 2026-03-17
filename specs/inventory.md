# Inventory & Shop

The shop lets the player purchase consumable items using gold. Purchased items go into the inventory and can be used to restore energy or hydration. Items are created and managed by the player; there is no predefined item catalog.

---

## Shop Items

Shop items are the catalog entries — what is available for purchase. They are created and edited by the player via the Shop Item Form modal.

### Shop Item Fields

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Unique identifier |
| `name` | string | Display name |
| `description` | string (optional) | Flavor text or notes |
| `cost` | number | Gold cost to purchase |
| `quantity` | number \| null | Stock count; null means infinite stock |
| `energyEffect` | number | Energy % change on use (positive or negative) |
| `hydrationEffect` | number | Hydration % change on use (positive or negative) |
| `icon` | string \| null | Ionicons icon name |
| `iconColor` | string \| null | Hex color for the icon |
| `createdAt` | ISO string | Creation timestamp |

### Item Creation & Editing

Players access item management from the Inventory screen via an add/edit button. The Shop Item Form modal provides:

- Name and description fields
- Cost slider/input
- Quantity input (with a toggle for infinite stock)
- Energy and hydration effect sliders (each can be positive or negative)
- Icon and color picker
- Delete button (with confirmation dialog) for existing items

---

## Shop (Purchase Flow)

The Inventory screen has two tabs: **Shop** and **Inventory**.

The Shop tab displays all items in the catalog. Each item card shows:
- Name, description, icon
- Gold cost
- Energy/hydration effects (with directional indicators)
- Remaining stock (or "∞" for infinite)
- Buy button

**Purchase logic**:
1. Check that the player has enough gold (`gold >= item.cost`). If not, reject with a reason message.
2. Deduct the gold from the player's balance.
3. If the item has finite stock, decrement `item.quantity` by 1. If it reaches 0, the item remains in the catalog but is marked as out of stock.
4. Add the item to the player's inventory (or increment quantity if it already exists there).

---

## Inventory (Use Flow)

The Inventory tab displays all items the player currently owns.

### Inventory Item Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Matches the shop item's id it came from |
| `name` | string | Copied from shop item at time of purchase |
| `quantity` | number | How many the player owns |
| `energyEffect` | number | Copied from shop item |
| `hydrationEffect` | number | Copied from shop item |
| `lastAcquiredAt` | ISO string | Timestamp of most recent purchase |

**Use logic**:
1. Apply `energyEffect` to the player's current energy (clamped to 0–100).
2. Apply `hydrationEffect` to the player's current hydration (clamped to 0–120).
3. Decrement `quantity` by 1.
4. If `quantity` reaches 0, remove the item from the inventory.

Items with a `hydrationEffect` trigger a hydration decay catch-up before applying the effect, so the displayed value is accurate.

---

## Data Persistence

The shop store persists to two Firestore subcollections under `users/{uid}`:
- `shopItems/{itemId}` — the shop catalog; each item is a separate document keyed by its `id`
- `inventory/{itemId}` — the player's owned items; each entry is a separate document keyed by its `id`

On sign-in, both subcollections are fetched in parallel to hydrate the store. Every store action that mutates shop or inventory state writes the affected document(s) to Firestore immediately after updating local state (fire-and-forget).

---

## Shop Store Actions

| Action | Description |
|---|---|
| `addItem(input)` | Create a new shop item |
| `updateItem(id, partial)` | Modify any shop item fields |
| `deleteItem(id)` | Remove an item from the shop catalog |
| `purchaseItem(id)` | Buy an item; returns `{success: boolean, reason?: string}` |
| `useInventoryItem(id)` | Use one unit of an inventory item; applies effects |
