import mongoose from "mongoose";

const EmployeeAccountSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    fullName: String,
    designation: String,
    role: String,

    mobile: { type: String, required: true }, // ✅ login uses mobile
    email: String,

    corporateSimNumber: String,
    corporateSimStatus: String,

    branchName: String,
    branchCode: Number,

    month: Number,
    year: Number,

    status: String,

    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

/* ✅ Unique employee per branch */
EmployeeAccountSchema.index(
  { employeeId: 1, branchCode: 1 },
  { unique: true }
);

/* ✅ Optional: Mobile unique (recommended) */
EmployeeAccountSchema.index(
  { mobile: 1 },
  { unique: true }
);

export default mongoose.models.EmployeeAccount ||
  mongoose.model("EmployeeAccount", EmployeeAccountSchema);