import { getAuthUserFromRequest } from "@/libs/auth";
import doWithPrisma from "@/libs/prisma";
import { ErrorResponseData } from "@/types/api";
import { User } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ErrorResponseData | User[] | Partial<User>>
) {
    if (!req.method || !["GET", "POST"].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        const authUser = await getAuthUserFromRequest(req);

        if (req.method === "POST") {
            const { username, password, userRoleId }: Partial<User> = JSON.parse(req.body);
            const newUserData: Partial<User> = {
                username,
                password,
                userRoleId,
                tenantId: authUser?.tenantId,
                extraData: {},
                activeTemplateId: null,
            };
            const result = await doWithPrisma(
                (prisma) => prisma.user.create({ data: newUserData as any }),
                (error) => res.status(500).send({ message: error.message })
            );
            res.status(201).json({ id: result.id });
        } else if (req.method === "GET") {
            const users = await doWithPrisma(
                (prisma) =>
                    prisma.user.findMany({
                        where: { tenantId: authUser?.tenantId },
                        select: { username: true, id: true, password: false, userRole: true },
                        orderBy: { username: "asc" },
                    }),
                (error) => res.status(500).send({ message: error.message })
            );
            res.status(200).json(users);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
