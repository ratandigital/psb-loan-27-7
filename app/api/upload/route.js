export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { LoanData } from "@/models/LoanData";
import { parseExcelFile } from "@/lib/parseExcel";

/* ================= Helper: Split Branch ================= */

function splitBranch(value) {
  if (!value) return { branchName: "", branchCode: null };

  const match = value.match(/^(.+)-(\d+)$/);

  if (!match) {
    return {
      branchName: value.trim(),
      branchCode: null,
    };
  }

  return {
    branchName: match[1].trim(),
    branchCode: Number(match[2]),
  };
}

/* ================= Upload API ================= */

export async function POST(request) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const month = Number(formData.get("month"));
    const year = Number(formData.get("year"));

    /* ✅ Basic Validation */

    if (!file || typeof file === "string") {
      throw new Error("ফাইল পাওয়া যায়নি");
    }

    if (!month || !year) {
      throw new Error("মাস এবং বছর আবশ্যক");
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      throw new Error("শুধুমাত্র Excel ফাইল অনুমোদিত");
    }

    /* ✅ Parse Excel */

    const buffer = Buffer.from(await file.arrayBuffer());
    const { loanData } = parseExcelFile(buffer);

    if (!loanData?.length) {
      throw new Error("ফাইলে কোনো Loan ডাটা পাওয়া যায়নি");
    }

    /* ✅ Remove blank rows + Disburse Date required */

    const filteredLoanData = loanData.filter(
      (row) =>
        row.disburseDate &&
        Object.values(row).some((v) => v !== null && v !== "")
    );

    if (!filteredLoanData.length) {
      throw new Error("Valid loan data পাওয়া যায়নি (Disburse Date প্রয়োজন)");
    }

    /* ✅ Get Branch Info */

    const { branchName, branchCode } = splitBranch(
      filteredLoanData[0].branchName
    );

    if (!branchCode) {
      throw new Error("Branch Code পাওয়া যায়নি");
    }

    /* ✅ Prevent Duplicate Upload */

    const existing = await LoanData.findOne({
      branchCode,
      uploadMonth: month,
      uploadYear: year,
    });

    if (existing) {
      throw new Error(
        `এই ব্রাঞ্চ (${branchCode}) এর ${month}/${year} মাসের ডাটা ইতিমধ্যে আপলোড করা হয়েছে`
      );
    }

    /* ✅ Prepare Documents */

    const loanDocs = filteredLoanData.map((d) => {
      let fieldAssistantId = null;

      if (d.fieldAssistant) {
        const match = d.fieldAssistant.match(/\((.*?)\)/);
        fieldAssistantId = match ? match[1] : null;
      }

      return {
        ...d,
        branchName,
        branchCode,
        uploadMonth: month,
        uploadYear: year,
        fieldAssistantId,
      };
    });

    /* ✅ Insert All At Once */

    await LoanData.insertMany(loanDocs, { session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      success: true,
      message: "এক্সেলের সমস্ত ডাটা সফলভাবে সংরক্ষিত হয়েছে",
      totalSaved: loanDocs.length,
      branchCode,
      month,
      year,
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