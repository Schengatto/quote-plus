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

    const userRoleAdmin = await prisma.userRole.upsert({
        where: { name: "admin" },
        update: {},
        create: {
            name: "admin",
        },
    });

    const userRoleBasic = await prisma.userRole.upsert({
        where: { name: "basic" },
        update: {},
        create: {
            name: "basic",
            grants: [ "quites" ],
        },
    });

    const adminUser = await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: {
            username: "admin",
            password: "demo",
            userRoleId: userRoleAdmin.id,
            tenantId: demoTenant.id,
            extraData: { language: "it" },
        },
    });

    const basicUser = await prisma.user.upsert({
        where: { username: "demo" },
        update: {},
        create: {
            username: "demo",
            password: "demo",
            userRoleId: userRoleBasic.id,
            tenantId: demoTenant.id,
            extraData: { language: "it" },
        },
    });

    console.log({
        demoTenant,
        userRoleAdmin,
        userRoleBasic,
        adminUser,
        basicUser,
    });
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
