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
    if (!req.method || !["GET", "POST"].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "POST") {
            const contact: Partial<Contact> = JSON.parse(req.body);
            const { id } = await doWithPrisma((prisma) => prisma.contact.create({ data: contact as any }));
            res.status(201).json({ id });
        } else {
            const contacts = await doWithPrisma((prisma) => prisma.contact.findMany({
                orderBy: {
                    firstName: "asc",
                },
            })) || [];
            res.status(200).json(contacts);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
