import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  tableId: string | null;
  sessionId: string;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemNote: (itemId: string, note: string) => void;
  clearCart: () => void;
  setRestaurantAndTable: (restaurantId: string, tableId: string) => void;

  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// Create the store with persistence
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      tableId: null,
      sessionId: uuidv4(), // Generate a unique session ID

      // Add an item to the cart
      addItem: (item) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(i => i.itemId === item.itemId);

        if (existingItemIndex >= 0) {
          // Item already exists, update quantity
          const updatedItems = [...items];
          const existingItem = updatedItems[existingItemIndex];
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + (item.quantity || 1)
          };
          set({ items: updatedItems });
        } else {
          // Add new item
          set({ items: [...items, { ...item, quantity: item.quantity || 1 }] });
        }
      },

      // Remove an item from the cart
      removeItem: (itemId) => {
        const { items } = get();
        set({ items: items.filter(item => item.itemId !== itemId) });
      },

      // Update item quantity
      updateItemQuantity: (itemId, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          // Remove item if quantity is 0 or negative
          set({ items: items.filter(item => item.itemId !== itemId) });
        } else {
          // Update quantity
          set({
            items: items.map(item =>
              item.itemId === itemId ? { ...item, quantity } : item
            )
          });
        }
      },

      // Update item note
      updateItemNote: (itemId, note) => {
        const { items } = get();
        set({
          items: items.map(item =>
            item.itemId === itemId ? { ...item, note } : item
          )
        });
      },

      // Clear the cart
      clearCart: () => {
        set({ items: [] });
      },

      // Set restaurant and table IDs
      setRestaurantAndTable: (restaurantId, tableId) => {
        set({ restaurantId, tableId });
      },

      // Get total number of items in cart
      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      // Get total price of items in cart
      getTotalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
      }
    }),
    {
      name: 'cart-storage', // name of the item in localStorage
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
        tableId: state.tableId,
        sessionId: state.sessionId,
      }),
    }
  )
);

export default useCart;
