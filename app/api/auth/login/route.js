export const runtime = "nodejs";

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import EmployeeAccount from "@/models/EmployeeAccount";
import jwt from "jsonwebtoken";

export async function POST(req) {
  await connectDB();

  try {
    const { mobile, password } = await req.json();

    if (!mobile || !password) {
      return NextResponse.json(
        { success: false, message: "মোবাইল ও পাসওয়ার্ড আবশ্যক" },
        { status: 400 }
      );
    }

    // ✅ Clean mobile
    let cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.startsWith("880")) {
      cleanMobile = "0" + cleanMobile.slice(3);
    }

    const user = await EmployeeAccount.findOne({
      mobile: cleanMobile,
      status: "ACTIVE",
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "মোবাইল নম্বর পাওয়া যায়নি" },
        { status: 400 }
      );
    }

    if (user.password !== password) {
      return NextResponse.json(
        { success: false, message: "পাসওয়ার্ড ভুল" },
        { status: 400 }
      );
    }

    const isDefaultPassword = user.password === "123456";

    // ✅ IMPORTANT: employeeId added
    const token = jwt.sign(
      {
        id: user._id,
        fullName: user.fullName,
        mobile: user.mobile,
        designation: user.designation,
        branchCode: user.branchCode,
        role: user.role,
        employeeId: user.employeeId, // ✅ ADDED
        mustChangePassword: isDefaultPassword,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      mustChangePassword: isDefaultPassword,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, message: "সার্ভার সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}