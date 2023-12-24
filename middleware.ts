import { verifyJwtToken } from "@/libs/auth";
import { NextRequest, NextResponse } from "next/server";

const NO_AUTH_PAGES = ["/", "/api/user/auth"];

const isAuthPages = (url: string): boolean =>
    !url.startsWith("/api/translations") && !NO_AUTH_PAGES.some((page) => page === url);

export async function middleware(request: NextRequest) {
    const { url, nextUrl, cookies } = request;
    const { value: token } = cookies.get("token") ?? { value: null };
    const hasVerifiedToken = token && (await verifyJwtToken(token));
    const isAuthPageRequested = isAuthPages(nextUrl.pathname);

    if (isAuthPageRequested && !hasVerifiedToken) {
        if (url.startsWith("/api")) {
            return Response.json({ success: false, message: "authentication failed" }, { status: 401 });
        } else {
            const response = NextResponse.redirect(new URL("/", url));
            response.cookies.delete("token");
            return response;
        }
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
