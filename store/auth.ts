import { User } from "@prisma/client";
import { create } from "zustand";

type AuthStore = {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    isLoggedIn: () => boolean;
    getUsername: () => string;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    login: (user: User) => set({ user }),
    logout: () => set({ user: null }),
    isLoggedIn: () => !!get().user,
    getUsername: () => get().user?.username || "",
}));
