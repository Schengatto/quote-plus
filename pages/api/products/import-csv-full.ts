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
        const input = validateProductImportInput(req.body);
        if (input.error) {
            res.status(400).json({ message: input.error });
            return;
        }

        const { csv, mode, createdById } = input;
        const { rows, errors: parseErrors } = parseCsvProductRows(csv!);

        if (parseErrors.length > 0 && rows.length === 0) {
            res.status(400).json({ message: parseErrors.join("\n"), errors: parseErrors });
            return;
        }

        const result = await processProductImport(rows, parseErrors, mode!, createdById);

        if (result.type === "error") {
            res.status(400).json(result.data);
        } else {
            res.status(200).json(result.data);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

function validateProductImportInput(rawBody: string): {
    csv?: string[]; mode?: string; createdById?: number; error?: string
} {
    const body = JSON.parse(rawBody);
    const { csv, mode, createdById } = body;

    if (!csv || typeof csv !== "string") {
        return { error: "Missing CSV data" };
    }
    if (!mode || ![ "validate", "execute" ].includes(mode)) {
        return { error: "Missing or invalid mode (validate | execute)" };
    }

    const dataLines = extractDataLines(csv);
    if (!dataLines) {
        return { error: "Il file CSV è vuoto o non contiene righe di dati" };
    }

    return { csv: dataLines, mode, createdById };
}

async function processProductImport(
    rows: CsvProductRow[],
    parseErrors: string[],
    mode: string,
    createdById?: number
) {
    return doWithPrisma(async (prisma) => {
        const classified = await classifyProductRows(rows, parseErrors, prisma);

        if (mode === "validate") {
            const validation: ValidationResult = {
                valid: classified.errors.filter((e) => !e.includes("verrà usata")).length === 0,
                totalRows: rows.length,
                toCreate: classified.toCreate.length,
                toUpdate: classified.toUpdate.length,
                newBrands: classified.newBrands,
                newCategories: classified.newCategories,
                errors: classified.errors,
            };
            return { type: "validation" as const, data: validation };
        }

        const blockingErrors = classified.errors.filter((e) => !e.includes("verrà usata"));
        if (blockingErrors.length > 0) {
            return {
                type: "error" as const,
                data: { message: blockingErrors.join("\n"), errors: blockingErrors },
            };
        }

        const importResult = await executeProductImport(
            prisma, classified, createdById || 0
        );
        return { type: "success" as const, data: importResult };
    });
}

function extractDataLines(csv: string): string[] | null {
    const lines = csv
        .replace(/^\uFEFF/, "")
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);

    if (lines.length < 2) return null;
    return lines.slice(1);
}

function parseCsvProductRows(dataLines: string[]): { rows: CsvProductRow[]; errors: string[] } {
    const rows: CsvProductRow[] = [];
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
        const parts = parseCsvLine(dataLines[i]);
        const rowNum = i + 2;
        const parsed = parseProductRow(parts, rowNum);

        if (parsed.error) {
            errors.push(parsed.error);
        } else {
            rows.push(parsed.row!);
        }
    }

    return { rows, errors };
}

function parseProductRow(
    parts: string[], rowNum: number
): { row?: CsvProductRow; error?: string } {
    const idRaw = parts[0]?.trim();
    const code = parts[1]?.trim();
    const name = parts[2]?.trim();
    const brand = parts[3]?.trim();
    const category = parts[4]?.trim();
    const priceRaw = parts[5]?.trim().replace(",", ".");
    const description = parts[6]?.trim() || "";
    const tags = parts[7]?.trim() || "";
    const currency = parts[8]?.trim() || "";

    if (!code) return { error: `Riga ${rowNum}: codice mancante` };
    if (!name) return { error: `Riga ${rowNum}: nome mancante` };
    if (!brand) return { error: `Riga ${rowNum}: brand mancante` };
    if (!category) return { error: `Riga ${rowNum}: categoria mancante` };

    const price = parseFloat(priceRaw);
    if (isNaN(price) || price < 0) {
        return { error: `Riga ${rowNum}: prezzo non valido "${parts[5]}"` };
    }

    const id = idRaw ? parseInt(idRaw, 10) : null;
    if (idRaw && isNaN(id as number)) {
        return { error: `Riga ${rowNum}: ID non valido "${idRaw}"` };
    }

    return {
        row: {
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
        },
    };
}

