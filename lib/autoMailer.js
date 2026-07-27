import cron from "node-cron";
import connectDB from "@/lib/mongodb";
import { LoanData } from "@/models/LoanData";
import { sendEmail } from "@/lib/sendEmail";

cron.schedule("0 9 * * 0-4", async () => {
  console.log("⏰ Running Daily Loan Reminder...");

  try {
    await connectDB();

    const today = new Date();

    // ✅ ১ বছর আগে যাদের disburseDate ছিল
    const oneYearAgo = new Date(
      today.getFullYear() - 1,
      today.getMonth(),
      today.getDate()
    );

    const loans = await LoanData.find({
      disburseDate: {
        $gte: new Date(oneYearAgo.setHours(0, 0, 0, 0)),
        $lte: new Date(oneYearAgo.setHours(23, 59, 59, 999)),
      },
    }).lean();

    if (!loans.length) {
      console.log("No reminders today");
      return;
    }

    // ✅ Group by Field Assistant
    const grouped = {};

    loans.forEach((loan) => {
      if (!grouped[loan.fieldAssistant]) {
        grouped[loan.fieldAssistant] = [];
      }
      grouped[loan.fieldAssistant].push(loan);
    });

    for (const fa in grouped) {
      const members = grouped[fa];

      const email = "fa@example.com"; // ✅ এখানে FA email mapping করবেন

      await sendEmail(email, fa, members, today);
    }

    console.log("✅ Daily Reminder Completed");

  } catch (error) {
    console.error("Auto mail error:", error);
  }
});