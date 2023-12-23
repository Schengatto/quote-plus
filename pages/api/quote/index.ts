import doWithPrisma from "@/lib/prisma";
import { Quote } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
    message: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | Quote[] | Partial<Quote>>
) {
    if (!req.method || ![ "POST", "GET" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "POST") {
            const quote: Partial<Quote> = JSON.parse(req.body);
            const { id } = await doWithPrisma((prisma) => prisma.quote.create({ data: quote as any }));
            res.status(201).json({ id });
        } else if (req.method === "GET") {
            const quotes = await doWithPrisma((prisma) => prisma.quote.findMany({}));
            res.status(200).json(quotes);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
