import { create } from 'zustand';

export const useUnibotStore = create((set) => ({
  isOpen: false,
  setIsOpen: (open) => set({ isOpen: open }),
  toggleIsOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
