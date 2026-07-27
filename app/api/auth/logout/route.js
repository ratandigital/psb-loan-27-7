import { NextResponse } from "next/server";

export async function GET(request) {
  const response = NextResponse.redirect(
    new URL("/login", request.url)
  );

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}