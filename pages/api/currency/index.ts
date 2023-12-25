import doWithPrisma from "@/libs/prisma";
import { ErrorResponseData } from "@/types/api";
import { Currency } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ErrorResponseData | Currency[] | Partial<Currency>>
) {
    if (!req.method || ![ "GET" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "GET") {
            const currencies = await doWithPrisma((prisma) => prisma.currency.findMany({}));
            res.status(200).json(currencies);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
