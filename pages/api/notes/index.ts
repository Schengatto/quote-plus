import doWithPrisma from "@/libs/prisma";
import { Product } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
    message: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | Product[] | Partial<Product>>
) {
    if (!req.method || ![ "GET" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "GET") {
            const products = await doWithPrisma((prisma) =>
                prisma.contactNote.findMany({
                    include: {
                        contact: { select: { id: true, firstName: true, phoneNumber: true } }
                    }, orderBy: {
                        createdAt: "desc",
                    }
                })
            );
            res.status(200).json(products);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
