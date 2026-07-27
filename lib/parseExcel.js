import * as XLSX from "xlsx";

export function parseExcelFile(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

  // Sheet 1 - Loan Data
  const sheet1Name = workbook.SheetNames[0];
  const sheet1 = workbook.Sheets[sheet1Name];
  const loanRawData = XLSX.utils.sheet_to_json(sheet1, { defval: "" });

  // Sheet 2 - Employee Summary
  const sheet2Name = workbook.SheetNames[1];
  const sheet2 = workbook.Sheets[sheet2Name];
  const employeeRawData = XLSX.utils.sheet_to_json(sheet2, { defval: "" });

  // Loan Data ম্যাপ করা
  const loanData = loanRawData.map((row) => ({
    branchName: row["Branch Name"] || "",
    unionName: row["Union Name"] || "",
    fieldAssistant: row["Field Assistant"] || "",
    samiteeName: row["Samitee Name"] || "",
    memberOrCustomer: row["Member Or Customer"] || "",
    depositUptoPreMonth: parseFloat(row["Deposit Upto Pre Month"]) || 0,
    depositCurrentMonth: parseFloat(row["Deposit Current Month"]) || 0,
    depositStatus: row["Deposit Status"] || "",
    loanLedger: row["Loan Ledger"] || "",
    disburseDate: row["Disburse Date"] ? new Date(row["Disburse Date"]) : null,
    disburseAmount: parseFloat(row["Disburse Amount"]) || 0,
    paidPrincipalUptoPreMonth: parseFloat(row["Paid Principal Upto Pre Month"]) || 0,
    paidInterestUptoPreMonth: parseFloat(row["Paid Interest Upto Pre Month"]) || 0,
    principalOutstandingUptoPreMonth: parseFloat(row["Principal Outstanding Upto Pre Month"]) || 0,
    repaymentCurrentMonth: parseFloat(row["Repayment Current Month"]) || 0,
    loanStatus: row["Loan Status"] || "",
    clStatus: row["CL Status"] || "",
    cssMfs: row["CSS MFS"] || "",
  }));

  // Employee Data ম্যাপ করা
  const employeeData = employeeRawData.map((row) => ({
    branchName: row["Branch Name"] || "",
    employeeName: row["Employee Name"] || "",
    mobile: row["Mobile"] || "",
    email: row["Email"] || "",
    samiteeCount: parseFloat(row["Samitee Count"]) || 0,
    totalMember: parseFloat(row["Total Member"]) || 0,
    loaneeMember: parseFloat(row["Loanee Member"]) || 0,
    depositUptoPreMonth: parseFloat(row["Deposit Upto Pre Month"]) || 0,
    depositCurrentMonth: parseFloat(row["Deposit Current Month"]) || 0,
    currentMonthDisburse: parseFloat(row["Current Month Disburse"]) || 0,
    principalOsUptoPreMonth: parseFloat(row["Principal Os Upto Pre Month"]) || 0,
    repaymentCurrentMonth: parseFloat(row["Repayment Current Month"]) || 0,
    classifiedLoan: parseFloat(row["Classified Loan"]) || 0,
  }));

  return { loanData, employeeData };
}