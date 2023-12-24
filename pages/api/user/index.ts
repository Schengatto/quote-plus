import doWithPrisma from "@/libs/prisma";
import { ResponseData } from "@/types/api";
import { User } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | User[] | Partial<User>>
) {
    if (!req.method || ![ "GET", "POST" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "POST") {
            const user: Partial<User> = JSON.parse(req.body);
            const { id } = await doWithPrisma((prisma) => prisma.product.create({ data: user as any }));
            res.status(201).json({ id });
        } else if (req.method === "GET") {
            const users = await doWithPrisma((prisma) => prisma.user.findMany({ select: { password: false } }));
            res.status(200).json(users);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
