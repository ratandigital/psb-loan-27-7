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

    const { employeeId, branchCode } = await req.json();

    await EmployeeAccount.findOneAndUpdate(
      { employeeId, branchCode },
      { password: "123456" }
    );

    return NextResponse.json({
      success: true,
      message: "Password reset to default (123456)",
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}