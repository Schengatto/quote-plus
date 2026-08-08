import { PrismaClient } from "@prisma/client";

const doWithPrisma = async (
    callback: (prisma: PrismaClient) => Promise<any>,
    onError?: (error: any) => void
): Promise<any> => {
    const prisma = new PrismaClient();
    try {
        return await callback(prisma);
    } catch (error: any) {
        if (!onError) {
            console.error(error);
            throw new Error(error.message);
        } else {
            await onError(error);
        }
    } finally {
        prisma.$disconnect();
    }
};

export default doWithPrisma;
