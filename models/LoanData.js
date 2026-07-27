import mongoose from "mongoose";

const LoanDataSchema = new mongoose.Schema(
  {
    uploadMonth: { type: Number, required: true },
    uploadYear: { type: Number, required: true },

    branchName: { type: String, required: true },
    branchCode: { type: Number, required: true, index: true },

    unionName: String,

    // Display purpose
    fieldAssistant: String,

    // ✅ IMPORTANT (for fast FA filtering)
    fieldAssistantId: {
      type: String,
      index: true,
    },

    samiteeName: String,
    memberOrCustomer: String,

    loanLedger: String,
    disburseDate: Date,
    disburseAmount: Number,

    principalOutstandingUptoPreMonth: Number,
    repaymentCurrentMonth: Number,

    loanStatus: String,
  },
  { timestamps: true }
);

export const LoanData =
  mongoose.models.LoanData ||
  mongoose.model("LoanData", LoanDataSchema);