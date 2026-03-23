import doWithPrisma from "@/libs/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: "2mb",
        },
    },
};

type CsvRow = {
    id: number;
    price: number;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        const { csv } = JSON.parse(req.body);

        if (!csv || typeof csv !== "string") {
            res.status(400).json({ message: "Missing CSV data" });
            return;
        }

        const lines = csv
            .replace(/^\uFEFF/, "")
            .split("\n")
            .map((l: string) => l.trim())
            .filter((l: string) => l.length > 0);

        if (lines.length < 2) {
            res.status(400).json({ message: "CSV file is empty or has no data rows" });
            return;
        }

        // Skip header row
        const dataLines = lines.slice(1);
        const updates: CsvRow[] = [];
        const errors: string[] = [];

        for (let i = 0; i < dataLines.length; i++) {
            const parts = parseCsvLine(dataLines[i]);
            const id = parseInt(parts[0], 10);
            const price = parseFloat(parts[4]?.replace(",", "."));

            if (isNaN(id)) {
                errors.push(`Riga ${i + 2}: ID non valido`);
                continue;
            }
            if (isNaN(price) || price < 0) {
                errors.push(`Riga ${i + 2}: prezzo non valido`);
                continue;
            }

            updates.push({ id, price });
        }

        if (errors.length > 0) {
            res.status(400).json({ message: errors.join("\n"), errors });
            return;
        }

        await doWithPrisma(async (prisma) => {
            const promises = updates.map((u) =>
                prisma.product.update({
                    where: { id: u.id },
                    data: { price: u.price },
                })
            );
            await Promise.all(promises);
        });

        res.status(200).json({ updated: updates.length });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === "\"" && line[i + 1] === "\"") {
                current += "\"";
                i++;
            } else if (char === "\"") {
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === "\"") {
                inQuotes = true;
            } else if (char === ";") {
                result.push(current);
                current = "";
            } else {
                current += char;
            }
        }
    }
    result.push(current);
    return result;
}
