import doWithPrisma from "@/libs/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: "4mb",
        },
    },
};

type CsvProductRow = {
    rowNumber: number;
    id: number | null;
    code: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    description: string;
    tags: string;
    currency: string;
};

type ValidationResult = {
    valid: boolean;
    totalRows: number;
    toCreate: number;
    toUpdate: number;
    newBrands: string[];
    newCategories: string[];
    errors: string[];
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
        const body = JSON.parse(req.body);
        const { csv, mode, createdById } = body;

        if (!csv || typeof csv !== "string") {
            res.status(400).json({ message: "Missing CSV data" });
            return;
        }

        if (!mode || !["validate", "execute"].includes(mode)) {
            res.status(400).json({ message: "Missing or invalid mode (validate | execute)" });
            return;
        }

        const lines = csv
            .replace(/^\uFEFF/, "")
            .split("\n")
            .map((l: string) => l.trim())
            .filter((l: string) => l.length > 0);

        if (lines.length < 2) {
            res.status(400).json({ message: "Il file CSV è vuoto o non contiene righe di dati" });
            return;
        }

        const dataLines = lines.slice(1);
        const rows: CsvProductRow[] = [];
        const parseErrors: string[] = [];

        for (let i = 0; i < dataLines.length; i++) {
            const parts = parseCsvLine(dataLines[i]);
            const rowNum = i + 2;

            const idRaw = parts[0]?.trim();
            const code = parts[1]?.trim();
            const name = parts[2]?.trim();
            const brand = parts[3]?.trim();
            const category = parts[4]?.trim();
            const priceRaw = parts[5]?.trim().replace(",", ".");
            const description = parts[6]?.trim() || "";
            const tags = parts[7]?.trim() || "";
            const currency = parts[8]?.trim() || "";

            if (!code) {
                parseErrors.push(`Riga ${rowNum}: codice mancante`);
                continue;
            }
            if (!name) {
                parseErrors.push(`Riga ${rowNum}: nome mancante`);
                continue;
            }
            if (!brand) {
                parseErrors.push(`Riga ${rowNum}: brand mancante`);
                continue;
            }
            if (!category) {
                parseErrors.push(`Riga ${rowNum}: categoria mancante`);
                continue;
            }

            const price = parseFloat(priceRaw);
            if (isNaN(price) || price < 0) {
                parseErrors.push(`Riga ${rowNum}: prezzo non valido "${parts[5]}"`);
                continue;
            }

            const id = idRaw ? parseInt(idRaw, 10) : null;
            if (idRaw && isNaN(id as number)) {
                parseErrors.push(`Riga ${rowNum}: ID non valido "${idRaw}"`);
                continue;
            }

            rows.push({
                rowNumber: rowNum,
                id,
                code,
                name,
                brand,
                category,
                price,
                description: description || name,
                tags,
                currency,
            });
        }

        if (parseErrors.length > 0 && rows.length === 0) {
            res.status(400).json({ message: parseErrors.join("\n"), errors: parseErrors });
            return;
        }

        // Resolve against DB
        const result = await doWithPrisma(async (prisma) => {
            // Fetch existing data
            const existingProducts = await prisma.product.findMany({
                select: { id: true, code: true },
            });
            const existingBrands = await prisma.brand.findMany({
                select: { id: true, name: true },
            });
            const existingCategories = await prisma.category.findMany({
                select: { id: true, name: true, parentId: true, parent: { select: { name: true } } },
            });
            const existingCurrencies = await prisma.currency.findMany({
                select: { id: true, name: true },
            });

            const existingProductIds = new Set(existingProducts.map((p: any) => p.id));
            const existingProductCodes = new Set(existingProducts.map((p: any) => p.code));

            const brandMap = new Map(existingBrands.map((b: any) => [b.name.toLowerCase(), b.id]));
            const currencyMap = new Map(existingCurrencies.map((c: any) => [c.name.toLowerCase(), c.id]));

            // Build category lookup: "Parent » Child" or just "Name"
            const categoryMap = new Map<string, number>();
            for (const cat of existingCategories) {
                const c = cat as any;
                if (c.parent) {
                    categoryMap.set(`${c.parent.name} » ${c.name}`.toLowerCase(), c.id);
                }
                categoryMap.set(c.name.toLowerCase(), c.id);
            }

            const errors: string[] = [...parseErrors];
            const toCreate: CsvProductRow[] = [];
            const toUpdate: CsvProductRow[] = [];
            const newBrandsSet = new Set<string>();
            const newCategoriesSet = new Set<string>();
            const seenCodes = new Set<string>();

            // Default currency: first enabled or first available
            const defaultCurrency = await prisma.currency.findFirst({
                where: { isEnabled: true },
                select: { id: true, name: true },
            }) || existingCurrencies[0];

            for (const row of rows) {
                // Check duplicate codes within the file
                if (seenCodes.has(row.code.toLowerCase())) {
                    errors.push(`Riga ${row.rowNumber}: codice "${row.code}" duplicato nel file`);
                    continue;
                }
                seenCodes.add(row.code.toLowerCase());

                // Determine create vs update
                if (row.id !== null) {
                    if (!existingProductIds.has(row.id)) {
                        errors.push(`Riga ${row.rowNumber}: ID ${row.id} non esiste nel database`);
                        continue;
                    }
                    toUpdate.push(row);
                } else {
                    if (existingProductCodes.has(row.code)) {
                        errors.push(`Riga ${row.rowNumber}: codice "${row.code}" esiste già nel database (usa l'ID per aggiornare)`);
                        continue;
                    }
                    toCreate.push(row);
                }

                // Check brand
                if (!brandMap.has(row.brand.toLowerCase())) {
                    newBrandsSet.add(row.brand);
                }

                // Check category
                if (!categoryMap.has(row.category.toLowerCase())) {
                    newCategoriesSet.add(row.category);
                }

                // Check currency (if provided)
                if (row.currency && !currencyMap.has(row.currency.toLowerCase()) && defaultCurrency) {
                    errors.push(`Riga ${row.rowNumber}: valuta "${row.currency}" non trovata, verrà usata "${defaultCurrency.name}"`);
                }
            }

            const newBrands = Array.from(newBrandsSet);
            const newCategories = Array.from(newCategoriesSet);

            if (mode === "validate") {
                const validation: ValidationResult = {
                    valid: errors.filter((e) => !e.includes("verrà usata")).length === 0,
                    totalRows: rows.length,
                    toCreate: toCreate.length,
                    toUpdate: toUpdate.length,
                    newBrands,
                    newCategories,
                    errors,
                };
                return { type: "validation", data: validation };
            }

            // --- EXECUTE MODE ---
            const blockingErrors = errors.filter((e) => !e.includes("verrà usata"));
            if (blockingErrors.length > 0) {
                return {
                    type: "error",
                    data: { message: blockingErrors.join("\n"), errors: blockingErrors },
                };
            }

            const userIdForCreation = createdById || 0;

            // Create missing brands
            for (const brandName of newBrands) {
                const created = await prisma.brand.create({
                    data: { name: brandName, createdById: userIdForCreation },
                });
                brandMap.set(brandName.toLowerCase(), created.id);
            }

            // Create missing categories
            for (const catLabel of newCategories) {
                const catId = await resolveOrCreateCategory(
                    prisma,
                    catLabel,
                    categoryMap,
                    userIdForCreation
                );
                categoryMap.set(catLabel.toLowerCase(), catId);
            }

            // Resolve currency helper
            const resolveCurrencyId = (currencyName: string): number => {
                if (currencyName && currencyMap.has(currencyName.toLowerCase())) {
                    return currencyMap.get(currencyName.toLowerCase())!;
                }
                return defaultCurrency?.id || 1;
            };

            // Create new products
            let createdCount = 0;
            for (const row of toCreate) {
                const brandId = brandMap.get(row.brand.toLowerCase())!;
                const categoryId = categoryMap.get(row.category.toLowerCase())!;
                const currencyId = resolveCurrencyId(row.currency);

                await prisma.product.create({
                    data: {
                        code: row.code,
                        name: row.name,
                        description: row.description,
                        price: row.price,
                        tags: row.tags,
                        brandId,
                        categoryId,
                        currencyId,
                        createdById: userIdForCreation,
                    },
                });
                createdCount++;
            }

            // Update existing products
            let updatedCount = 0;
            for (const row of toUpdate) {
                const brandId = brandMap.get(row.brand.toLowerCase())!;
                const categoryId = categoryMap.get(row.category.toLowerCase())!;
                const currencyId = resolveCurrencyId(row.currency);

                await prisma.product.update({
                    where: { id: row.id! },
                    data: {
                        code: row.code,
                        name: row.name,
                        description: row.description,
                        price: row.price,
                        tags: row.tags,
                        brandId,
                        categoryId,
                        currencyId,
                    },
                });
                updatedCount++;
            }

            return {
                type: "success",
                data: {
                    created: createdCount,
                    updated: updatedCount,
                    newBrands,
                    newCategories,
                },
            };
        });

        if (result.type === "error") {
            res.status(400).json(result.data);
        } else {
            res.status(200).json(result.data);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

async function resolveOrCreateCategory(
    prisma: any,
    categoryLabel: string,
    categoryMap: Map<string, number>,
    createdById: number
): Promise<number> {
    // Check if already resolved during this run
    if (categoryMap.has(categoryLabel.toLowerCase())) {
        return categoryMap.get(categoryLabel.toLowerCase())!;
    }

    const separator = " » ";
    if (categoryLabel.includes(separator)) {
        const parts = categoryLabel.split(separator);
        const parentName = parts[0].trim();
        const childName = parts[1].trim();

        // Resolve or create parent
        let parentId: number;
        if (categoryMap.has(parentName.toLowerCase())) {
            parentId = categoryMap.get(parentName.toLowerCase())!;
        } else {
            const existingParent = await prisma.category.findFirst({
                where: { name: { equals: parentName, mode: "insensitive" } },
            });
            if (existingParent) {
                parentId = existingParent.id;
            } else {
                const created = await prisma.category.create({
                    data: { name: parentName, createdById },
                });
                parentId = created.id;
            }
            categoryMap.set(parentName.toLowerCase(), parentId);
        }

        // Create child under parent
        const existingChild = await prisma.category.findFirst({
            where: {
                name: { equals: childName, mode: "insensitive" },
                parentId,
            },
        });
        if (existingChild) {
            categoryMap.set(categoryLabel.toLowerCase(), existingChild.id);
            return existingChild.id;
        }

        const createdChild = await prisma.category.create({
            data: { name: childName, parentId, createdById },
        });
        categoryMap.set(categoryLabel.toLowerCase(), createdChild.id);
        return createdChild.id;
    }

    // Simple category (no parent)
    const existing = await prisma.category.findFirst({
        where: { name: { equals: categoryLabel, mode: "insensitive" } },
    });
    if (existing) {
        categoryMap.set(categoryLabel.toLowerCase(), existing.id);
        return existing.id;
    }

    const created = await prisma.category.create({
        data: { name: categoryLabel, createdById },
    });
    categoryMap.set(categoryLabel.toLowerCase(), created.id);
    return created.id;
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
