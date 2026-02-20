import { create } from "zustand";

export const useUIStore = create((set) => ({
  // UI state
  sidebarOpen: false,

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
