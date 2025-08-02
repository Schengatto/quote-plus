import doWithPrisma from "@/libs/prisma";
import { Item } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (isNaN(Number(id)) || !req.method || !["DELETE", "PATCH", "GET"].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "GET") {
            const item = await doWithPrisma((prisma) => prisma.item.findUnique({ where: { id: Number(id) } }));
            res.status(200).json(item);
        } else if (req.method === "DELETE") {
            await doWithPrisma((prisma) => prisma.item.delete({ where: { id: Number(id) } }));
            res.status(204).json({});
        } else if (req.method === "PATCH") {
            const item: Partial<Item> = JSON.parse(req.body);
            const { id } = await doWithPrisma((prisma) =>
                prisma.item.update({ where: { id: item.id }, data: item as any })
            );
            res.status(200).json({ id });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
