import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setCredentials: ({ user, token }) =>
        set((state) => {
          const nextUser = user ?? state.user
          const nextToken = token ?? state.token
          return {
            user: nextUser,
            token: nextToken,
            isAuthenticated: Boolean(nextToken),
          }
        }),
      updateUser: (user) =>
        set((state) => ({
          user: { ...state.user, ...user },
        })),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'bookstore-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

export const authStore = {
  getState: () => useAuthStore.getState(),
}

