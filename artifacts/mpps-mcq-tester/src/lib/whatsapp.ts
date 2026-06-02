import { SharingHistory, generateId, saveSharingHistory } from "./firestore";
import { getGrade, getRemarks } from "./ranking";

export interface WhatsAppResultData {
  studentName: string;
  rollNumber: string;
  admissionNumber?: string;
  className: string;
  testTitle: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  rank: number;
  totalStudents: number;
  submittedAt: string;
  tabSwitches?: number;
  integrityStatus?: string;
}

export function buildResultMessage(d: WhatsAppResultData): string {
  const { grade } = getGrade(d.percentage);
  const remark = getRemarks(d.percentage);
  const date = new Date(d.submittedAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const lines = [
    `🏫 *MP Public School, Mathuranagar*`,
    `📝 *Result Notification*`,
    ``,
    `👤 Student: *${d.studentName}*`,
    ...(d.admissionNumber ? [`🪪 Adm. No.: ${d.admissionNumber}`] : []),
    `📋 Roll No: ${d.rollNumber}`,
    `🎓 Class: ${d.className}`,
    ``,
    `📚 Test: *${d.testTitle}*`,
    `📖 Subject: ${d.subject}`,
    `📅 Date: ${date}`,
    ``,
    `📊 Marks: *${d.score}/${d.totalMarks}*`,
    `📈 Percentage: *${d.percentage.toFixed(1)}%*`,
    `🏆 Rank: *${d.rank} / ${d.totalStudents}*`,
    `⭐ Grade: *${grade}*`,
    `✅ Status: *${d.percentage >= 40 ? "PASS ✅" : "FAIL ❌"}*`,
  ];
  if (d.tabSwitches !== undefined) {
    lines.push(`🔒 Integrity: *${d.integrityStatus ?? (d.tabSwitches === 0 ? "Clean" : "Violations: " + d.tabSwitches)}*`);
  }
  lines.push(``, `💬 ${remark}`, ``, `_MP Public School Online Exam System_`);
  return lines.join("\n");
}

export function buildClassResultMessage(
  className: string,
  testTitle: string,
  subject: string,
  results: { name: string; score: number; totalMarks: number; percentage: number; rank: number }[]
): string {
  const sorted = [...results].sort((a, b) => a.rank - b.rank);
  const avg = results.reduce((s, r) => s + r.percentage, 0) / (results.length || 1);
  const passed = results.filter((r) => r.percentage >= 40).length;

  const lines = [
    `🏫 *MP Public School, Mathuranagar*`,
    `📝 *Class Result Summary*`,
    ``,
    `🎓 Class: *${className}*`,
    `📚 Test: *${testTitle}*`,
    `📖 Subject: ${subject}`,
    ``,
    `📊 *Summary*`,
    `Total Students: ${results.length}`,
    `Class Average: ${avg.toFixed(1)}%`,
    `Passed: ${passed} / ${results.length}`,
    ``,
    `🏆 *Rankings*`,
  ];
  sorted.forEach((r) => {
    lines.push(`${r.rank}. ${r.name} — ${r.score}/${r.totalMarks} (${r.percentage.toFixed(1)}%)`);
  });
  lines.push(``, `_MP Public School Online Exam System_`);
  return lines.join("\n");
}

export function shareOnWhatsApp(message: string, phone?: string) {
  const encoded = encodeURIComponent(message);
  if (phone) {
    const cleaned = phone.replace(/\D/g, "");
    const intl = cleaned.length === 10 ? `91${cleaned}` : cleaned;
    window.open(`https://wa.me/${intl}?text=${encoded}`, "_blank");
  } else {
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  }
}

export async function shareAndLog(
  message: string,
  historyData: Omit<SharingHistory, "id" | "message">,
  phone?: string
) {
  shareOnWhatsApp(message, phone);
  await saveSharingHistory({ ...historyData, id: generateId(), message, phone });
}
