import { verifyJwtToken } from "@/libs/auth";
import doWithPrisma from "@/libs/prisma";
import { AuthenticatedUser } from "@/types/api/user";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const id: number | undefined = req.query?.id ? Number(req.query.id) : Number(undefined);

    if (isNaN(id) || !req.method || ![ "DELETE", "PATCH", "GET" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "GET") {
            const user = await doWithPrisma((prisma) =>
                prisma.user.findFirstOrThrow({
                    where: { id: Number(id) },
                    include: { tenant: { select: { id: true } }, userRole: { select: { id: true, grants: true } } },
                })
            );
            res.status(200).json(user);
        } else if (req.method === "DELETE") {
            const { cookies } = req;
            const token = cookies["token"];
            const verifiedToken = token && (await verifyJwtToken(token));

            if ((verifiedToken as AuthenticatedUser).userRole.grants?.includes("delete-account")) {
                res.status(401).json({ message: "authentication failed" });
            }
            await doWithPrisma((prisma) => prisma.user.delete({ where: { id: Number(id) } }));
            res.status(204).json({});
        } else if (req.method === "PATCH") {
            const user = JSON.parse(req.body);

            const result = await doWithPrisma(
                async (prisma) =>
                    await prisma.user.update({
                        where: { id: id },
                        data: {
                            username: user.username,
                            password: user.password,
                            activeTemplateId: user.activeTemplateId,
                            extraData: user.extraData,
                        },
                    }),
                (error) => res.status(500).send({ message: error.message })
            );
            res.status(200).json({ ...result, password: undefined });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
