import { Brand } from "@prisma/client";

export interface BrandApiModel extends Brand {
    products: { id: number }[];
}