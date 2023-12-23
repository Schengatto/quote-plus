import { Quote } from "@prisma/client";
import { create } from "zustand";

type QuotesStore = {
    selectedQuote: Partial<Quote> | null;
    setSelectedQuote: (quote: Partial<Quote> | null) => void;
};

export const useQuotesStore = create<QuotesStore>((set, get) => ({
    selectedQuote: null,
    setSelectedQuote: (quote: Partial<Quote> | null) => set({ selectedQuote: quote }),
}));
