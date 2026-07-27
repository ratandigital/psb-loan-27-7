export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import EmployeeAccount from "@/models/EmployeeAccount";

export async function GET(req) {
  await connectDB();

  try {
    const token = req.cookies.get("token")?.value;
    if (!token) throw new Error("Unauthorized");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const branchCode = Number(decoded.branchCode);
    const role = decoded.role;
    const employeeId = decoded.employeeId;

    let filter = {
      branchCode,
      status: "ACTIVE",
    };

    if (role === "Branch FA") {
      filter.employeeId = employeeId;
    } else {
      filter.role = "Branch FA";
    }

    const faList = await EmployeeAccount.find(filter)
      .select("fullName employeeId")
      .sort({ fullName: 1 });

    return NextResponse.json({
      success: true,
      data: faList,
      role,
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}