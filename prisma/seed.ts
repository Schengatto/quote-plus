const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
    const demoTenant = await prisma.tenant.upsert({
        where: { name: "demo" },
        update: {},
        create: {
            name: "demo",
        },
    });

    const roleAdmin = await prisma.userRole.upsert({
        where: { name: "admin" },
        update: {},
        create: {
            name: "admin",
        },
    });

    const adminUser = await prisma.user.upsert({
        where: { username: "demo" },
        update: {},
        create: {
            username: "demo",
            password: "demo",
            userRoleId: roleAdmin.id,
            tenantId: demoTenant.id,
            extraData: { language: "it" },
        },
    });

    console.log({ demoTenant, roleAdmin, adminUser });
}
main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
