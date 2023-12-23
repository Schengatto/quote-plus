import { create } from "zustand";

type AppStore = {
    isLoading: boolean;
    setIsLoading: (_isLoading: boolean) => void;
};

export const useAppStore = create<AppStore>((set, get) => ({
    isLoading: false,
    setIsLoading: (_isLoading: boolean) => set({ isLoading: _isLoading }),
}));
