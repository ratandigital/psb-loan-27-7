import mongoose from "mongoose";

const DailyBranchReportSchema = new mongoose.Schema(
  {
    branchCode: { type: Number, required: true },
    branchName: String,

    reportDate: { type: Date, required: true },

    fieldAssistantId: { type: String, required: true },
    fieldAssistantName: String,

    newMember: Number,
    dpsCount: Number,
    dpsAmount: Number,
    collection: Number,
    total: Number,

    runningLoan: Number,
    disburse: Number,
    loanOutstanding: Number,
  },
  { timestamps: true }
);

DailyBranchReportSchema.index(
  { branchCode: 1, reportDate: 1, fieldAssistantId: 1 },
  { unique: true }
);

export default mongoose.models.DailyBranchReport ||
  mongoose.model("DailyBranchReport", DailyBranchReportSchema);