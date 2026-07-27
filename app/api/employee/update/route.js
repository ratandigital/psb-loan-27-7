export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import EmployeeAccount from "@/models/EmployeeAccount";

export async function PUT(req) {
  await connectDB();

  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "Branch Manager" && decoded.role !== "Admin") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await req.json();

    const {
      originalEmployeeId, // 🔴 important
      branchCode,
      employeeId,
      fullName,
      designation,
      role,
      mobile,
      email,
    } = body;

    const updated = await EmployeeAccount.findOneAndUpdate(
      { employeeId: originalEmployeeId, branchCode },
      {
        employeeId,
        fullName,
        designation,
        role,
        mobile,
        email,
      },
      { new: true }
    ).select("-password");

    return NextResponse.json({
      success: true,
      employee: updated,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}