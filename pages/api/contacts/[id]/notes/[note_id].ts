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
    const { id, note_id } = req.query;

    if (isNaN(Number(id)) || isNaN(Number(note_id)) || !req.method || ![ "PATCH", "DELETE" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "PATCH") {
            const note: Partial<ContactNote> = JSON.parse(req.body);
            const { id } = await doWithPrisma((prisma) =>
                prisma.contactNote.update({ where: { id: note.id }, data: note as any })
            );
            res.status(200).json({ id });
        } else if (req.method === "DELETE") {
            await doWithPrisma((prisma) => prisma.contactNote.delete({ where: { id: Number(note_id) } }));
            res.status(204).json({});
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
