import doWithPrisma from "@/libs/prisma";
import { Quote } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (isNaN(Number(id)) || !req.method || ![ "DELETE", "PATCH", "GET" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "GET") {
            const quote = await doWithPrisma((prisma) => prisma.quote.findUnique({ where: { id: Number(id) } }));
            res.status(200).json(quote);
        } else if (req.method === "DELETE") {
            await doWithPrisma((prisma) => prisma.quote.delete({ where: { id: Number(id) } }));
            res.status(204).json({});
        } else if (req.method === "PATCH") {
            const quote: Partial<Quote> = JSON.parse(req.body);
            const { id } = await doWithPrisma((prisma) =>
                prisma.quote.update({ where: { id: quote.id }, data: quote as any })
            );
            res.status(200).json({ id });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
