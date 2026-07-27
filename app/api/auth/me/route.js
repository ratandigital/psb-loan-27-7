export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ loggedIn: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return NextResponse.json({
      loggedIn: true,
      role: decoded.role,
      fullName: decoded.fullName,
    });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}