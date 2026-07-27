export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import DailyBranchReport from "@/models/DailyBranchReport";

/* ═══════════════════ GET - View Reports ═══════════════════ */
export async function GET(req) {
  await connectDB();

  try {
    const token = req.cookies.get("token")?.value;
    if (!token) throw new Error("Unauthorized");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const branchCode = Number(decoded.branchCode);

    const { searchParams } = new URL(req.url);
    
    const date = searchParams.get("date"); // Single date
    const startDate = searchParams.get("startDate"); // Range start
    const endDate = searchParams.get("endDate"); // Range end
    const page = Number(searchParams.get("page")) || 1;
    const limit = 10;

    /* ✅ Build Filter */
    const filter = { branchCode };

    if (date) {
      // Single date
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filter.reportDate = {
        $gte: targetDate,
        $lt: nextDay,
      };
    } else if (startDate && endDate) {
      // Date range
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filter.reportDate = {
        $gte: start,
        $lte: end,
      };
    } else {
      // Default: Today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      filter.reportDate = {
        $gte: today,
        $lt: tomorrow,
      };
    }

    const totalRecords = await DailyBranchReport.countDocuments(filter);

    const reports = await DailyBranchReport.find(filter)
      .sort({ reportDate: -1, fieldAssistantName: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    /* ✅ Calculate Totals */
    const totals = {
      newMember: 0,
      dpsCount: 0,
      dpsAmount: 0,
      collection: 0,
      runningLoan: 0,
      disburse: 0,
      totalCollection: 0,
      grandTotal: 0,
    };

    reports.forEach((r) => {
      totals.newMember += r.newMember || 0;
      totals.dpsCount += r.dpsCount || 0;
      totals.dpsAmount += r.dpsAmount || 0;
      totals.collection += r.collection || 0;
      totals.runningLoan += r.runningLoan || 0;
      totals.disburse += r.disburse || 0;
      totals.totalCollection += r.totalCollection || 0;
      totals.grandTotal += r.grandTotal || 0;
    });

    return NextResponse.json({
      success: true,
      reports,
      totals,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: page,
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

/* ═══════════════════ POST - Create Reports ═══════════════════ */
export async function POST(req) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const token = req.cookies.get("token")?.value;
    if (!token) throw new Error("Unauthorized");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const branchCode = Number(decoded.branchCode);
    const branchName = decoded.branchName || "";

    const { reports } = await req.json();

    if (!reports || reports.length === 0) {
      throw new Error("কোনো ডাটা নেই");
    }

    const reportDate = new Date();
    reportDate.setHours(0, 0, 0, 0);

    /* ✅ Duplicate Check */
    const ids = reports.map((r) => r.fieldAssistantId);

    const existing = await DailyBranchReport.findOne({
      branchCode,
      reportDate,
      fieldAssistantId: { $in: ids },
    });

    if (existing) {
      throw new Error("আজকের কিছু রিপোর্ট ইতিমধ্যে সংরক্ষিত আছে");
    }

    const docs = reports.map((r) => ({
      branchCode,
      branchName,
      reportDate,
      ...r,
    }));

    await DailyBranchReport.insertMany(docs, { session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      success: true,
      message: `${reports.length} টি রিপোর্ট সফলভাবে সংরক্ষিত হয়েছে`,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

/* ═══════════════════ PUT - Update Report ═══════════════════ */
export async function PUT(req) {
  await connectDB();

  try {
    const token = req.cookies.get("token")?.value;
    if (!token) throw new Error("Unauthorized");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role;

    // Only Branch Manager and Admin can edit
    if (role !== "Branch Manager" && role !== "Admin") {
      throw new Error("আপনার এডিট করার অনুমতি নেই");
    }

    const { _id, ...updates } = await req.json();

    if (!_id) throw new Error("রিপোর্ট আইডি নেই");

    // Recalculate totals
    const totalCollection =
      (Number(updates.dpsAmount) || 0) +
      (Number(updates.collection) || 0) +
      (Number(updates.runningLoan) || 0);

    const grandTotal = totalCollection - (Number(updates.disburse) || 0);

    updates.totalCollection = totalCollection;
    updates.grandTotal = grandTotal;

    const updated = await DailyBranchReport.findByIdAndUpdate(
      _id,
      updates,
      { new: true }
    );

    if (!updated) throw new Error("রিপোর্ট পাওয়া যায়নি");

    return NextResponse.json({
      success: true,
      message: "রিপোর্ট আপডেট হয়েছে",
      report: updated,
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

/* ═══════════════════ DELETE - Delete Report ═══════════════════ */
export async function DELETE(req) {
  await connectDB();

  try {
    const token = req.cookies.get("token")?.value;
    if (!token) throw new Error("Unauthorized");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role;

    // Only Branch Manager and Admin can delete
    if (role !== "Branch Manager" && role !== "Admin") {
      throw new Error("আপনার ডিলিট করার অনুমতি নেই");
    }

    const { _id } = await req.json();

    if (!_id) throw new Error("রিপোর্ট আইডি নেই");

    const deleted = await DailyBranchReport.findByIdAndDelete(_id);

    if (!deleted) throw new Error("রিপোর্ট পাওয়া যায়নি");

    return NextResponse.json({
      success: true,
      message: "রিপোর্ট ডিলিট হয়েছে",
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}