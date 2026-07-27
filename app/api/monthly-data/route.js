export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { LoanData } from "@/models/LoanData";

/* ================= GET ================= */

export async function GET(req) {
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);

    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));
    const branchCode = Number(searchParams.get("branchCode"));

    if (!month || !year || !branchCode) {
      return NextResponse.json(
        { error: "মাস, বছর এবং Branch Code আবশ্যক" },
        { status: 400 }
      );
    }

    const filter = {
      uploadMonth: month,
      uploadYear: year,
      branchCode,
    };

    const loans = await LoanData.find(filter).lean();

    return NextResponse.json({
      success: true,
      totalLoan: loans.length,
      loans,
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* ================= DELETE ================= */

export async function DELETE(req) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const body = await req.json();

    const month = Number(body.month);
    const year = Number(body.year);
    const branchCode = Number(body.branchCode);

    if (!month || !year || !branchCode) {
      await session.abortTransaction();
      session.endSession();

      return NextResponse.json(
        { error: "মাস, বছর এবং Branch Code আবশ্যক" },
        { status: 400 }
      );
    }

    const filter = {
      uploadMonth: month,
      uploadYear: year,
      branchCode,
    };

    const loanResult = await LoanData.deleteMany(filter, { session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      success: true,
      message: "নির্বাচিত Branch এর Loan ডাটা ডিলিট হয়েছে",
      deletedLoan: loanResult.deletedCount,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}