import { JWTPayload, jwtVerify } from "jose";

export const getJwtSecretKey = (): Uint8Array => {
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET_KEY;
    if (!secret) {
        throw new Error("JWT Secret key is not matched");
    }
    return new TextEncoder().encode(secret);
};

export const verifyJwtToken = async (token: string): Promise<JWTPayload | null> => {
    try {
        const { payload } = await jwtVerify(token, getJwtSecretKey());
        return payload;
    } catch (error) {
        return null;
    }
};
