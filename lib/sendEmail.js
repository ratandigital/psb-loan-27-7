import axios from "axios";
import connectDB from "@/lib/mongodb";
import MailLog from "@/models/MailLog";

/* ===========================
   ✅ HTML EMAIL TEMPLATE
=========================== */
function generateEmailHTML(faName, members, date) {
  const dateStr = date.toLocaleDateString("bn-BD");

  const rows = members
    .map(
      (m, i) => `
      <tr style="background:${i % 2 === 0 ? "#f0fdf4" : "#ffffff"}">
        <td style="padding:10px;border:1px solid #e5e7eb;">${i + 1}</td>
        <td style="padding:10px;border:1px solid #e5e7eb;font-weight:600;color:#065f46;">
          ${m.memberOrCustomer}
        </td>
        <td style="padding:10px;border:1px solid #e5e7eb;">${m.loanLedger || "-"}
        </td>
        <td style="padding:10px;border:1px solid #e5e7eb;">${m.samiteeName || "-"}
        </td>
        <td style="padding:10px;border:1px solid #e5e7eb;">${m.branchName || "-"}
        </td>
        <td style="padding:10px;border:1px solid #e5e7eb;color:#16a34a;font-weight:bold;">
          ৳${m.disburseAmount?.toLocaleString() || "0"}
        </td>
        <td style="padding:10px;border:1px solid #e5e7eb;color:#dc2626;font-weight:bold;">
          ৳${m.principalOutstandingUptoPreMonth?.toLocaleString() || "0"}
        </td>
        <td style="padding:10px;border:1px solid #e5e7eb;">
          <span style="
            background:${m.loanStatus === "ACT" ? "#16a34a" : "#dc2626"};
            color:white;
            padding:4px 12px;
            border-radius:20px;
            font-size:12px;">
            ${m.loanStatus || "N/A"}
          </span>
        </td>
      </tr>
    `
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
  </head>
  <body style="font-family:Segoe UI, Arial; background:#f9fafb; padding:20px;">
    
    <div style="max-width:900px;margin:0 auto;background:white;border-radius:12px;
      overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.05);">
      
      <!-- Header -->
      <div style="background:linear-gradient(90deg,#065f46,#16a34a);
        color:white;padding:20px;">
        <h2 style="margin:0;">🔔 ঋণ নবায়ন রিমাইন্ডার</h2>
        <p style="margin:5px 0 0 0;opacity:0.9;">তারিখ: ${dateStr}</p>
      </div>

      <!-- Info Box -->
      <div style="padding:20px;background:#ecfdf5;">
        <p style="margin:0;font-size:15px;">
          <strong>Field Assistant:</strong> 
          <span style="color:#065f46;">${faName}</span>
        </p>
        <p style="margin:8px 0 0 0;color:#374151;">
          আজ <strong style="color:#16a34a;">${members.length} জন</strong> Member এর ঋণ বিতরণের ১ বছর পূর্ণ হচ্ছে।
          অনুগ্রহ করে তাদের সাথে যোগাযোগ করুন।
        </p>
      </div>

      <!-- Table -->
      <div style="padding:20px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#16a34a;color:white;">
              <th style="padding:10px;border:1px solid #ddd;">#</th>
              <th style="padding:10px;border:1px solid #ddd;">Member</th>
              <th style="padding:10px;border:1px solid #ddd;">Ledger</th>
              <th style="padding:10px;border:1px solid #ddd;">Samitee</th>
              <th style="padding:10px;border:1px solid #ddd;">Branch</th>
              <th style="padding:10px;border:1px solid #ddd;">বিতরণ</th>
              <th style="padding:10px;border:1px solid #ddd;">বকেয়া</th>
              <th style="padding:10px;border:1px solid #ddd;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div style="background:#f3f4f6;padding:15px;text-align:center;
        font-size:12px;color:#6b7280;">
        এই মেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। সরাসরি রিপ্লাই করবেন না।
      </div>

    </div>

  </body>
  </html>
  `;
}

/* ===========================
   ✅ SEND EMAIL FUNCTION
=========================== */

export async function sendEmail(
  to,
  faName,
  members,
  date,
  branchCode
) {
  await connectDB();

  const subject = `ঋণ নবায়ন রিমাইন্ডার - ${faName} - ${date.toLocaleDateString(
    "bn-BD"
  )}`;

  const html = generateEmailHTML(faName, members, date);

  const alertDate = new Date(date);
  alertDate.setHours(0, 0, 0, 0);

  let status = "SUCCESS";
  let errorMessage = null;
  let apiResponse = null;

  try {
    const response = await axios.post(
      "https://wisesender.in/api/send-email",
      {
        api_key: process.env.WISESENDER_API_KEY,
        from: process.env.WISESENDER_EMAIL,
        to,
        subject,
        html,
      }
    );

    apiResponse = response.data;

    if (!response.data || response.data.status === "error") {
      status = "FAILED";
      errorMessage =
        response.data?.message || "WiseSender API Error";
    }

  } catch (error) {
    status = "FAILED";
    errorMessage = error.message;
  }

  /* ✅ Always Save MailLog */
  try {
    await MailLog.create({
      branchCode,
      fieldAssistant: faName,
      alertDate,
      to,
      subject,
      totalMembers: members.length,
      status,
      errorMessage,
    });
  } catch (dbError) {
    console.error("❌ MailLog Save Failed:", dbError);
  }

  return {
    success: status === "SUCCESS",
    error: errorMessage,
    data: apiResponse,
  };
}