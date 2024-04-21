import { getJwtSecretKey } from "@/libs/auth";
import doWithPrisma from "@/libs/prisma";
import { ErrorResponseData } from "@/types/api";
import { User } from "@prisma/client";
import { SignJWT } from "jose";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ErrorResponseData | User[] | Partial<User>>
) {
    if (!req.method || ![ "POST" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "POST") {
            const { username, password }: Partial<User> = JSON.parse(req.body);
            const userData = await doWithPrisma((prisma) =>
                prisma.user.findFirstOrThrow({
                    where: { username, password },
                    include: { tenant: { select: { id: true } }, userRole: { select: { id: true, grants: true } } },
                })
            );
            if (!userData) {
                throw new Error("User not found");
            }
            const token = await new SignJWT({ ...userData })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("12h")
                .sign(getJwtSecretKey());
            res.status(200);
            res.setHeader("Set-Cookie", `token=${token}; Path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT`);
            res.json({ ...userData, password: undefined });
        }
    } catch (error: any) {
        res.status(403).json({ message: error.message });
    }
}
