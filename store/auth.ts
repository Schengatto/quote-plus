import { AuthenticatedUser } from "@/types/api/user";
import { create } from "zustand";

type AuthStore = {
    user: AuthenticatedUser | null;
    login: (user: AuthenticatedUser) => void;
    logout: () => void;
    isLoggedIn: () => boolean;
    getUsername: () => string;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    login: (user: AuthenticatedUser) => set({ user }),
    logout: () => set({ user: null }),
    isLoggedIn: () => !!get().user,
    getUsername: () => get().user?.username || "",
}));
