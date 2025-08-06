"use client";
import { verifyJwtToken } from "@/libs/auth";
import { AuthenticatedUser } from "@/types/api/users";
import { useEffect, useState } from "react";
import Cookies from "universal-cookie";

export function useAuth() {
    const [userData, setUserData] = useState<AuthenticatedUser | null>(null);

    const getVerifiedtoken = async () => {
        const cookies = new Cookies();
        const token = cookies.get("token") ?? null;
        const verifiedToken = (await verifyJwtToken(token)) as AuthenticatedUser | null;
        setUserData(verifiedToken);
    };

    const logout = async () => {
        const endpoint = "/api/logout";
        await fetch(endpoint, { method: "POST" }).then((res) =>
            res.json()
        );
        localStorage.clear();
        setUserData(null);
    };

    useEffect(() => {
        getVerifiedtoken();
    }, []);
    return { userData, logout };
}
