import { Product } from "@prisma/client";
import { create } from "zustand";

type ProductsStore = {
    selectedProduct: Partial<Product> | null;
    setSelectedProduct: (quote: Partial<Product> | null) => void;
};

export const useProductsStore = create<ProductsStore>((set, get) => ({
    selectedProduct: null,
    setSelectedProduct: (product: Partial<Product> | null) => set({ selectedProduct: product }),
}));
