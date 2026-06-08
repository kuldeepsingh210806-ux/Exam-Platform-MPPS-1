import type { Test, StudentProfile, Attempt, Violation } from "./firestore";
import { getGrade, getMotivationalFeedback } from "./ranking";

const SCHOOL = "MP Public School, Mathuranagar";
const PRIMARY = "#1a4fa0";

const baseStyles = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;background:#fff;padding:24px;font-size:13px}
  .header{background:${PRIMARY};color:#fff;padding:20px 24px;border-radius:10px;display:flex;align-items:center;gap:18px;margin-bottom:24px}
  .header img{width:64px;height:64px;border-radius:50%;border:3px solid #fff;object-fit:cover}
  .header-text h1{font-size:20px;font-weight:700}
  .header-text p{font-size:12px;opacity:.8;margin-top:3px}
  .stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
  .stat-card{border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;text-align:center}
  .stat-card .val{font-size:26px;font-weight:700;color:${PRIMARY}}
  .stat-card .lbl{font-size:11px;color:#64748b;margin-top:4px}
  .section{margin-bottom:24px}
  .section-title{font-size:15px;font-weight:700;color:${PRIMARY};border-bottom:2px solid ${PRIMARY};padding-bottom:6px;margin-bottom:12px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:${PRIMARY};color:#fff;padding:9px 10px;text-align:left;white-space:nowrap}
  td{padding:8px 10px;border-bottom:1px solid #e2e8f0}
  tr:nth-child(even) td{background:#f8fafc}
  .badge-pass{background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:12px;font-weight:600;font-size:11px}
  .badge-fail{background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:12px;font-weight:600;font-size:11px}
  .badge-grade{padding:2px 8px;border-radius:12px;font-weight:700;font-size:11px}
  .high-viol{color:#dc2626;font-weight:700}
  .gen-info{text-align:right;font-size:11px;color:#64748b;margin-bottom:16px}
  .print-btn{position:fixed;bottom:20px;right:20px;background:${PRIMARY};color:#fff;border:none;padding:12px 24px;border-radius:8px;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2)}
  @media print{.print-btn{display:none}body{padding:0}@page{margin:15mm}}
`;

function perf(pct: number) {
  if (pct >= 90) return { icon: "🟢", text: "Excellent" };
  if (pct >= 40) return { icon: "🟡", text: "Average" };
  return { icon: "🔴", text: "Needs Improvement" };
}

export function printPrincipalReport(
  tests: Test[],
  students: StudentProfile[],
  attempts: Attempt[],
  violations: Violation[],
  teacherCount = 0
) {
  const submitted = attempts.filter((a) => a.submitted);
  const passCount = submitted.filter((a) => (a.percentage ?? 0) >= 40).length;
  const passRate = submitted.length > 0 ? (passCount / submitted.length) * 100 : 0;
  const schoolAvg = submitted.length > 0
    ? submitted.reduce((s, a) => s + (a.percentage ?? 0), 0) / submitted.length : 0;

  const classes = [...new Set(students.map((s) => s.class))].sort();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN");

  const studentRows = students
    .map((s) => {
      const sAttempts = submitted.filter((a) => a.studentId === s.uid);
      const avg = sAttempts.length > 0
        ? sAttempts.reduce((acc, a) => acc + (a.percentage ?? 0), 0) / sAttempts.length : null;
      const viol = violations.filter((v) => v.studentId === s.uid).reduce((n, v) => n + v.count, 0);
      return { s, sAttempts, avg, viol };
    })
    .sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));

  const classRows = classes.map((cls) => {
    const cs = students.filter((s) => s.class === cls);
    const ca = submitted.filter((a) => cs.some((s) => s.uid === a.studentId));
    const avg = ca.length > 0 ? ca.reduce((s, a) => s + (a.percentage ?? 0), 0) / ca.length : 0;
    return { cls, students: cs.length, submissions: ca.length, avg };
  });

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <title>MPPS School Report — ${dateStr}</title>
  <style>${baseStyles}</style></head><body>
  <div class="header">
    <div class="header-text">
      <h1>${SCHOOL}</h1>
      <p>Comprehensive School Performance Report</p>
    </div>
  </div>
  <div class="gen-info">Generated on: <strong>${dateStr} at ${timeStr}</strong></div>

  <div class="stats-grid">
    <div class="stat-card"><div class="val">${students.length}</div><div class="lbl">Total Students</div></div>
    <div class="stat-card"><div class="val">${teacherCount || "—"}</div><div class="lbl">Total Teachers</div></div>
    <div class="stat-card"><div class="val">${tests.length}</div><div class="lbl">Total Tests</div></div>
    <div class="stat-card"><div class="val">${submitted.length}</div><div class="lbl">Total Submissions</div></div>
    <div class="stat-card"><div class="val">${passRate.toFixed(1)}%</div><div class="lbl">School Pass Rate</div></div>
    <div class="stat-card"><div class="val">${schoolAvg.toFixed(1)}%</div><div class="lbl">School Average</div></div>
  </div>

  <div class="section">
    <div class="section-title">📊 Class-wise Performance</div>
    <table>
      <thead><tr><th>Class</th><th>Students</th><th>Submissions</th><th>Avg Score</th><th>Performance</th></tr></thead>
      <tbody>
      ${classRows.map((r) => {
        const p = perf(r.avg);
        return `<tr>
          <td><strong>${r.cls}</strong></td>
          <td>${r.students}</td>
          <td>${r.submissions}</td>
          <td><strong>${r.avg.toFixed(1)}%</strong></td>
          <td>${p.icon} ${p.text}</td>
        </tr>`;
      }).join("")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">👤 Student-wise Performance</div>
    <table>
      <thead><tr><th>#</th><th>Student Name</th><th>Class</th><th>Roll No.</th><th>Tests Taken</th><th>Avg %</th><th>Grade</th><th>Status</th><th>Tab Switches</th></tr></thead>
      <tbody>
      ${studentRows.map((r, i) => {
        const avg = r.avg ?? 0;
        const { grade } = getGrade(avg);
        const p = perf(avg);
        return `<tr>
          <td>${i + 1}</td>
          <td><strong>${r.s.name}</strong></td>
          <td>${r.s.class} ${r.s.section}</td>
          <td>${r.s.rollNumber}</td>
          <td>${r.sAttempts.length}</td>
          <td>${r.avg !== null ? avg.toFixed(1) + "%" : "—"}</td>
          <td><span class="badge-grade" style="background:#e0e7ff;color:#3730a3">${grade}</span></td>
          <td>${r.avg !== null ? (avg >= 40
            ? '<span class="badge-pass">Pass</span>'
            : '<span class="badge-fail">Fail</span>') : "—"}</td>
          <td class="${r.viol >= 3 ? "high-viol" : ""}">${r.viol > 0 ? r.viol + (r.viol >= 3 ? " ⚠️" : "") : "0 ✅"}</td>
        </tr>`;
      }).join("")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">📋 Recent Tests Summary</div>
    <table>
      <thead><tr><th>Test Title</th><th>Subject</th><th>Class</th><th>Scheduled</th><th>Submissions</th><th>Avg Score</th><th>Status</th></tr></thead>
      <tbody>
      ${[...tests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 15).map((t) => {
        const ts = submitted.filter((a) => a.testId === t.id);
        const avg = ts.length > 0 ? ts.reduce((s, a) => s + (a.percentage ?? 0), 0) / ts.length : 0;
        return `<tr>
          <td><strong>${t.title}</strong></td>
          <td>${t.subject}</td>
          <td>${t.targetClass}</td>
          <td>${new Date(t.scheduledAt).toLocaleDateString("en-IN")}</td>
          <td>${ts.length}</td>
          <td>${ts.length > 0 ? avg.toFixed(1) + "%" : "—"}</td>
          <td>${t.published ? '<span class="badge-pass">Published</span>' : '<span style="color:#92400e;background:#fef3c7;padding:2px 8px;border-radius:12px;font-size:11px">Draft</span>'}</td>
        </tr>`;
      }).join("")}
      </tbody>
    </table>
  </div>

  <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:32px">
    ${SCHOOL} · Online Examination System · Generated ${dateStr}
  </p>
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

export function printStudentResultPDF(data: {
  studentName: string;
  admissionNumber?: string;
  rollNumber: string;
  className: string;
  testTitle: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  rank: number;
  totalInTest: number;
  timeTaken: number;
  tabSwitches: number;
  submittedAt: string;
}) {
  const { grade, color: _color } = getGrade(data.percentage);
  const feedback = getMotivationalFeedback(data.percentage);
  const p = perf(data.percentage);
  const dateStr = new Date(data.submittedAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const genDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const fmt = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <title>Result — ${data.studentName}</title>
  <style>${baseStyles}
  .result-card{max-width:640px;margin:0 auto;border:2px solid ${PRIMARY};border-radius:12px;overflow:hidden}
  .result-header{background:${PRIMARY};color:#fff;padding:24px;text-align:center}
  .result-header h2{font-size:22px;font-weight:700}
  .result-header p{opacity:.8;font-size:13px;margin-top:4px}
  .result-body{padding:24px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
  .info-item{border:1px solid #e2e8f0;border-radius:8px;padding:12px}
  .info-item .label{font-size:11px;color:#64748b;margin-bottom:3px}
  .info-item .value{font-size:15px;font-weight:700;color:#1a1a1a}
  .score-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:20px;text-align:center}
  .score-row .val{font-size:22px;font-weight:700;color:${PRIMARY}}
  .score-row .lbl{font-size:11px;color:#64748b;margin-top:3px}
  .feedback-box{border-left:4px solid ${PRIMARY};background:#eff6ff;padding:14px 16px;border-radius:0 8px 8px 0;margin:16px 0;font-size:14px;line-height:1.6}
  .perf-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-weight:700;font-size:13px;background:#f1f5f9;margin:8px 0}
  </style></head><body>
  <div class="result-card">
    <div class="result-header">
      <h2>${SCHOOL}</h2>
      <p>Official Examination Result Certificate</p>
    </div>
    <div class="result-body">
      <div class="info-grid">
        <div class="info-item"><div class="label">Student Name</div><div class="value">${data.studentName}</div></div>
        <div class="info-item"><div class="label">Class</div><div class="value">${data.className}</div></div>
        ${data.admissionNumber ? `<div class="info-item"><div class="label">Admission No.</div><div class="value">${data.admissionNumber}</div></div>` : ""}
        <div class="info-item"><div class="label">Roll Number</div><div class="value">${data.rollNumber}</div></div>
        <div class="info-item"><div class="label">Test Name</div><div class="value">${data.testTitle}</div></div>
        <div class="info-item"><div class="label">Subject</div><div class="value">${data.subject}</div></div>
        <div class="info-item"><div class="label">Date</div><div class="value">${dateStr}</div></div>
        <div class="info-item"><div class="label">Time Taken</div><div class="value">${fmt(data.timeTaken)}</div></div>
      </div>

      <div class="score-row">
        <div><div class="val">${data.score}/${data.totalMarks}</div><div class="lbl">Score</div></div>
        <div><div class="val">${data.percentage.toFixed(1)}%</div><div class="lbl">Percentage</div></div>
        <div><div class="val">${data.rank > 0 ? `#${data.rank}/${data.totalInTest}` : "—"}</div><div class="lbl">Rank</div></div>
        <div><div class="val">${grade}</div><div class="lbl">Grade</div></div>
      </div>

      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
        <span class="${data.percentage >= 40 ? "badge-pass" : "badge-fail"}" style="font-size:13px;padding:6px 16px">
          ${data.percentage >= 40 ? "✅ PASS" : "❌ FAIL"}
        </span>
        <span class="perf-badge">${p.icon} ${p.text} Performance</span>
        <span style="font-size:12px;color:${data.tabSwitches >= 3 ? "#dc2626" : "#64748b"}">
          ${data.tabSwitches === 0 ? "🔒 Clean Integrity" : `⚠️ Tab Switches: ${data.tabSwitches}`}
        </span>
      </div>

      <div class="feedback-box">${feedback}</div>

      <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:20px">
        Generated on ${genDate} · ${SCHOOL} · Online Examination System
      </p>
    </div>
  </div>
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}
