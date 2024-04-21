import doWithPrisma from "@/libs/prisma";
import { ContactNote } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
    message: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | ContactNote[] | Partial<ContactNote>>
) {
    const { id } = req.query;

    if (isNaN(Number(id)) || !req.method || !["GET", "POST"].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "POST") {
            const contactNote: Partial<ContactNote> = JSON.parse(req.body);
            console.log(req.body)
            const { id } = await doWithPrisma((prisma) => prisma.contactNote.create({ data: contactNote as any }));
            res.status(201).json({ id });
        } else if (req.method === "GET") {
            const contacts = await doWithPrisma((prisma) => prisma.contactNote.findMany({
                where: { contactId: Number(id) },
                orderBy: {
                    createdAt: "desc",
                },
            })) || [];
            res.status(200).json(contacts);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
