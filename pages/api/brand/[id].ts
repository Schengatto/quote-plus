import doWithPrisma from "@/lib/prisma";
import { Brand } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (isNaN(Number(id)) || !req.method || ![ "DELETE", "PATCH" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "DELETE") {
            await doWithPrisma((prisma) => prisma.brand.delete({ where: { id: Number(id) } }));
            res.status(204).json({});
        } else if (req.method === "PATCH") {
            const brand: Partial<Brand> = JSON.parse(req.body);
            const { id } = await doWithPrisma((prisma) =>
                prisma.brand.update({ where: { id: brand.id }, data: brand as any })
            );
            res.status(200).json({ id });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
