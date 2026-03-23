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
        const products = await doWithPrisma((prisma) =>
            prisma.product.findMany({
                select: {
                    id: true,
                    code: true,
                    name: true,
                    price: true,
                    category: {
                        select: {
                            name: true,
                            parent: { select: { name: true } },
                        },
                    },
                },
                orderBy: { code: "asc" },
            })
        );

        const header = "id;codice;nome;categoria;prezzo";
        const rows = products.map((p: any) => {
            const categoryLabel = p.category.parent
                ? `${p.category.parent.name} » ${p.category.name}`
                : p.category.name;
            return `${p.id};${escapeCsv(p.code)};${escapeCsv(p.name)};${escapeCsv(categoryLabel)};${p.price}`;
        });

        const csv = [ header, ...rows ].join("\n");

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=products_${new Date().toISOString().slice(0, 10)}.csv`);
        res.status(200).send("\uFEFF" + csv);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

function escapeCsv(value: string): string {
    if (value.includes(";") || value.includes("\"") || value.includes("\n")) {
        return `"${value.replace(/"/g, "\"\"")}"`;
    }
    return value;
}
