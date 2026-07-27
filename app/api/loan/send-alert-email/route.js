export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import EmployeeAccount from "@/models/EmployeeAccount";
import MailLog from "@/models/MailLog";
import nodemailer from "nodemailer";

export async function POST(req) {
  console.log("✅ POST /api/loan/send-alert-email called");

  await connectDB();

  try {
    /* ===========================
       ✅ 1️⃣ Auth
    ============================ */
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const branchCode = Number(decoded.branchCode);

    /* ===========================
       ✅ 2️⃣ Request Body
    ============================ */
    const { fieldAssistant, loans } = await req.json();

    if (!fieldAssistant || !loans || loans.length === 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    /* ===========================
       ✅ 3️⃣ Extract Employee ID
    ============================ */
    const idMatch = fieldAssistant.match(/\((.*?)\)/);
    const employeeId = idMatch ? idMatch[1] : null;

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID not found" },
        { status: 400 }
      );
    }

    /* ===========================
       ✅ 4️⃣ Find Employee
    ============================ */
    const employee = await EmployeeAccount.findOne({
      employeeId,
      branchCode,
    });

    if (!employee || !employee.email) {
      return NextResponse.json(
        { error: "Employee email not found" },
        { status: 404 }
      );
    }

    /* ===========================
       ✅ 5️⃣ Create Responsive HTML
    ============================ */
    const today = new Date().toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // ✅ Desktop Table Rows
    const tableRows = loans
      .map(
        (loan, index) => `
        <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f9fafb"};">
          <td style="
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #374151;
            font-weight: 600;
          ">${index + 1}</td>
          <td style="
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            color: #111827;
          ">${loan.memberOrCustomer}</td>
          <td style="
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            color: #374151;
          ">${loan.samiteeName}</td>
          <td style="
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            color: #dc2626;
            font-weight: 600;
            white-space: nowrap;
          ">${new Date(loan.overdueDate).toLocaleDateString("bn-BD")}</td>
          <td style="
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            color: #065f46;
            font-weight: 700;
            text-align: right;
            white-space: nowrap;
          ">৳ ${loan.principalOutstandingUptoPreMonth?.toLocaleString("bn-BD")}</td>
        </tr>
      `
      )
      .join("");

    // ✅ Mobile Card Items
    const mobileCards = loans
      .map(
        (loan, index) => `
        <div style="
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          ">
            <span style="
              background: #1d4ed8;
              color: #fff;
              font-size: 12px;
              font-weight: 700;
              padding: 3px 10px;
              border-radius: 999px;
            ">#${index + 1}</span>
            <span style="
              color: #dc2626;
              font-size: 12px;
              font-weight: 600;
            ">খেলাপি তারিখ: ${new Date(loan.overdueDate).toLocaleDateString("bn-BD")}</span>
          </div>

          <p style="margin: 0 0 6px; font-size: 15px; font-weight: 700; color: #111827;">
            ${loan.memberOrCustomer}
          </p>
          <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">
            সমিতি: <strong style="color: #374151;">${loan.samiteeName}</strong>
          </p>
          <p style="
            margin: 10px 0 0;
            font-size: 15px;
            font-weight: 700;
            color: #065f46;
            background: #ecfdf5;
            padding: 8px 12px;
            border-radius: 8px;
            text-align: right;
          ">
            বকেয়া: ৳ ${loan.principalOutstandingUptoPreMonth?.toLocaleString("bn-BD")}
          </p>
        </div>
      `
      )
      .join("");

    // ✅ Full Responsive HTML Email
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
      <title>খেলাপি সতর্কবার্তা</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
      <style>
        /* ✅ Bengali Font Support */
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');

        body {
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
          font-family: 'Hind Siliguri', Arial, sans-serif;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }

        /* ✅ Mobile: hide table, show cards */
        @media only screen and (max-width: 600px) {
          .desktop-table { display: none !important; }
          .mobile-cards { display: block !important; }
          .email-wrapper { padding: 12px !important; }
          .email-body { padding: 20px 16px !important; }
          .header-title { font-size: 18px !important; }
          .summary-box { flex-direction: column !important; }
          .summary-item { margin-bottom: 12px !important; }
        }

        /* ✅ Desktop: show table, hide cards */
        @media only screen and (min-width: 601px) {
          .mobile-cards { display: none !important; }
          .desktop-table { display: table !important; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper" style="
        max-width: 680px;
        margin: 0 auto;
        padding: 24px 16px;
        background-color: #f3f4f6;
      ">

        <!-- ✅ HEADER -->
        <div style="
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          border-radius: 16px 16px 0 0;
          padding: 32px 32px 28px;
          text-align: center;
        ">
          <div style="
            display: inline-block;
            background: rgba(255,255,255,0.15);
            border-radius: 50%;
            width: 56px;
            height: 56px;
            line-height: 56px;
            font-size: 28px;
            margin-bottom: 14px;
          ">⚠️</div>

          <h1 class="header-title" style="
            margin: 0 0 8px;
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
            line-height: 1.3;
          ">আগামীকাল খেলাপি সতর্কবার্তা</h1>

          <p style="
            margin: 0;
            color: #bfdbfe;
            font-size: 13px;
          ">তারিখ: ${today}</p>
        </div>

        <!-- ✅ BODY -->
        <div class="email-body" style="
          background: #ffffff;
          padding: 32px;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
        ">
          <!-- Greeting -->
          <p style="
            margin: 0 0 20px;
            font-size: 16px;
            color: #1f2937;
            line-height: 1.6;
          ">
            প্রিয় <strong style="color: #1d4ed8;">${employee.fullName}</strong>,
            <br/>
            নিচের তালিকাভুক্ত ঋণগ্রহীতাদের ঋণ <strong style="color: #dc2626;">আগামীকাল খেলাপি</strong> হওয়ার সম্ভাবনা রয়েছে। অনুগ্রহ করে প্রয়োজনীয় ব্যবস্থা নিন।
          </p>

          <!-- Summary Cards -->
          <div style="
            display: flex;
            gap: 16px;
            margin-bottom: 28px;
            background: #eff6ff;
            border-radius: 12px;
            padding: 16px;
          ">
            <div style="
              flex: 1;
              text-align: center;
              padding: 12px;
              background: #ffffff;
              border-radius: 10px;
              border: 1px solid #dbeafe;
            ">
              <div style="font-size: 28px; font-weight: 700; color: #1d4ed8;">
                ${loans.length}
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                মোট ঋণ
              </div>
            </div>
            <div style="
              flex: 1;
              text-align: center;
              padding: 12px;
              background: #ffffff;
              border-radius: 10px;
              border: 1px solid #d1fae5;
            ">
              <div style="font-size: 20px; font-weight: 700; color: #065f46;">
                ৳ ${loans
                  .reduce(
                    (sum, l) =>
                      sum + (l.principalOutstandingUptoPreMonth || 0),
                    0
                  )
                  .toLocaleString("bn-BD")}
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                মোট বকেয়া
              </div>
            </div>
          </div>

          <!-- Alert Banner -->
          <div style="
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-left: 4px solid #dc2626;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 24px;
            font-size: 13px;
            color: #991b1b;
          ">
            🔴 এই সতর্কবার্তা স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। অনুগ্রহ করে দ্রুত পদক্ষেপ নিন।
          </div>

          <!-- ✅ DESKTOP TABLE -->
          <div class="desktop-table" style="overflow-x: auto;">
            <table style="
              width: 100%;
              border-collapse: collapse;
              border-radius: 10px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
              font-size: 14px;
            ">
              <thead>
                <tr style="background: linear-gradient(135deg, #1d4ed8, #1e40af);">
                  <th style="padding: 14px 16px; color: #fff; text-align: center; font-weight: 600; width: 40px;">#</th>
                  <th style="padding: 14px 16px; color: #fff; text-align: left; font-weight: 600;">সদস্য/গ্রাহক</th>
                  <th style="padding: 14px 16px; color: #fff; text-align: left; font-weight: 600;">সমিতি</th>
                  <th style="padding: 14px 16px; color: #fff; text-align: left; font-weight: 600; white-space: nowrap;">খেলাপি তারিখ</th>
                  <th style="padding: 14px 16px; color: #fff; text-align: right; font-weight: 600; white-space: nowrap;">বকেয়া (৳)</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
              <tfoot>
                <tr style="background: #f0fdf4;">
                  <td colspan="4" style="
                    padding: 14px 16px;
                    font-weight: 700;
                    color: #065f46;
                    font-size: 14px;
                    border-top: 2px solid #d1fae5;
                  ">মোট বকেয়া</td>
                  <td style="
                    padding: 14px 16px;
                    font-weight: 700;
                    color: #065f46;
                    font-size: 15px;
                    text-align: right;
                    border-top: 2px solid #d1fae5;
                    white-space: nowrap;
                  ">৳ ${loans
                    .reduce(
                      (sum, l) =>
                        sum + (l.principalOutstandingUptoPreMonth || 0),
                      0
                    )
                    .toLocaleString("bn-BD")}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- ✅ MOBILE CARDS -->
          <div class="mobile-cards" style="display: none;">
            ${mobileCards}

            <!-- Mobile Total -->
            <div style="
              background: #f0fdf4;
              border: 1px solid #d1fae5;
              border-radius: 10px;
              padding: 14px 16px;
              text-align: right;
              font-size: 16px;
              font-weight: 700;
              color: #065f46;
              margin-top: 4px;
            ">
              মোট বকেয়া: ৳ ${loans
                .reduce(
                  (sum, l) =>
                    sum + (l.principalOutstandingUptoPreMonth || 0),
                  0
                )
                .toLocaleString("bn-BD")}
            </div>
          </div>

          <!-- Note -->
          <div style="
            margin-top: 28px;
            padding: 14px 16px;
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 8px;
            font-size: 13px;
            color: #92400e;
            line-height: 1.6;
          ">
            📌 <strong>নোট:</strong> এই তালিকাটি স্বয়ংক্রিয়ভাবে তৈরি করা হয়েছে। কোনো সমস্যা হলে শাখা ব্যবস্থাপকের সাথে যোগাযোগ করুন।
          </div>
        </div>

        <!-- ✅ FOOTER -->
        <div style="
          background: #1f2937;
          border-radius: 0 0 16px 16px;
          padding: 24px 32px;
          text-align: center;
        ">
          <p style="
            margin: 0 0 8px;
            color: #ffffff;
            font-size: 15px;
            font-weight: 600;
          ">LoanTrack System</p>
          <p style="
            margin: 0 0 12px;
            color: #9ca3af;
            font-size: 12px;
          ">এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। সরাসরি উত্তর দেবেন না।</p>
          <div style="
            border-top: 1px solid #374151;
            padding-top: 12px;
            color: #6b7280;
            font-size: 11px;
          ">
            © ${new Date().getFullYear()} LoanTrack | Branch Code: ${branchCode}
          </div>
        </div>

      </div>
    </body>
    </html>
    `;

    /* ===========================
       ✅ 6️⃣ Send Mail
    ============================ */
    let status = "SUCCESS";
    let errorMessage = null;

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"LoanTrack Alert" <${process.env.SMTP_USER}>`,
        to: employee.email,
        subject: `⚠️ আগামীকাল খেলাপি সতর্কবার্তা — ${loans.length}টি ঋণ`,
        html: htmlContent,
      });

      console.log("✅ Email Sent Successfully");
    } catch (mailError) {
      status = "FAILED";
      errorMessage = mailError.message;
      console.error("❌ Mail Send Failed:", mailError);
    }

    /* ===========================
       ✅ 7️⃣ Save MailLog (Always)
    ============================ */
    await MailLog.create({
      to: employee.email,
      faName: employee.fullName,
      subject: "আগামীকাল খেলাপি সতর্কবার্তা",
      totalMembers: loans.length,
      status,
      errorMessage,
      branchCode,
    });

    if (status === "FAILED") {
      return NextResponse.json(
        { error: "Email send failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ EMAIL ERROR:", error);
    return NextResponse.json(
      { error: "Email send failed" },
      { status: 500 }
    );
  }
}