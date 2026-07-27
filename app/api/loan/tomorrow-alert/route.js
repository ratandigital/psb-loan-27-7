export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import { LoanData } from "@/models/LoanData";

export async function GET(req) {
  await connectDB();

  try {
    console.log("✅ Fetching tomorrow loan alerts...");

    /* ===========================
       ✅ 1️⃣ AUTH
    ============================ */
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { branchCode, role, employeeId } = decoded;

    /* ===========================
       ✅ 2️⃣ ALERT CONFIG
    ============================ */
    const ALERT_DAYS_BEFORE =
      Number(process.env.ALERT_DAYS_BEFORE) || 2;

    /* ===========================
       ✅ 3️⃣ BASE MATCH
    ============================ */

    const matchCondition = {
      branchCode: Number(branchCode), // ✅ IMPORTANT FIX
      principalOutstandingUptoPreMonth: { $gt: 0 },
      disburseDate: { $ne: null },
    };

    // ✅ FA restriction
    if (role === "Branch FA") {
      matchCondition.fieldAssistantId = employeeId;
    }

    console.log("Role:", role);
    console.log("EmployeeId:", employeeId);
    console.log("Match Condition:", matchCondition);

    /* ===========================
       ✅ 4️⃣ DATE RANGE
    ============================ */

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    let startDate;
    let endDate;

    if (fromParam && toParam) {
      startDate = new Date(fromParam);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(toParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      startDate = today;

      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
    }

    console.log("Alert Days Before:", ALERT_DAYS_BEFORE);
    console.log("Date Range:", startDate, endDate);

    /* ===========================
       ✅ 5️⃣ AGGREGATION
    ============================ */

    const loans = await LoanData.aggregate([
      { $match: matchCondition },

      // ✅ Overdue Date = Disburse + 1 year - 1 day
      {
        $addFields: {
          overdueDate: {
            $dateTrunc: {
              date: {
                $dateSubtract: {
                  startDate: {
                    $dateAdd: {
                      startDate: "$disburseDate",
                      unit: "year",
                      amount: 1,
                    },
                  },
                  unit: "day",
                  amount: 1,
                },
              },
              unit: "day",
            },
          },
        },
      },

      // ✅ Alert Date
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

      // ✅ Filter by alert date
      {
        $match: {
          alertDate: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },

      // ✅ Group by FA
      {
        $group: {
          _id: "$fieldAssistant",
          totalLoan: { $sum: 1 },
          totalOutstanding: {
            $sum: "$principalOutstandingUptoPreMonth",
          },
          details: {
            $push: {
              unionName: "$unionName",
              samiteeName: "$samiteeName",
              memberOrCustomer: "$memberOrCustomer",
              disburseDate: "$disburseDate",
              overdueDate: "$overdueDate",
              alertDate: "$alertDate",
              disburseAmount: "$disburseAmount",
              principalOutstandingUptoPreMonth:
                "$principalOutstandingUptoPreMonth",
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          fieldAssistant: "$_id",
          totalLoan: 1,
          totalOutstanding: 1,
          details: 1,
        },
      },

      { $sort: { totalOutstanding: -1 } },
    ]);

    return NextResponse.json({
      success: true,
      alertDaysBefore: ALERT_DAYS_BEFORE,
      count: loans.length,
      startDate,
      endDate,
      data: loans,
    });

  } catch (error) {
    console.error("❌ ALERT ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}