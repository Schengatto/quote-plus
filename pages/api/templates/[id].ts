import { getAuthUserFromRequest } from "@/libs/auth";
import doWithPrisma from "@/libs/prisma";
import { Template } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (isNaN(Number(id)) || !req.method || ![ "DELETE", "PATCH" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "DELETE") {
            const user = await getAuthUserFromRequest(req);

            await doWithPrisma((prisma) => prisma.template.delete({ where: { id: Number(id), createdById: user?.id } }));
            res.status(204).json({});
        } else if (req.method === "PATCH") {
            const template: Partial<Template> = JSON.parse(req.body);
            const { id } = await doWithPrisma((prisma) =>
                prisma.template.update({ where: { id: template.id }, data: template as any })
            );
            res.status(200).json({ id });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
