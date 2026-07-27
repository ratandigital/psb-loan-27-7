// আজকের তারিখে ঠিক ১ বছর আগে যাদের Disburse Date
export function getLoanAnniversaryMembers(loanData, targetDate = new Date()) {
  const oneYearAgo = new Date(targetDate);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const filtered = loanData.filter((member) => {
    if (!member.disburseDate) return false;

    const disburse = new Date(member.disburseDate);

    return (
      disburse.getDate() === oneYearAgo.getDate() &&
      disburse.getMonth() === oneYearAgo.getMonth() &&
      disburse.getFullYear() === oneYearAgo.getFullYear()
    );
  });

  // Field Assistant ভিত্তিক গ্রুপ করা
  const grouped = {};
  filtered.forEach((member) => {
    const fa = member.fieldAssistant;
    if (!grouped[fa]) {
      grouped[fa] = [];
    }
    grouped[fa].push(member);
  });

  return grouped;
}