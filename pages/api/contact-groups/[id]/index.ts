import doWithPrisma from "@/libs/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const id = Number(req.query.id);

    if (!id || isNaN(id)) {
        res.status(400).json({ message: "Invalid ID" });
        return;
    }

    if (!req.method || !["PATCH", "DELETE"].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "PATCH") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
            const { name, company, label } = body;

            const updated = await doWithPrisma((prisma) =>
                prisma.contactGroup.update({
                    where: { id },
                    data: {
                        ...(name !== undefined && { name: name.trim() }),
                        ...(company !== undefined && { company }),
                        ...(label !== undefined && { label }),
                        updatedBy: body.updatedBy || "system",
                    },
                })
            );
            res.status(200).json(updated);
        } else {
            await doWithPrisma(async (prisma) => {
                await prisma.contact.updateMany({
                    where: { groupId: id },
                    data: { groupId: null },
                });
                await prisma.contactGroup.delete({ where: { id } });
            });
            res.status(200).json({ message: "Group deleted" });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
