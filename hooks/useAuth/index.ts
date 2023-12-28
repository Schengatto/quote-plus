"use client";
import { verifyJwtToken } from "@/libs/auth";
import { AuthenticatedUser } from "@/types/api/users";
import { useEffect, useState } from "react";
import Cookies from "universal-cookie";

export function useAuth() {
    const [auth, setAuth] = useState<AuthenticatedUser | null>(null);

    const getVerifiedtoken = async () => {
        const cookies = new Cookies();
        const token = cookies.get("token") ?? null;
        const verifiedToken = (await verifyJwtToken(token)) as AuthenticatedUser | null;
        setAuth(verifiedToken);
    };
    useEffect(() => {
        getVerifiedtoken();
    }, []);
    return auth;
}
