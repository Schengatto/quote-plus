import { AuthenticatedUser } from "@/types/api/users";
import { JWTPayload, jwtVerify } from "jose";
import { NextApiRequest } from "next";

export const getJwtSecretKey = (): Uint8Array => {
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET_KEY;
    if (!secret) {
        throw new Error("JWT Secret key is not matched");
    }
    return new TextEncoder().encode(secret);
};

export const verifyJwtToken = async (token: string): Promise<JWTPayload | AuthenticatedUser | null> => {
    try {
        const { payload } = await jwtVerify(token, getJwtSecretKey());
        return payload;
    } catch (error) {
        return null;
    }
};

export const getAuthUserFromRequest = async (request: NextApiRequest): Promise<AuthenticatedUser | null> => {
    const { cookies } = request;
    const token = cookies["token"];
    const verifiedToken = token && (await verifyJwtToken(token));
    return verifiedToken ? (verifiedToken as AuthenticatedUser) : null;
};
