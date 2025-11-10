import { create } from 'zustand'

export const useUIStore = create((set) => ({
  // Cart drawer state
  isCartOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

  // Checkout wizard state
  checkoutStep: 1,
  setCheckoutStep: (step) => set({ checkoutStep: step }),
  nextCheckoutStep: () => set((state) => ({ checkoutStep: state.checkoutStep + 1 })),
  prevCheckoutStep: () =>
    set((state) => ({ checkoutStep: Math.max(1, state.checkoutStep - 1) })),
  resetCheckout: () => set({ checkoutStep: 1 }),

  // Promo code state
  promoCode: null,
  setPromoCode: (code) => set({ promoCode: code }),
  clearPromoCode: () => set({ promoCode: null }),

  // Notification queue (can be extended for toast management)
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id: Date.now() }],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}))

export default useUIStore

