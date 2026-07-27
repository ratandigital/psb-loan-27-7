export const runtime = "nodejs";

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import BranchMonthlyReport from "@/models/BranchMonthlyReport";

/* ✅ GET - View Data */
export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const branchCode = Number(searchParams.get("branchCode"));
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (!branchCode || !month || !year) {
    return NextResponse.json(
      { error: "Branch Code, Month, Year আবশ্যক" },
      { status: 400 }
    );
  }

  const reports = await BranchMonthlyReport.find({
    branchCode,
    month,
    year,
  });

  return NextResponse.json({
    success: true,
    totalRecords: reports.length,
    reports,
  });
}

/* ✅ DELETE - Delete Data */
export async function DELETE(req) {
  await connectDB();

  const { branchCode, month, year } = await req.json();

  if (!branchCode || !month || !year) {
    return NextResponse.json(
      { error: "Branch Code, Month, Year আবশ্যক" },
      { status: 400 }
    );
  }

  const result = await BranchMonthlyReport.deleteMany({
    branchCode,
    month,
    year,
  });

  return NextResponse.json({
    success: true,
    message: "ডাটা সফলভাবে ডিলিট হয়েছে",
    deletedCount: result.deletedCount,
  });
}