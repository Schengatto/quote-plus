import doWithPrisma from "@/libs/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

type BulkPriceUpdate = {
    id: number;
    price: number;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "PUT") {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        const updates: BulkPriceUpdate[] = JSON.parse(req.body);

        if (!Array.isArray(updates) || updates.length === 0) {
            res.status(400).json({ message: "Invalid payload" });
            return;
        }

        await doWithPrisma(async (prisma) => {
            const promises = updates.map((u) =>
                prisma.product.update({
                    where: { id: u.id },
                    data: { price: u.price },
                })
            );
            await Promise.all(promises);
        });

        res.status(200).json({ updated: updates.length });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
