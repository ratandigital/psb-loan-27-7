export const runtime = "nodejs";

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import jwt from "jsonwebtoken";

import EmployeeAccount from "@/models/EmployeeAccount";
import BranchMonthlyReport from "@/models/BranchMonthlyReport";
import { LoanData } from "@/models/LoanData";

export async function GET(req) {
  await connectDB();

  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { branchCode, fullName, role, designation, employeeId } = decoded;

    const ALERT_DAYS_BEFORE =
      Number(process.env.ALERT_DAYS_BEFORE) || 1;

    /* ✅ Latest Branch Report */
    const branch = await BranchMonthlyReport
      .findOne({ branchCode })
      .sort({ year: -1, month: -1 })
      .lean();

    /* ✅ Employee Summary */
    const totalEmployees = await EmployeeAccount.countDocuments({ branchCode });
    const activeEmployees = await EmployeeAccount.countDocuments({
      branchCode,
      status: "ACTIVE",
    });

    /* ✅ Loan Summary */
    const loans = await LoanData.find({ branchCode }).lean();

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

    /* ✅ TODAY ALERT COUNT */
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    let alertMatch = {
      branchCode,
      principalOutstandingUptoPreMonth: { $gt: 0 },
      disburseDate: { $ne: null },
    };

    if (designation === "Field Assistant") {
      alertMatch.fieldAssistantId = employeeId;
    }

    const alertLoans = await LoanData.aggregate([
      { $match: alertMatch },

      {
        $addFields: {
          termDays: {
            $cond: [
              { $lte: ["$disburseAmount", 100000] },
              364,
              546,
            ],
          },
        },
      },

      {
        $addFields: {
          overdueDate: {
            $dateAdd: {
              startDate: "$disburseDate",
              unit: "day",
              amount: "$termDays",
            },
          },
        },
      },

      {
        $addFields: {
          alertDate: {
            $dateSubtract: {
              startDate: "$overdueDate",
              unit: "day",
              amount: ALERT_DAYS_BEFORE,
            },
          },
        },
      },

      {
        $match: {
          alertDate: {
            $gte: today,
            $lte: endDate,
          },
        },
      },

      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalOutstanding: {
            $sum: "$principalOutstandingUptoPreMonth",
          },
        },
      },
    ]);

    const todayAlert = alertLoans[0] || {
      count: 0,
      totalOutstanding: 0,
    };

    return NextResponse.json({
      success: true,

      user: {
        fullName,
        role,
        designation,
        branchCode,
      },

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

      alert: todayAlert, // ✅ NEW
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}