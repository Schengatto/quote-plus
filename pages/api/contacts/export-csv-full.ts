import doWithPrisma from "@/libs/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        const csv = await buildContactsCsv();
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=contacts_${new Date().toISOString().slice(0, 10)}.csv`
        );
        res.status(200).send("\uFEFF" + csv);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

async function buildContactsCsv(): Promise<string> {
    const contacts = await doWithPrisma((prisma) =>
        prisma.contact.findMany({
            include: {
                group: { select: { name: true } },
            },
            orderBy: { phoneNumber: "asc" },
        })
    );

    const header = [
        "id", "phoneNumber", "firstName", "lastName", "company",
        "mobile", "mobile2", "home", "home2", "business", "business2",
        "email", "businessFax", "homeFax", "pager", "other",
        "whatsapp", "telegram", "label", "gruppo",
    ].join(";");

    const rows = contacts.map((c: any) => contactToCsvRow(c));
    return [ header, ...rows ].join("\n");
}

const CONTACT_CSV_FIELDS = [
    "phoneNumber", "firstName", "lastName", "company",
    "mobile", "mobile2", "home", "home2", "business", "business2",
    "email", "businessFax", "homeFax", "pager", "other",
    "whatsapp", "telegram", "label",
];

function contactToCsvRow(c: any): string {
    const fields = CONTACT_CSV_FIELDS.map((f) => escapeCsv(String(c[f] ?? "")));
    fields.push(escapeCsv(String(c.group?.name ?? "")));
    return [ c.id, ...fields ].join(";");
}

function escapeCsv(value: string): string {
    if (value.includes(";") || value.includes("\"") || value.includes("\n")) {
        return `"${value.replace(/"/g, "\"\"")}"`;
    }
    return value;
}
