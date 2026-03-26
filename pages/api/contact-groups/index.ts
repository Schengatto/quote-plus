import doWithPrisma from "@/libs/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (!req.method || ![ "GET", "POST" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "POST") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
            const { name, company, label, createdBy, updatedBy } = body;

            if (!name?.trim()) {
                res.status(400).json({ message: "Nome gruppo obbligatorio" });
                return;
            }

            const created = await doWithPrisma((prisma) =>
                prisma.contactGroup.create({
                    data: {
                        name: name.trim(),
                        company: company || null,
                        label: label || "",
                        createdBy: createdBy || "system",
                        updatedBy: updatedBy || "system",
                    },
                })
            );
            res.status(201).json(created);
        } else {
            const groups = await doWithPrisma((prisma) =>
                prisma.contactGroup.findMany({
                    include: { contacts: true },
                    orderBy: { name: "asc" },
                })
            );
            res.status(200).json(groups || []);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
