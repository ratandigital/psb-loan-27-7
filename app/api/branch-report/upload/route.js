export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import BranchMonthlyReport from "@/models/BranchMonthlyReport";
import * as XLSX from "xlsx";

export async function POST(request) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /* ===========================
       ✅ 1️⃣ AUTH (FROM TOKEN)
    ============================ */
    const token = request.cookies.get("token")?.value;

    if (!token) {
      throw new Error("Unauthorized");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const branchCode = Number(decoded.branchCode); // ✅ FROM TOKEN

    if (!branchCode) {
      throw new Error("Branch not found in token");
    }

    /* ===========================
       ✅ 2️⃣ FORM DATA
    ============================ */
    const formData = await request.formData();

    const file = formData.get("file");
    const month = Number(formData.get("month"));
    const year = Number(formData.get("year"));

    if (!file || !month || !year) {
      throw new Error("সব ফিল্ড আবশ্যক");
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      throw new Error("শুধুমাত্র Excel ফাইল অনুমোদিত");
    }

    /* ✅ Duplicate Upload Check */
    const alreadyUploaded = await BranchMonthlyReport.exists({
      branchCode,
      month,
      year,
    });

    if (alreadyUploaded) {
      throw new Error("এই Branch এর এই মাসের ডাটা ইতিমধ্যে সংরক্ষিত আছে");
    }

    /* ===========================
       ✅ 3️⃣ Parse Excel
    ============================ */
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) {
      throw new Error("ফাইলে কোনো ডাটা পাওয়া যায়নি");
    }

    /* ✅ Convert Rows */
    const docs = rows.map((row) => ({
      branchCode,
      branchName: row["Branch Name"]?.split("-")[0]?.trim() || "",

      month,
      year,

      employeeName: row["Employee Name"] || "",
      mobile: row["Mobile"] || "",

      samiteeCount: Number(row["Samitee Count"]) || 0,
      totalMember: Number(row["Total Member"]) || 0,
      loaneeMember: Number(row["Loanee Member"]) || 0,

      depositUptoPreMonth: Number(row["Deposit Upto Pre Month"]) || 0,
      depositCurrentMonth: Number(row["Deposit Current Month"]) || 0,
      currentMonthDisburse: Number(row["Current Month Disburse"]) || 0,
      principalOsUptoPreMonth:
        Number(row["Principal Os Upto Pre Month"]) || 0,
      repaymentCurrentMonth:
        Number(row["Repayment Current Month"]) || 0,
      classifiedLoan: Number(row["Classified Loan"]) || 0,
    }));

    await BranchMonthlyReport.insertMany(docs, { session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      success: true,
      message: `শাখা ${branchCode} এর রিপোর্ট সফলভাবে আপলোড হয়েছে`,
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