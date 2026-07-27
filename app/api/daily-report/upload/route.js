export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import DailyBranchReport from "@/models/DailyBranchReport";
import EmployeeAccount from "@/models/EmployeeAccount";
import * as XLSX from "xlsx";

export async function POST(req) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /* ✅ AUTH */
    const token = req.cookies.get("token")?.value;
    if (!token) throw new Error("Unauthorized");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const branchCode = Number(decoded.branchCode);
    const branchName = decoded.branchName || "";

    const formData = await req.formData();
    const file = formData.get("file");
    const dateInput = formData.get("reportDate");

    if (!file || !dateInput) {
      throw new Error("ফাইল এবং তারিখ আবশ্যক");
    }

    const reportDate = new Date(dateInput);
    reportDate.setHours(0, 0, 0, 0);

    /* ✅ One Day One Upload Check */
    const already = await DailyBranchReport.findOne({
      branchCode,
      reportDate,
    });

    if (already) {
      throw new Error("এই তারিখে ইতিমধ্যে রিপোর্ট আপলোড করা হয়েছে");
    }

    /* ✅ Parse Excel */
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) throw new Error("ফাইলে কোনো ডাটা নেই");

    const docs = [];

    for (const row of rows) {
      const faIdMatch = row["আইডি"]?.match(/\((.*?)\)/);
      const fieldAssistantId = faIdMatch
        ? faIdMatch[1]
        : row["আইডি"];

      const employee = await EmployeeAccount.findOne({
        employeeId: fieldAssistantId,
        branchCode,
      });

      docs.push({
        branchCode,
        branchName,
        reportDate,

        fieldAssistantId,
        fieldAssistantName:
          employee?.fullName || row["মাঠ সহকারী নাম"],

        newMember: Number(row["নতুন সদস্য"]) || 0,
        dpsCount: Number(row["ডিপিএস সংখ্যা"]) || 0,
        dpsAmount: Number(row["টাকার পরিমাণ"]) || 0,
        collection: Number(row["সংগ্রহ"]) || 0,
        total: Number(row["মোট"]) || 0,

        runningLoan: Number(row["চলতি ঋণ"]) || 0,
        disburse: Number(row["ঋণ বিতরণ"]) || 0,
        loanOutstanding: Number(row["ঋণ স্থিতি"]) || 0,

        cashDeposit: Number(row["নগদ জমা"]) || 0,
        cashWithdraw: Number(row["নগদ উত্তোলন"]) || 0,
        bankBalance: Number(row["ব্যাংক স্থিতি"]) || 0,
      });
    }

    await DailyBranchReport.insertMany(docs, { session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      success: true,
      message: "রিপোর্ট সফলভাবে সংরক্ষিত হয়েছে",
      totalSaved: docs.length,
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