import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Maps model name to the unique field used for upsert
const UNIQUE_KEYS: Record<string, string> = {
    tenant: "name",
    userrole: "name",
    user: "username",
    brand: "name",
    category: "name",
    currency: "name",
    template: "name",
    product: "code",
    quote: "name",
    contact: "phoneNumber",
    contactnote: "id",
    item: "id",
};

// Fields to exclude from create/update (auto-managed by Prisma or relation-only)
const EXCLUDE_FIELDS = ["id"];

// Fields that should be parsed as Date
const DATE_FIELDS = ["createdAt", "updatedAt", "date"];

function parseModelName(filename: string): string | null {
    // Extract model name from filename like "quotes2025-12-11T13_24_18.364Z.json"
    // or "contacts.json", "contact-notes.json", etc.
    const base = path.basename(filename, ".json");
    const modelPart = base
        .replace(/\d{4}-\d{2}-\d{2}.*$/, "") // remove date suffix
        .replace(/[-_]/g, "")                 // remove separators
        .toLowerCase();

    // Try to match against known models (singular and plural)
    for (const key of Object.keys(UNIQUE_KEYS)) {
        if (modelPart === key || modelPart === key + "s" || modelPart === key + "es") {
            return key;
        }
    }
    // Special cases
    if (modelPart.includes("contactnote")) return "contactnote";
    if (modelPart.includes("userrole")) return "userrole";

    return null;
}

function getPrismaModel(prisma: PrismaClient, modelName: string): any {
    const map: Record<string, any> = {
        tenant: prisma.tenant,
        userrole: prisma.userRole,
        user: prisma.user,
        brand: prisma.brand,
        category: prisma.category,
        currency: prisma.currency,
        template: prisma.template,
        product: prisma.product,
        quote: prisma.quote,
        contact: prisma.contact,
        contactnote: prisma.contactNote,
        item: prisma.item,
    };
    return map[modelName];
}

function prepareRecord(record: any): any {
    const data: any = {};
    for (const [key, value] of Object.entries(record)) {
        if (EXCLUDE_FIELDS.includes(key)) continue;
        if (DATE_FIELDS.includes(key) && typeof value === "string") {
            data[key] = new Date(value);
        } else {
            data[key] = value;
        }
    }
    return data;
}

async function importFile(filePath: string) {
    const resolvedPath = path.resolve(filePath);

    if (!fs.existsSync(resolvedPath)) {
        console.error(`File not found: ${resolvedPath}`);
        process.exit(1);
    }

    const modelName = parseModelName(filePath);
    if (!modelName) {
        console.error(
            `Could not detect model from filename "${path.basename(filePath)}".`
            + `\nSupported prefixes: ${Object.keys(UNIQUE_KEYS).join(", ")}`
            + `\nExample: quotes.json, contacts2025-01-01.json, products.json`
        );
        process.exit(1);
    }

    const model = getPrismaModel(prisma, modelName);
    const uniqueKey = UNIQUE_KEYS[modelName];

    console.log(`Importing "${path.basename(filePath)}" → model: ${modelName} (upsert key: ${uniqueKey})`);

    const raw = fs.readFileSync(resolvedPath, "utf-8");
    const records: any[] = JSON.parse(raw);

    console.log(`Found ${records.length} records.`);

    let imported = 0;
    let failed = 0;

    for (const record of records) {
        const data = prepareRecord(record);
        const whereValue = record[uniqueKey] ?? record.id;

        try {
            await model.upsert({
                where: { [uniqueKey]: whereValue },
                update: data,
                create: data,
            });
            imported++;
            const label = record.name || record.username || record.phoneNumber || record.code || record.id;
            console.log(`  ✓ ${label}`);
        } catch (e: any) {
            failed++;
            const label = record.name || record.id;
            console.error(`  ✗ ${label}: ${e.message}`);
        }
    }

    console.log(`\nDone: ${imported} imported, ${failed} failed.`);
}

async function main() {
    const files = process.argv.slice(2);

    if (files.length === 0) {
        console.log("Usage: ts-node db/import.ts <file1.json> [file2.json] ...");
        console.log("  The model is detected from the filename prefix.");
        console.log(`  Supported: ${Object.keys(UNIQUE_KEYS).join(", ")}`);
        console.log("  Example: ts-node db/import.ts db/quotes2025-12-11.json db/contacts.json");
        process.exit(0);
    }

    for (const file of files) {
        await importFile(file);
        console.log();
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
