import { verifyJwtToken } from "@/libs/auth";
import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedUser } from "./types/api/user";

const NO_AUTH_PAGES = ["/", "/api/user/auth"];

const isAuthPages = (url: string): boolean =>
    !url.startsWith("/api/translations") && !NO_AUTH_PAGES.some((page) => page === url);

export async function middleware(request: NextRequest) {
    const { url, nextUrl, cookies } = request;
    const { value: token } = cookies.get("token") ?? { value: null };
    const verifiedToken = token && (await verifyJwtToken(token));
    const isAuthPageRequested = isAuthPages(nextUrl.pathname);

    if (isAuthPageRequested && !verifiedToken) {
        if (url.includes("/api")) {
            return Response.json({ success: false, message: "authentication failed" }, { status: 401 });
        } else {
            const response = NextResponse.redirect(new URL("/", url));
            response.cookies.delete("token");
            return response;
        }
    }

    if (url.includes("/api/brand") && !(verifiedToken as AuthenticatedUser).userRole.grants?.includes("brands")) {
        return Response.json({ success: false, message: "authentication failed" }, { status: 401 });
    }

    if (url.includes("/api/category") && !(verifiedToken as AuthenticatedUser).userRole.grants?.includes("categories")) {
        return Response.json({ success: false, message: "authentication failed" }, { status: 401 });
    }

    if (url.includes("/api/product") && !(verifiedToken as AuthenticatedUser).userRole.grants?.includes("products")) {
        return Response.json({ success: false, message: "authentication failed" }, { status: 401 });
    }

    if (url.includes("/api/quote") && !(verifiedToken as AuthenticatedUser).userRole.grants?.includes("quotes")) {
        return Response.json({ success: false, message: "authentication failed" }, { status: 401 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/api/:path*",
        "/home",
        "/product/:path*",
        "/quote/:path*",
        "/category/:path*",
        "/brand/:path*",
        "/profile/:path*",
        "/template/:path*",
    ],
};
