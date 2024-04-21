import doWithPrisma from "@/libs/prisma";
import { Contact } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
    message: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | Contact[] | Partial<Contact>>
) {
    const { id } = req.query;

    if (isNaN(Number(id)) || !req.method || !["PATCH", "DELETE", "GET"].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "PATCH") {
            const contact: Partial<Contact> = JSON.parse(req.body);
            const { id } = await doWithPrisma((prisma) =>
                prisma.contact.update({ where: { id: contact.id }, data: contact as any })
            );
            res.status(200).json({ id });
        } else if (req.method === "GET") {
            const contact = await doWithPrisma((prisma) => prisma.contact.findFirst({ where: { id: Number(id) } }));
            res.status(200).json(contact);
        } else if (req.method === "DELETE") {
            await doWithPrisma((prisma) => prisma.contact.delete({ where: { id: Number(id) } }));
            res.status(204).json({});
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