type ClassifiedProductRows = {
    toCreate: CsvProductRow[];
    toUpdate: CsvProductRow[];
    errors: string[];
    newBrands: string[];
    newCategories: string[];
    brandMap: Map<string, number>;
    categoryMap: Map<string, number>;
    currencyMap: Map<string, number>;
    defaultCurrency: any;
};

async function classifyProductRows(
    rows: CsvProductRow[],
    parseErrors: string[],
    prisma: any
): Promise<ClassifiedProductRows> {
    const lookups = await fetchProductLookups(prisma);

    const errors: string[] = [ ...parseErrors ];
    const toCreate: CsvProductRow[] = [];
    const toUpdate: CsvProductRow[] = [];
    const newBrandsSet = new Set<string>();
    const newCategoriesSet = new Set<string>();
    const seenCodes = new Set<string>();

    for (const row of rows) {
        const result = classifySingleProductRow(row, seenCodes, lookups);
        if (result.error) {
            errors.push(result.error);
            continue;
        }
        if (result.action === "create") toCreate.push(row);
        else toUpdate.push(row);
        if (result.warnings) errors.push(...result.warnings);
        if (!lookups.brandMap.has(row.brand.toLowerCase())) newBrandsSet.add(row.brand);
        if (!lookups.categoryMap.has(row.category.toLowerCase())) newCategoriesSet.add(row.category);
    }

    return {
        toCreate,
        toUpdate,
        errors,
        newBrands: Array.from(newBrandsSet),
        newCategories: Array.from(newCategoriesSet),
        brandMap: lookups.brandMap,
        categoryMap: lookups.categoryMap,
        currencyMap: lookups.currencyMap,
        defaultCurrency: lookups.defaultCurrency,
    };
}

type ProductLookups = {
    existingProductIds: Set<number>;
    existingProductCodes: Set<string>;
    brandMap: Map<string, number>;
    categoryMap: Map<string, number>;
    currencyMap: Map<string, number>;
    defaultCurrency: any;
};

async function fetchProductLookups(prisma: any): Promise<ProductLookups> {
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

    const categoryMap = new Map<string, number>();
    for (const cat of existingCategories) {
        const c = cat as any;
        if (c.parent) {
            categoryMap.set(`${c.parent.name} » ${c.name}`.toLowerCase(), c.id);
        }
        categoryMap.set(c.name.toLowerCase(), c.id);
    }

    const defaultCurrency = await prisma.currency.findFirst({
        where: { isEnabled: true },
        select: { id: true, name: true },
    }) || existingCurrencies[0];

    return {
        existingProductIds: new Set(existingProducts.map((p: any) => p.id)),
        existingProductCodes: new Set(existingProducts.map((p: any) => p.code)),
        brandMap: new Map(existingBrands.map((b: any) => [ b.name.toLowerCase(), b.id ])),
        categoryMap,
        currencyMap: new Map(existingCurrencies.map((c: any) => [ c.name.toLowerCase(), c.id ])),
        defaultCurrency,
    };
}

function classifySingleProductRow(
    row: CsvProductRow,
    seenCodes: Set<string>,
    lookups: ProductLookups
): { action?: "create" | "update"; error?: string; warnings?: string[] } {
    if (seenCodes.has(row.code.toLowerCase())) {
        return { error: `Riga ${row.rowNumber}: codice "${row.code}" duplicato nel file` };
    }
    seenCodes.add(row.code.toLowerCase());

    let action: "create" | "update";
    if (row.id !== null) {
        if (!lookups.existingProductIds.has(row.id)) {
            return { error: `Riga ${row.rowNumber}: ID ${row.id} non esiste nel database` };
        }
        action = "update";
    } else if (lookups.existingProductCodes.has(row.code)) {
        return {
            error: `Riga ${row.rowNumber}: codice "${row.code}" esiste già nel database (usa l'ID per aggiornare)`,
        };
    } else {
        action = "create";
    }

    const warnings: string[] = [];
    if (row.currency && !lookups.currencyMap.has(row.currency.toLowerCase()) && lookups.defaultCurrency) {
        warnings.push(
            `Riga ${row.rowNumber}: valuta "${row.currency}" non trovata, verrà usata "${lookups.defaultCurrency.name}"`
        );
    }

    return { action, warnings: warnings.length > 0 ? warnings : undefined };
}

