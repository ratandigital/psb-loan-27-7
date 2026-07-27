import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { LoanData, EmployeeData } from "@/models/LoanData";
import {FileRecord} from "@/models/FileRecord";
import { getLoanAnniversaryMembers } from "@/lib/filterLogic";
import { sendEmail } from "@/lib/sendEmail";

export async function GET(request) {
  // Security check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // সর্বশেষ আপলোড করা ফাইলের ডাটা নেওয়া
    const latestFile = await FileRecord.findOne().sort({ uploadDate: -1 });
    if (!latestFile) {
      return NextResponse.json({ message: "কোনো ফাইল নেই" });
    }

    // সেই ফাইলের সব Loan Data
    const loanData = await LoanData.find({ fileId: latestFile._id });

    // আজকের তারিখে Anniversary ফিল্টার
    const today = new Date();
    const grouped = getLoanAnniversaryMembers(loanData, today);

    if (Object.keys(grouped).length === 0) {
      return NextResponse.json({ message: "আজ কোনো Anniversary নেই" });
    }

    // সব Employee ডাটা
    const employees = await EmployeeData.find({ fileId: latestFile._id });

    const results = [];

    // প্রতিটি Field Assistant কে মেইল পাঠানো
    for (const [faName, members] of Object.entries(grouped)) {
      // Employee ডাটা থেকে ম্যাচ করা (নাম দিয়ে)
      const employee = employees.find(
        (emp) =>
          emp.employeeName?.toLowerCase().trim() ===
          faName?.toLowerCase().trim()
      );

      if (!employee?.email) {
        results.push({ fa: faName, status: "মেইল নেই" });
        continue;
      }

      const result = await sendEmail(employee.email, faName, members, today);
      results.push({
        fa: faName,
        email: employee.email,
        memberCount: members.length,
        status: result.success ? "সফল" : "ব্যর্থ",
        error: result.error,
      });
    }

    return NextResponse.json({
      success: true,
      date: today.toLocaleDateString(),
      results,
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
