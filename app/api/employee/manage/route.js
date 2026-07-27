export const runtime = "nodejs";

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import EmployeeAccount from "@/models/EmployeeAccount";

/* ================= GET ================= */
export async function GET(req) {
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);

    const branchCode = searchParams.get("branchCode");
    const search = searchParams.get("search");
    const page = Number(searchParams.get("page")) || 1;
    const limit = 10;

    /* ✅ Filter - Branch Optional */
    const filter = {};

    // Only add branchCode filter if provided
    if (branchCode && branchCode.trim() !== "") {
      filter.branchCode = Number(branchCode);
    }

    // Search filter
    if (search && search.trim() !== "") {
      filter.$or = [
        { employeeId: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const totalRecords = await EmployeeAccount.countDocuments(filter);

    const activeCount = await EmployeeAccount.countDocuments({
      ...filter,
      status: "ACTIVE",
    });

    const inactiveCount = await EmployeeAccount.countDocuments({
      ...filter,
      status: { $ne: "ACTIVE" },
    });

    const employees = await EmployeeAccount.find(filter)
      .select("-password")
      .sort({ branchCode: 1, fullName: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      totalEmployees: totalRecords,
      activeCount,
      inactiveCount,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: page,
      employees,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/* ================= DELETE ================= */
export async function DELETE(req) {
  await connectDB();

  try {
    const body = await req.json();
    const branchCode = Number(body.branchCode);

    if (!branchCode) {
      return NextResponse.json(
        { error: "শাখা কোড আবশ্যক" },
        { status: 400 }
      );
    }

    const result = await EmployeeAccount.deleteMany({ branchCode });

    return NextResponse.json({
      success: true,
      message: `শাখা ${branchCode} এর ${result.deletedCount} জন কর্মীর ডাটা ডিলিট হয়েছে`,
      deletedCount: result.deletedCount,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}