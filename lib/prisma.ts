import { PrismaClient } from "@prisma/client";

const doWithPrisma = async (callback: (prisma: PrismaClient) => Promise<any>): Promise<any> => {
    const prisma = new PrismaClient();
    let result = null;
    try {
        result = await callback(prisma);
    } finally {
        prisma.$disconnect();
        return result;
    }
};

export default doWithPrisma;
