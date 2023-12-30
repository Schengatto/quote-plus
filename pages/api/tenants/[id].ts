import { getAuthUserFromRequest } from "@/libs/auth";
import doWithPrisma from "@/libs/prisma";
import { Tenant } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || !req.method || ![ "GET", "PATCH" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "GET") {
            const tenant = await doWithPrisma((prisma) => prisma.tenant.findFirst({ where: { id: String(id) } }));
            res.status(200).json(tenant);
        } else if (req.method === "PATCH") {
            const user = await getAuthUserFromRequest(req);
            if (user?.tenantId !== id) {
                res.status(401).json({ success: false, message: "authentication failed" });
            }

            const { placeholders }: Partial<Tenant> = JSON.parse(req.body);
            await doWithPrisma((prisma) =>
                prisma.tenant.update({ where: { id: String(id) }, data: { placeholders: placeholders ?? undefined } })
            );
            res.status(203).json({});
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
