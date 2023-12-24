import { DialogProps } from "@/components/Dialog";
import { create } from "zustand";

type AppStore = {
    isLoading: boolean;
    setIsLoading: (_isLoading: boolean) => void;
    dialog: DialogProps | null;
    setDialog: (dialog: DialogProps | null) => void;
};

export const useAppStore = create<AppStore>((set, get) => ({
    isLoading: false,
    setIsLoading: (_isLoading: boolean) => set({ isLoading: _isLoading }),
    dialog: null,
    setDialog: (dialog: DialogProps | null) => set({ dialog }),
}));
