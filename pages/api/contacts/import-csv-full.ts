import doWithPrisma from "@/libs/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: "4mb",
        },
    },
};

type CsvContactRow = {
    rowNumber: number;
    id: number | null;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    company: string;
    mobile: string;
    mobile2: string;
    home: string;
    home2: string;
    business: string;
    business2: string;
    email: string;
    businessFax: string;
    homeFax: string;
    pager: string;
    other: string;
    whatsapp: string;
    telegram: string;
    label: string;
    gruppo: string;
};

type ValidationResult = {
    valid: boolean;
    totalRows: number;
    toCreate: number;
    toUpdate: number;
    newGroups: string[];
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
        const input = validateImportInput(req.body);
        if (input.error) {
            res.status(400).json({ message: input.error });
            return;
        }

        const { csv, mode, createdBy } = input;
        const { rows, errors: parseErrors } = parseCsvContactRows(csv!);

        if (parseErrors.length > 0 && rows.length === 0) {
            res.status(400).json({ message: parseErrors.join("\n"), errors: parseErrors });
            return;
        }

        const result = await processContactImport(rows, parseErrors, mode!, createdBy);

        if (result.type === "error") {
            res.status(400).json(result.data);
        } else {
            res.status(200).json(result.data);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

function validateImportInput(rawBody: string): {
    csv?: string[]; mode?: string; createdBy?: string; error?: string
} {
    const body = JSON.parse(rawBody);
    const { csv, mode, createdBy } = body;

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

    return { csv: dataLines, mode, createdBy };
}

async function processContactImport(
    rows: CsvContactRow[],
    parseErrors: string[],
    mode: string,
    createdBy?: string
) {
    return doWithPrisma(async (prisma) => {
        const classified = await classifyContactRows(rows, parseErrors, prisma);

        if (mode === "validate") {
            const validation: ValidationResult = {
                valid: classified.errors.length === 0,
                totalRows: rows.length,
                toCreate: classified.toCreate.length,
                toUpdate: classified.toUpdate.length,
                newGroups: classified.newGroups,
                errors: classified.errors,
            };
            return { type: "validation" as const, data: validation };
        }

        if (classified.errors.length > 0) {
            return {
                type: "error" as const,
                data: { message: classified.errors.join("\n"), errors: classified.errors },
            };
        }

        const txResult = await executeContactImport(
            prisma, classified, createdBy || "system"
        );
        return { type: "success" as const, data: txResult };
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

function parseCsvContactRows(dataLines: string[]): { rows: CsvContactRow[]; errors: string[] } {
    const rows: CsvContactRow[] = [];
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
        const parsed = parseContactRow(parseCsvLine(dataLines[i]), i + 2);
        if (parsed.error) errors.push(parsed.error);
        else rows.push(parsed.row!);
    }

    return { rows, errors };
}

function part(parts: string[], index: number): string {
    return parts[index]?.trim() ?? "";
}

function parseContactRow(
    parts: string[], rowNum: number
): { row?: CsvContactRow; error?: string } {
    const idRaw = part(parts, 0);
    const phoneNumber = part(parts, 1);
    const email = part(parts, 11);

    if (!phoneNumber) {
        return { error: `Riga ${rowNum}: phoneNumber obbligatorio` };
    }

    if (email && !isValidEmail(email)) {
        return { error: `Riga ${rowNum}: email non valida "${email}"` };
    }

    const id = idRaw ? parseInt(idRaw, 10) : null;
    if (idRaw && isNaN(id as number)) {
        return { error: `Riga ${rowNum}: ID non valido "${idRaw}"` };
    }

    return {
        row: {
            rowNumber: rowNum,
            id,
            phoneNumber,
            firstName: part(parts, 2),
            lastName: part(parts, 3),
            company: part(parts, 4),
            mobile: part(parts, 5),
            mobile2: part(parts, 6),
            home: part(parts, 7),
            home2: part(parts, 8),
            business: part(parts, 9),
            business2: part(parts, 10),
            email,
            businessFax: part(parts, 12),
            homeFax: part(parts, 13),
            pager: part(parts, 14),
            other: part(parts, 15),
            whatsapp: part(parts, 16),
            telegram: part(parts, 17),
            label: part(parts, 18),
            gruppo: part(parts, 19),
        },
    };
}

type ClassifiedContactRows = {
    toCreate: CsvContactRow[];
    toUpdate: CsvContactRow[];
    errors: string[];
    newGroups: string[];
    groupMap: Map<string, number>;
};

async function classifyContactRows(
    rows: CsvContactRow[],
    parseErrors: string[],
    prisma: any
): Promise<ClassifiedContactRows> {
    const existingContacts = await prisma.contact.findMany({
        select: { id: true, phoneNumber: true },
    });
    const existingGroups = await prisma.contactGroup.findMany({
        select: { id: true, name: true },
    });

    const existingContactIds = new Set(existingContacts.map((c: any) => c.id));
    const existingPhoneNumbers = new Map(
        existingContacts.map((c: any) => [ c.phoneNumber, c.id ])
    );
    const groupMap = new Map(
        existingGroups.map((g: any) => [ g.name.toLowerCase(), g.id ])
    );

    const errors: string[] = [ ...parseErrors ];
    const toCreate: CsvContactRow[] = [];
    const toUpdate: CsvContactRow[] = [];
    const newGroupsSet = new Set<string>();
    const seenPhones = new Map<string, number>();

    for (const row of rows) {
        const result = classifySingleContactRow(
            row, seenPhones, existingContactIds, existingPhoneNumbers, groupMap
        );
        if (result.error) {
            errors.push(result.error);
            continue;
        }
        if (result.action === "create") toCreate.push(row);
        else toUpdate.push(row);
        if (result.newGroup) newGroupsSet.add(result.newGroup);
    }

    return {
        toCreate,
        toUpdate,
        errors,
        newGroups: Array.from(newGroupsSet),
        groupMap,
    };
}

function classifySingleContactRow(
    row: CsvContactRow,
    seenPhones: Map<string, number>,
    existingContactIds: Set<number>,
    existingPhoneNumbers: Map<string, number>,
    groupMap: Map<string, number>
): { action?: "create" | "update"; error?: string; newGroup?: string } {
    if (seenPhones.has(row.phoneNumber)) {
        return {
            error: `Riga ${row.rowNumber}: phoneNumber "${row.phoneNumber}" duplicato nel CSV (riga ${seenPhones.get(row.phoneNumber)})`,
        };
    }
    seenPhones.set(row.phoneNumber, row.rowNumber);

    let action: "create" | "update";
    if (row.id !== null) {
        if (!existingContactIds.has(row.id)) {
            return { error: `Riga ${row.rowNumber}: ID ${row.id} non esiste nel database` };
        }
        action = "update";
    } else if (existingPhoneNumbers.has(row.phoneNumber)) {
        action = "update";
    } else {
        action = "create";
    }

    const newGroup = (row.gruppo && !groupMap.has(row.gruppo.toLowerCase())) ? row.gruppo : undefined;
    return { action, newGroup };
}

async function executeContactImport(
    prisma: any,
    classified: ClassifiedContactRows,
    username: string
) {
    const { toCreate, toUpdate, newGroups, groupMap } = classified;

    return prisma.$transaction(async (tx: any) => {
        for (const groupName of newGroups) {
            const created = await tx.contactGroup.create({
                data: {
                    name: groupName,
                    createdBy: username,
                    updatedBy: username,
                },
            });
            groupMap.set(groupName.toLowerCase(), created.id);
        }

        const resolveGroupId = (gruppo: string): number | null => {
            if (!gruppo) return null;
            return groupMap.get(gruppo.toLowerCase()) || null;
        };

        let createdCount = 0;
        for (const row of toCreate) {
            await tx.contact.create({
                data: buildContactData(row, resolveGroupId, username, true),
            });
            createdCount++;
        }

        let updatedCount = 0;
        for (const row of toUpdate) {
            const whereClause = row.id !== null
                ? { id: row.id }
                : { phoneNumber: row.phoneNumber };

            await tx.contact.update({
                where: whereClause,
                data: buildContactData(row, resolveGroupId, username, false),
            });
            updatedCount++;
        }

        return {
            created: createdCount,
            updated: updatedCount,
            groupsCreated: newGroups.length,
        };
    });
}

const NULLABLE_CONTACT_FIELDS = [
    "firstName", "lastName", "company",
    "mobile", "mobile2", "home", "home2", "business", "business2",
    "email", "businessFax", "homeFax", "pager", "other",
] as const;

const EMPTY_STRING_CONTACT_FIELDS = [ "whatsapp", "telegram", "label" ] as const;

function buildContactData(
    row: CsvContactRow,
    resolveGroupId: (gruppo: string) => number | null,
    username: string,
    isCreate: boolean
) {
    const data: any = { phoneNumber: row.phoneNumber, updatedBy: username };

    for (const f of NULLABLE_CONTACT_FIELDS) {
        data[f] = row[f] ? row[f] : null;
    }
    for (const f of EMPTY_STRING_CONTACT_FIELDS) {
        data[f] = row[f] ? row[f] : "";
    }

    data.groupId = resolveGroupId(row.gruppo);
    if (isCreate) data.createdBy = username;
    return data;
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
