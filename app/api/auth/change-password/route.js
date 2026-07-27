export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import EmployeeAccount from "@/models/EmployeeAccount";

export async function PUT(request) {
  await connectDB();

  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return NextResponse.json(
        { success: false, message: "Invalid token data" },
        { status: 400 }
      );
    }

    const { newPassword } = await request.json();

    if (!newPassword || newPassword === "123456") {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 400 }
      );
    }

    const user = await EmployeeAccount.findById(decoded.id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Update password
    user.password = newPassword;
    await user.save();

    // ✅ Create new token
    const newToken = jwt.sign(
      {
        id: user._id.toString(),
        fullName: user.fullName,
        mobile: user.mobile,
        designation: user.designation,
        branchCode: user.branchCode,
        mustChangePassword: false,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      message: "Password updated",
    });

    response.cookies.set("token", newToken, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error); // ✅ দেখো terminal এ

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}