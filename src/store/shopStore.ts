import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { ShopItem, InventoryItem } from '../types';
import { useCharacterStore } from './characterStore';
import { Platform } from 'react-native';
import {
  getShopItemsCollectionRef,
  getShopItemRef,
  getInventoryCollectionRef,
  getInventoryItemRef,
  firestoreSetDoc,
  firestoreGetDoc,
  firestoreGetDocs,
  firestoreDeleteDoc,
} from '../lib/firestore';
import { getFirebaseFirestore } from '../lib/firebase';

interface ShopItemInput {
  name: string;
  description?: string;
  cost: number;
  quantity: number | null;
  energyEffect: number;
  hydrationEffect: number;
  icon: string | null;
  iconColor: string | null;
}

interface ShopState {
  items: ShopItem[];
  inventory: InventoryItem[];

  addItem: (input: ShopItemInput) => void;
  updateItem: (id: string, input: Partial<ShopItemInput>) => void;
  deleteItem: (id: string) => void;
  purchaseItem: (id: string) => { success: boolean; reason?: string };
  useInventoryItem: (id: string) => void;

  // Firestore hydration
  loadShopDataFromFirestore: (userId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Firestore write helpers
// ---------------------------------------------------------------------------

function getUid(): string | undefined {
  const { useAuthStore } = require('./authStore');
  return useAuthStore.getState().user?.uid;
}

async function saveShopItemToFirestore(userId: string, item: ShopItem): Promise<void> {
  try {
    const ref = await getShopItemRef(userId, item.id);
    await firestoreSetDoc(ref, item);
  } catch (e) {
    console.warn('[shopStore] ShopItem write failed:', e);
  }
}

async function deleteShopItemFromFirestore(userId: string, itemId: string): Promise<void> {
  try {
    const ref = await getShopItemRef(userId, itemId);
    await firestoreDeleteDoc(ref);
  } catch (e) {
    console.warn('[shopStore] ShopItem delete failed:', e);
  }
}

async function saveInventoryItemToFirestore(userId: string, item: InventoryItem): Promise<void> {
  try {
    const ref = await getInventoryItemRef(userId, item.id);
    await firestoreSetDoc(ref, item);
  } catch (e) {
    console.warn('[shopStore] InventoryItem write failed:', e);
  }
}

async function deleteInventoryItemFromFirestore(userId: string, itemId: string): Promise<void> {
  try {
    const ref = await getInventoryItemRef(userId, itemId);
    await firestoreDeleteDoc(ref);
  } catch (e) {
    console.warn('[shopStore] InventoryItem delete failed:', e);
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useShopStore = create<ShopState>()((set, get) => ({
  items: [],
  inventory: [],

  // ------------------------------------------------------------------
  // Firestore hydration
  // ------------------------------------------------------------------
  loadShopDataFromFirestore: async (userId) => {
    try {
      const [shopColRef, inventoryColRef] = await Promise.all([
        getShopItemsCollectionRef(userId),
        getInventoryCollectionRef(userId),
      ]);

      const [shopDocs, inventoryDocs] = await Promise.all([
        firestoreGetDocs(shopColRef),
        firestoreGetDocs(inventoryColRef),
      ]);

      const items: ShopItem[] = shopDocs.map((d) => d.data as ShopItem);
      const inventory: InventoryItem[] = inventoryDocs.map((d) => d.data as InventoryItem);

      set({ items, inventory });

      // First sign-up: nothing to write — store is empty by default
    } catch (e) {
      console.warn('[shopStore] Firestore load failed:', e);
    }
  },

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------
  addItem: (input) => {
    const item: ShopItem = {
      id: uuidv4(),
      name: input.name,
      description: input.description ?? '',
      cost: input.cost,
      quantity: input.quantity,
      energyEffect: input.energyEffect,
      hydrationEffect: input.hydrationEffect,
      icon: input.icon,
      iconColor: input.iconColor,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ items: [...s.items, item] }));
    const uid = getUid();
    if (uid) saveShopItemToFirestore(uid, item);
  },

  updateItem: (id, input) => {
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, ...input } : item
      ),
    }));
    const uid = getUid();
    if (uid) {
      const updated = get().items.find((i) => i.id === id);
      if (updated) saveShopItemToFirestore(uid, updated);
    }
  },

  deleteItem: (id) => {
    // Also remove from inventory if owned (by name match)
    const item = get().items.find((i) => i.id === id);
    const inventoryMatch = item
      ? get().inventory.find((inv) => inv.name === item.name)
      : undefined;

    set((s) => ({
      items: s.items.filter((i) => i.id !== id),
      inventory: item
        ? s.inventory.filter((inv) => inv.name !== item.name)
        : s.inventory,
    }));

    const uid = getUid();
    if (uid) {
      deleteShopItemFromFirestore(uid, id);
      if (inventoryMatch) deleteInventoryItemFromFirestore(uid, inventoryMatch.id);
    }
  },

  purchaseItem: (id) => {
    const { items, inventory } = get();
    const item = items.find((i) => i.id === id);
    if (!item) return { success: false, reason: 'Item not found' };

    const profile = useCharacterStore.getState();
    if (profile.gold < item.cost) {
      return { success: false, reason: 'Not enough gold' };
    }

    profile.addGold(-item.cost);

    const now = new Date().toISOString();
    let newItems = items;
    let deletedShopItem = false;
    if (item.quantity !== null) {
      const newQty = item.quantity - 1;
      if (newQty <= 0) {
        newItems = items.filter((i) => i.id !== id);
        deletedShopItem = true;
      } else {
        newItems = items.map((i) =>
          i.id === id ? { ...i, quantity: newQty } : i
        );
      }
    }

    const existing = inventory.find((inv) => inv.name === item.name);
    let newInventory: InventoryItem[];
    let upsertedInventoryItem: InventoryItem;
    if (existing) {
      upsertedInventoryItem = { ...existing, quantity: existing.quantity + 1, lastAcquiredAt: now };
      newInventory = inventory.map((inv) =>
        inv.name === item.name ? upsertedInventoryItem : inv
      );
    } else {
      upsertedInventoryItem = {
        id: uuidv4(),
        name: item.name,
        quantity: 1,
        energyEffect: item.energyEffect,
        hydrationEffect: item.hydrationEffect,
        lastAcquiredAt: now,
      };
      newInventory = [...inventory, upsertedInventoryItem];
    }

    set({ items: newItems, inventory: newInventory });

    const uid = getUid();
    if (uid) {
      if (deletedShopItem) {
        deleteShopItemFromFirestore(uid, id);
      } else {
        const updatedShopItem = newItems.find((i) => i.id === id);
        if (updatedShopItem) saveShopItemToFirestore(uid, updatedShopItem);
      }
      saveInventoryItemToFirestore(uid, upsertedInventoryItem);
    }

    return { success: true };
  },

  useInventoryItem: (id) => {
    const item = get().inventory.find((i) => i.id === id);
    if (!item) return;

    const character = useCharacterStore.getState();
    if (item.energyEffect > 0) character.gainEnergy(item.energyEffect);
    else if (item.energyEffect < 0) character.spendEnergy(-item.energyEffect);
    if (item.hydrationEffect > 0) character.gainHydration(item.hydrationEffect);
    else if (item.hydrationEffect < 0) character.spendHydration(-item.hydrationEffect);

    const inv = get().inventory.find((i) => i.id === id);
    if (!inv) return;

    const uid = getUid();

    if (inv.quantity <= 1) {
      set((s) => ({ inventory: s.inventory.filter((i) => i.id !== id) }));
      if (uid) deleteInventoryItemFromFirestore(uid, id);
    } else {
      const updated: InventoryItem = { ...inv, quantity: inv.quantity - 1 };
      set((s) => ({
        inventory: s.inventory.map((i) => i.id === id ? updated : i),
      }));
      if (uid) saveInventoryItemToFirestore(uid, updated);
    }
  },
}));

