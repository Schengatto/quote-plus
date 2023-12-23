import doWithPrisma from "@/lib/prisma";
import { ResponseData } from "@/types/api";
import { User } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | User[] | Partial<User>>
) {
    if (!req.method || ![ "POST" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "POST") {
            const { username, password }: Partial<User> = JSON.parse(req.body);
            const user = await doWithPrisma((prisma) =>
                prisma.user.findFirstOrThrow({ where: { username, password } })
            );
            if (!user) {
                throw new Error("User not found");
            }
            res.status(200).json({ id: user.id, username: user.username, activeTemplateId: user.activeTemplateId });
        }
    } catch (error: any) {
        res.status(403).json({ message: error.message });
    }
}
