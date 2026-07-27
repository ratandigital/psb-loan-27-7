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

    const employee = await EmployeeAccount.findOne({
      employeeId,
      branchCode,
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    employee.status = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    await employee.save();

    return NextResponse.json({ success: true, status: employee.status });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}