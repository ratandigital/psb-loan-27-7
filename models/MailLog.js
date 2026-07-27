import mongoose from "mongoose";

const MailLogSchema = new mongoose.Schema(
  {
    branchCode: Number,
    fieldAssistant: String,
    alertDate: Date,

    to: String,
    faName: String,
    totalMembers: Number,
    subject: String,

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
    },

    errorMessage: String,
  },
  { timestamps: true }
);

export default mongoose.models.MailLog ||
  mongoose.model("MailLog", MailLogSchema);