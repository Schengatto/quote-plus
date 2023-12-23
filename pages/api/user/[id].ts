import doWithPrisma from "@/lib/prisma";
import { User } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (isNaN(Number(id)) || !req.method || ![ "DELETE", "PATCH", "GET" ].includes(req.method)) {
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
            await doWithPrisma((prisma) => prisma.user.delete({ where: { id: Number(id) } }));
            res.status(204).json({});
        } else if (req.method === "PATCH") {
            const user: Partial<User> = JSON.parse(req.body);
            const { id } = await doWithPrisma((prisma) =>
                prisma.user.update({ where: { id: user.id }, data: user as any })
            );
            res.status(200).json({ id });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
