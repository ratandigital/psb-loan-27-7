import mongoose from "mongoose";

const BranchMonthlyReportSchema = new mongoose.Schema(
  {
    branchCode: { type: Number, required: true, index: true },
    branchName: String,

    month: { type: Number, required: true, index: true },
    year: { type: Number, required: true, index: true },

    employeeName: String,
    mobile: String,

    samiteeCount: Number,
    totalMember: Number,
    loaneeMember: Number,

    depositUptoPreMonth: Number,
    depositCurrentMonth: Number,
    currentMonthDisburse: Number,
    principalOsUptoPreMonth: Number,
    repaymentCurrentMonth: Number,
    classifiedLoan: Number,
  },
  { timestamps: true }
);

/* ✅ PERFORMANCE INDEX (NOT UNIQUE) */
BranchMonthlyReportSchema.index({
  branchCode: 1,
  month: 1,
  year: 1,
});

export default mongoose.models.BranchMonthlyReport ||
  mongoose.model("BranchMonthlyReport", BranchMonthlyReportSchema);