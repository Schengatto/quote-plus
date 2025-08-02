import doWithPrisma from "@/libs/prisma";
import { Item } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
    message: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | Item[] | Partial<Item>>
) {
    if (!req.method || !["POST", "GET"].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "POST") {
            const item: Partial<Item> = JSON.parse(req.body);
            const newItem = await doWithPrisma((prisma) => prisma.item.create({ data: item as any }));

            res.status(201).json(newItem);
        } else if (req.method === "GET") {
            const filters = req.query;
            const orderBy = req.query.orderBy as unknown as string ?? "date";
            const products = await doWithPrisma((prisma) =>
                prisma.item.findMany({
                    where: {
                        code: filters?.code && String(filters.code),
                        dealer: filters?.dealer && String(filters.dealer),
                        reference: filters?.reference && String(filters.reference)
                    },
                    orderBy: { [orderBy]: "desc" },
                })
            );
            res.status(200).json(products);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
