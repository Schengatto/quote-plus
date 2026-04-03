import doWithPrisma from "@/libs/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        const q = (req.query.q as string || "").trim();

        const results = await doWithPrisma((prisma) =>
            prisma.contactGroup.findMany({
                where: q ? {
                    OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { company: { contains: q, mode: "insensitive" } },
                    ],
                } : undefined,
                take: 20,
                orderBy: { name: "asc" },
            })
        );

        res.status(200).json({ results: results || [] });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