async function executeProductImport(
    prisma: any,
    classified: ClassifiedProductRows,
    createdById: number
) {
    const {
        toCreate, toUpdate, newBrands, newCategories,
        brandMap, categoryMap, currencyMap, defaultCurrency,
    } = classified;

    for (const brandName of newBrands) {
        const created = await prisma.brand.create({
            data: { name: brandName, createdById },
        });
        brandMap.set(brandName.toLowerCase(), created.id);
    }

    for (const catLabel of newCategories) {
        const catId = await resolveOrCreateCategory(
            prisma, catLabel, categoryMap, createdById
        );
        categoryMap.set(catLabel.toLowerCase(), catId);
    }

    const resolveCurrencyId = (currencyName: string): number => {
        if (currencyName && currencyMap.has(currencyName.toLowerCase())) {
            return currencyMap.get(currencyName.toLowerCase())!;
        }
        return defaultCurrency?.id || 1;
    };

    let createdCount = 0;
    for (const row of toCreate) {
        await prisma.product.create({
            data: {
                code: row.code,
                name: row.name,
                description: row.description,
                price: row.price,
                tags: row.tags,
                brandId: brandMap.get(row.brand.toLowerCase())!,
                categoryId: categoryMap.get(row.category.toLowerCase())!,
                currencyId: resolveCurrencyId(row.currency),
                createdById,
            },
        });
        createdCount++;
    }

    let updatedCount = 0;
    for (const row of toUpdate) {
        await prisma.product.update({
            where: { id: row.id! },
            data: {
                code: row.code,
                name: row.name,
                description: row.description,
                price: row.price,
                tags: row.tags,
                brandId: brandMap.get(row.brand.toLowerCase())!,
                categoryId: categoryMap.get(row.category.toLowerCase())!,
                currencyId: resolveCurrencyId(row.currency),
            },
        });
        updatedCount++;
    }

    return {
        created: createdCount,
        updated: updatedCount,
        newBrands,
        newCategories,
    };
}

async function resolveOrCreateCategory(
    prisma: any,
    categoryLabel: string,
    categoryMap: Map<string, number>,
    createdById: number
): Promise<number> {
    if (categoryMap.has(categoryLabel.toLowerCase())) {
        return categoryMap.get(categoryLabel.toLowerCase())!;
    }

    const separator = " » ";
    if (categoryLabel.includes(separator)) {
        return resolveHierarchicalCategory(prisma, categoryLabel, separator, categoryMap, createdById);
    }

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

async function resolveHierarchicalCategory(
    prisma: any,
    categoryLabel: string,
    separator: string,
    categoryMap: Map<string, number>,
    createdById: number
): Promise<number> {
    const parts = categoryLabel.split(separator);
    const parentName = parts[0].trim();
    const childName = parts[1].trim();

    const parentId = await resolveOrCreateSimpleCategory(
        prisma, parentName, categoryMap, createdById
    );

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

async function resolveOrCreateSimpleCategory(
    prisma: any,
    name: string,
    categoryMap: Map<string, number>,
    createdById: number
): Promise<number> {
    if (categoryMap.has(name.toLowerCase())) {
        return categoryMap.get(name.toLowerCase())!;
    }

    const existing = await prisma.category.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) {
        categoryMap.set(name.toLowerCase(), existing.id);
        return existing.id;
    }

    const created = await prisma.category.create({
        data: { name, createdById },
    });
    categoryMap.set(name.toLowerCase(), created.id);
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
