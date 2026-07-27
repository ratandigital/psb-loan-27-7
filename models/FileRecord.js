export const runtime = "nodejs";

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

import EmployeeAccount from "@/models/EmployeeAccount";
import BranchMonthlyReport from "@/models/BranchMonthlyReport";
import {LoanData} from "@/models/LoanData";
import FileRecord from "@/models/FileRecord"; // optional if needed

export async function GET(req) {
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);

    const branchCode = Number(searchParams.get("branchCode"));
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    if (!branchCode || !month || !year) {
      return NextResponse.json(
        { error: "branchCode, month, year required" },
        { status: 400 }
      );
    }

    /* =========================
       ✅ Branch Monthly Report
    ==========================*/
    const branch = await BranchMonthlyReport.findOne({
      branchCode,
      month,
      year,
    }).lean();

    /* =========================
       ✅ Employee Summary
    ==========================*/
    const totalEmployees = await EmployeeAccount.countDocuments({
      branchCode,
      month,
      year,
    });

    const activeEmployees = await EmployeeAccount.countDocuments({
      branchCode,
      month,
      year,
      status: "ACTIVE",
    });

    /* =========================
       ✅ Loan Summary
    ==========================*/
    const loans = await LoanData.find({
      branchCode,
      uploadMonth: month,
      uploadYear: year,
    }).lean();

    const totalLoan = loans.length;

    const totalDisburse = loans.reduce(
      (sum, l) => sum + (l.disburseAmount || 0),
      0
    );

    const totalOutstanding = loans.reduce(
      (sum, l) => sum + (l.principalOutstandingUptoPreMonth || 0),
      0
    );

    const totalRepayment = loans.reduce(
      (sum, l) => sum + (l.repaymentCurrentMonth || 0),
      0
    );

    /* =========================
       ✅ Response
    ==========================*/
    return NextResponse.json({
      success: true,

      branch: branch || null,

      employees: {
        totalRecords: totalEmployees,
        activeCount: activeEmployees,
      },

      loans: {
        totalLoan,
        totalDisburse,
        totalOutstanding,
        totalRepayment,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
