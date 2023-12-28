import doWithPrisma from "@/libs/prisma";
import { Brand } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
    message: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | Brand[] | Partial<Brand>>
) {
    if (!req.method || ![ "POST", "GET" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "POST") {
            const data: Brand = JSON.parse(req.body);
            const { id } = await doWithPrisma((prisma) => prisma.brand.create({ data }));
            res.status(201).json({ id });
        } else if (req.method === "GET") {
            const brands = await doWithPrisma((prisma) =>
                prisma.brand.findMany({
                    include: { products: { select: { id: true } } },
                    orderBy: { name : "asc" },
                })
            );
            res.status(200).json(brands);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
