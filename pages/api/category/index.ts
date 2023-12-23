import doWithPrisma from "@/lib/prisma";
import { Category } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
    message: string;
};

type CreateRequestBody = Pick<Category, "name" | "parentId" | "createdById">;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | Category[] | Partial<Category>>
) {
    if (!req.method || ![ "POST", "GET" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "POST") {
            const { name, parentId, createdById }: CreateRequestBody = JSON.parse(req.body);
            const brand = await doWithPrisma((prisma) =>
                prisma.category.create({ data: { name, parentId, createdById } })
            );
            res.status(201).json({ id: brand?.id });
        } else if (req.method === "GET") {
            const categories = await doWithPrisma((prisma) =>
                prisma.category.findMany({
                    include: {
                        parent: { select: { id: true, name: true } },
                        products: { select: { id: true } },
                    },
                    orderBy: {
                        parentId: "asc",
                    },
                })
            );
            res.status(200).json(categories);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
