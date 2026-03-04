import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { ShopItem, InventoryItem } from '../types';
import { useCharacterStore } from './characterStore';

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
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      items: [],
      inventory: [],

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
      },

      updateItem: (id, input) => {
        set((s) => ({
          items: s.items.map((item) =>
            item.id === id ? { ...item, ...input } : item
          ),
        }));
      },

      deleteItem: (id) => {
        set((s) => ({ items: s.items.filter((item) => item.id !== id) }));
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
        if (item.quantity !== null) {
          const newQty = item.quantity - 1;
          if (newQty <= 0) {
            newItems = items.filter((i) => i.id !== id);
          } else {
            newItems = items.map((i) =>
              i.id === id ? { ...i, quantity: newQty } : i
            );
          }
        }

        const existing = inventory.find((inv) => inv.name === item.name);
        let newInventory: InventoryItem[];
        if (existing) {
          newInventory = inventory.map((inv) =>
            inv.name === item.name
              ? { ...inv, quantity: inv.quantity + 1, lastAcquiredAt: now }
              : inv
          );
        } else {
          newInventory = [
            ...inventory,
            {
              id: uuidv4(),
              name: item.name,
              quantity: 1,
              energyEffect: item.energyEffect,
              hydrationEffect: item.hydrationEffect,
              lastAcquiredAt: now,
            },
          ];
        }

        set({ items: newItems, inventory: newInventory });
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

        set((s) => {
          const inv = s.inventory.find((i) => i.id === id);
          if (!inv) return s;
          if (inv.quantity <= 1) {
            return { inventory: s.inventory.filter((i) => i.id !== id) };
          }
          return {
            inventory: s.inventory.map((i) =>
              i.id === id ? { ...i, quantity: i.quantity - 1 } : i
            ),
          };
        });
      },
    }),
    {
      name: 'liferpg-shop',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
