export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import EmployeeAccount from "@/models/EmployeeAccount";
import * as XLSX from "xlsx";

export async function POST(request) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const branchCode = Number(formData.get("branchCode"));
    const month = Number(formData.get("month"));
    const year = Number(formData.get("year"));

    /* ✅ Basic Validation */
    if (!file || !branchCode) {
      throw new Error("ফাইল এবং শাখা কোড আবশ্যক");
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      throw new Error("শুধুমাত্র Excel ফাইল অনুমোদিত");
    }

    /* ✅ ✅ Only Branch ভিত্তিক চেক */
    const existingBranch = await EmployeeAccount.findOne({ branchCode });

    if (existingBranch) {
      throw new Error(
        `এই শাখা (${branchCode}) এর ডাটা ইতিমধ্যে আপলোড করা হয়েছে। পুনরায় আপলোড করা যাবে না।`
      );
    }

    /* ✅ Parse Excel */
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      throw new Error("ফাইলে কোনো ডাটা পাওয়া যায়নি");
    }

    /* ✅ Prepare Documents */
    const docs = rows
      .filter((row) => row["Employee ID"] && row["Mobile Number (Personal)"])
      .map((row) => ({
        employeeId: String(row["Employee ID"]).trim(),
        fullName: row["Full Name"] || "",
        designation: row["Designation"] || "",
        role: row["Role"] || "",

        mobile: String(row["Mobile Number (Personal)"]).trim(),
        email: row["Email Address (Personal)"] || "",

        corporateSimNumber: row["Corporate SIM Number"] || "",
        corporateSimStatus: row["Corporate SIM Status"] || "",
        status: row["Employee Status"] || "",

        branchName: row["Branch Name"]?.split("-")[0]?.trim() || "",
        branchCode,

        month,
        year,

        password: "123456",
      }));

    if (!docs.length) {
      throw new Error("Valid Employee ডাটা পাওয়া যায়নি");
    }

    /* ✅ Insert */
    await EmployeeAccount.insertMany(docs, { session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      success: true,
      message: `শাখা ${branchCode} এর Employee ডাটা সফলভাবে সংরক্ষিত হয়েছে`,
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