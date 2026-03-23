import { verifyJwtToken } from "@/libs/auth";
import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedUser } from "./types/api/users";

const NO_AUTH_PAGES = [ "/", "/api/users/auth" ];
const AUTH_FAILED_RESPONSE = { success: false, message: "authentication failed" };

const PROTECTED_ROUTES: { path: string; grant: string }[] = [
    { path: "/brands", grant: "brands" },
    { path: "/categories", grant: "categories" },
    { path: "/products", grant: "products" },
    { path: "/quotes", grant: "quotes" },
    { path: "/contacts", grant: "quotes" },
    { path: "/storage", grant: "storage" },
    { path: "/users-management", grant: "users-management" },
];

const isAuthPages = (url: string): boolean =>
    !url.startsWith("/api/translations") && !NO_AUTH_PAGES.some((page) => page === url);

export async function middleware(request: NextRequest) {
    const { url, nextUrl, cookies } = request;
    const { value: token } = cookies.get("token") ?? { value: null };
    const verifiedToken = token && (await verifyJwtToken(token));
    const isAuthPageRequested = isAuthPages(nextUrl.pathname);

    if (isAuthPageRequested && !verifiedToken) {
        if (url.includes("/api")) {
            return Response.json(AUTH_FAILED_RESPONSE, { status: 401 });
        }
        const response = NextResponse.redirect(new URL("/", url));
        response.cookies.delete("token");
        return response;
    }

    if (request.method === "GET") {
        return NextResponse.next();
    }

    const grants = (verifiedToken as AuthenticatedUser)?.userRole?.grants;
    for (const route of PROTECTED_ROUTES) {
        if (url.includes(route.path) && !grants?.includes(route.grant)) {
            return Response.json(AUTH_FAILED_RESPONSE, { status: 401 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/api/:path*",
        "/home",
        "/products/:path*",
        "/quotes/:path*",
        "/categories/:path*",
        "/brands/:path*",
        "/profile/:path*",
        "/templates/:path*",
        "/users-management/:path*",
        "/contacts/:path*",
        "/storage/:path*",
    ],
};
