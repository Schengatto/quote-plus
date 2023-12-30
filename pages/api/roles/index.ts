import doWithPrisma from "@/libs/prisma";
import { ErrorResponseData } from "@/types/api";
import { User } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ErrorResponseData | User[] | Partial<User>>
) {
    if (!req.method || ![ "GET" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "GET") {
            const roles = await doWithPrisma((prisma) => prisma.userRole.findMany());
            res.status(200).json(roles);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
