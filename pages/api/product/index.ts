import doWithPrisma from "@/libs/prisma";
import { Product } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
    message: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | Product[] | Partial<Product>>
) {
    if (!req.method || ![ "POST", "GET" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "POST") {
            const product: Partial<Product> = JSON.parse(req.body);
            const { id } = await doWithPrisma((prisma) => prisma.product.create({ data: product as any }));
            res.status(201).json({ id });
        } else if (req.method === "GET") {
            const filters = req.query;
            const products = await doWithPrisma((prisma) =>
                prisma.product.findMany({
                    where: { categoryId: filters?.categoryId ? Number(filters.categoryId) : undefined },
                    include: {
                        category: { select: { id: true, name: true, parent: { select: { id: true, name: true } } } },
                    },
                })
            );
            res.status(200).json(products);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