// ---------------------------------------------------------------------------
// Real-time listeners (Phase 6 – Multi-Device Sync)
// ---------------------------------------------------------------------------

let _shopUnsubs: Array<() => void> = [];
let _shopMountId = 0;

export function mountShopListeners(userId: string): () => void {
  // Tear down any existing listeners before starting new ones (prevents leaks on rapid sign-in/sign-out)
  unmountShopListeners();

  const mountId = ++_shopMountId;

  (async () => {
    try {
      const db = await getFirebaseFirestore();

      if (mountId !== _shopMountId) return;

      let shopUnsub: (() => void) | null = null;
      let inventoryUnsub: (() => void) | null = null;

      if (Platform.OS === 'web') {
        const { onSnapshot, collection } = await import('firebase/firestore');

        // Check again after the dynamic import in case unmount raced
        if (mountId !== _shopMountId) return;

        const shopRef = collection(db as any, 'users', userId, 'shopItems');
        shopUnsub = onSnapshot(shopRef, (snapshot: any) => {
          snapshot.docChanges().forEach((change: any) => {
            const item = { ...change.doc.data(), id: change.doc.id } as ShopItem;
            if (change.type === 'added' || change.type === 'modified') {
              useShopStore.setState((state) => ({
                items: state.items.some((i) => i.id === item.id)
                  ? state.items.map((i) => (i.id === item.id ? item : i))
                  : [...state.items, item],
              }));
            } else if (change.type === 'removed') {
              useShopStore.setState((state) => ({
                items: state.items.filter((i) => i.id !== item.id),
              }));
            }
          });
        });

        const inventoryRef = collection(db as any, 'users', userId, 'inventory');
        inventoryUnsub = onSnapshot(inventoryRef, (snapshot: any) => {
          snapshot.docChanges().forEach((change: any) => {
            const inv = { ...change.doc.data(), id: change.doc.id } as InventoryItem;
            if (change.type === 'added' || change.type === 'modified') {
              useShopStore.setState((state) => ({
                inventory: state.inventory.some((i) => i.id === inv.id)
                  ? state.inventory.map((i) => (i.id === inv.id ? inv : i))
                  : [...state.inventory, inv],
              }));
            } else if (change.type === 'removed') {
              useShopStore.setState((state) => ({
                inventory: state.inventory.filter((i) => i.id !== inv.id),
              }));
            }
          });
        });
      } else {
        const shopRef = (db as any).collection('users').doc(userId).collection('shopItems');
        shopUnsub = shopRef.onSnapshot((snapshot: any) => {
          snapshot.docChanges().forEach((change: any) => {
            const item = { ...change.doc.data(), id: change.doc.id } as ShopItem;
            if (change.type === 'added' || change.type === 'modified') {
              useShopStore.setState((state) => ({
                items: state.items.some((i) => i.id === item.id)
                  ? state.items.map((i) => (i.id === item.id ? item : i))
                  : [...state.items, item],
              }));
            } else if (change.type === 'removed') {
              useShopStore.setState((state) => ({
                items: state.items.filter((i) => i.id !== item.id),
              }));
            }
          });
        });

        const inventoryRef = (db as any).collection('users').doc(userId).collection('inventory');
        inventoryUnsub = inventoryRef.onSnapshot((snapshot: any) => {
          snapshot.docChanges().forEach((change: any) => {
            const inv = { ...change.doc.data(), id: change.doc.id } as InventoryItem;
            if (change.type === 'added' || change.type === 'modified') {
              useShopStore.setState((state) => ({
                inventory: state.inventory.some((i) => i.id === inv.id)
                  ? state.inventory.map((i) => (i.id === inv.id ? inv : i))
                  : [...state.inventory, inv],
              }));
            } else if (change.type === 'removed') {
              useShopStore.setState((state) => ({
                inventory: state.inventory.filter((i) => i.id !== inv.id),
              }));
            }
          });
        });
      }

      _shopUnsubs = [shopUnsub, inventoryUnsub].filter(Boolean) as Array<() => void>;
    } catch (e) {
      console.warn('[shopStore] mountShopListeners failed:', e);
    }
  })();

  return () => unmountShopListeners();
}

export function unmountShopListeners(): void {
  // Invalidate any in-flight async setup by bumping the mount id
  _shopMountId++;
  _shopUnsubs.forEach((u) => u());
  _shopUnsubs = [];
}
