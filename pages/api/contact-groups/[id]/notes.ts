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

    const { id } = req.query;
    if (isNaN(Number(id))) {
        res.status(400).json({ message: "Invalid group ID" });
        return;
    }

    try {
        const notes = await doWithPrisma((prisma) =>
            prisma.contactNote.findMany({
                where: {
                    contact: { groupId: Number(id) },
                },
                include: {
                    contact: { select: { phoneNumber: true, firstName: true, lastName: true } },
                },
                orderBy: { createdAt: "desc" },
            })
        );

        res.status(200).json(notes || []);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
