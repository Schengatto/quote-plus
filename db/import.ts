const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

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

const EXCLUDE_FIELDS = ["id"];
const DATE_FIELDS = ["createdAt", "updatedAt", "date"];

function parseModelName(filename: string): string | null {
    const base = path.basename(filename, ".json");
    const modelPart = base
        .replace(/\d{4}-\d{2}-\d{2}.*$/, "")
        .replace(/[-_]/g, "")
        .toLowerCase();

    for (const key of Object.keys(UNIQUE_KEYS)) {
        if (modelPart === key || modelPart === key + "s" || modelPart === key + "es") {
            return key;
        }
    }
    if (modelPart.includes("contactnote")) return "contactnote";
    if (modelPart.includes("userrole")) return "userrole";

    return null;
}

function getPrismaModel(modelName: string): any {
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
            data[key] = new Date(value as string);
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

    const model = getPrismaModel(modelName);
    const uniqueKey = UNIQUE_KEYS[modelName];

    console.log(`Importing "${path.basename(filePath)}" -> model: ${modelName} (upsert key: ${uniqueKey})`);

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
            console.log(`  OK ${label}`);
        } catch (e: any) {
            failed++;
            const label = record.name || record.id;
            console.error(`  FAIL ${label}: ${e.message}`);
        }
    }

    console.log(`\nDone: ${imported} imported, ${failed} failed.`);
}

async function main() {
    const files = process.argv.slice(2);

    if (files.length === 0) {
        console.log("Usage: pnpm db:import <file1.json> [file2.json] ...");
        console.log(`  Supported models: ${Object.keys(UNIQUE_KEYS).join(", ")}`);
        console.log("  Example: pnpm db:import db/quotes2025-12-11.json db/contacts.json");
        process.exit(0);
    }

    for (const file of files) {
        await importFile(file);
        console.log();
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e: any) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
