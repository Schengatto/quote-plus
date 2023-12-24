import doWithPrisma from "@/libs/prisma";
import { Category } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (isNaN(Number(id)) || !req.method || ![ "DELETE", "PATCH" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "DELETE") {
            const response = await doWithPrisma((prisma) => prisma.category.delete({ where: { id: Number(id) } }));
            if (!response?.id) {
                throw new Error("Error while deleting category. Operation reverted.");
            }
            res.status(204).json({});
        } else if (req.method === "PATCH") {
            const category: Partial<Category> = JSON.parse(req.body);
            const response = await doWithPrisma((prisma) =>
                prisma.category.update({ where: { id: category.id }, data: category as any })
            );
            if (!response?.id) {
                throw new Error("Error while deleting category. Operation reverted.");
            }
            res.status(200).json({ id: response.id });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
