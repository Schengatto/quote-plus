import doWithPrisma from "@/lib/prisma";
import { Template } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
    message: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | Template[] | Partial<Template>>
) {
    if (!req.method || ![ "POST", "GET" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "POST") {
            const data: Template = JSON.parse(req.body);
            const { id } = await doWithPrisma((prisma) => prisma.template.create({ data }));
            res.status(201).json({ id });
        } else if (req.method === "GET") {
            const filters = req.query;
            if (!filters.userId) {
                throw new Error("Invalid user");
            }
            const templates = await doWithPrisma((prisma) =>
                prisma.template.findMany({ where: { createdById: Number(filters.userId) } })
            );
            res.status(200).json(templates);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
