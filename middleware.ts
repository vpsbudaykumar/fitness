import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = new Set(["/login", "/signup", "/reset-password", "/auth/callback"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, supabase, user } = await updateSession(request);
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!user) {
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (isPublic && pathname !== "/reset-password") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { data: screening } = await supabase
    .from("readiness_screening")
    .select("cleared")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!screening?.cleared && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  if (screening?.cleared && pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/home", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
