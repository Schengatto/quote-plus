import { Category } from "@prisma/client";

export interface CategoryApiModel extends Category {
    parent: { name: string }
    products: { id: number }[];
}