export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sendMail } from "@/lib/sendMail";

export async function POST(req) {
  try {
    const { to, subject, message } = await req.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "সব তথ্য আবশ্যক" },
        { status: 400 }
      );
    }

    await sendMail({
      to,
      subject,
      html: `<p>${message}</p>`,
    });

    return NextResponse.json({
      success: true,
      message: "মেইল সফলভাবে পাঠানো হয়েছে",
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}