import { Attempt } from "./firestore";

export function getGrade(p: number): { grade: string; color: string } {
  if (p >= 90) return { grade: "A+", color: "bg-green-100 text-green-800" };
  if (p >= 75) return { grade: "A",  color: "bg-green-100 text-green-700" };
  if (p >= 60) return { grade: "B",  color: "bg-blue-100 text-blue-800"  };
  if (p >= 40) return { grade: "C",  color: "bg-yellow-100 text-yellow-800" };
  return          { grade: "F",  color: "bg-red-100 text-red-800"    };
}

export function getRemarks(p: number): string {
  if (p >= 90) return "Outstanding!";
  if (p >= 75) return "Excellent!";
  if (p >= 60) return "Good";
  if (p >= 40) return "Satisfactory";
  return "Needs Improvement";
}

export function getMotivationalFeedback(p: number): string {
  if (p >= 90) return "🏆 Outstanding performance! Keep aiming higher and continue your excellent work.";
  if (p >= 75) return "🌟 Great job! You are performing very well. A little more effort can take you to the top.";
  if (p >= 60) return "📈 Nice progress! Keep practicing consistently and your scores will improve further.";
  if (p >= 40) return "💪 You can do better. Focus on your weak areas and keep learning every day.";
  return "🚀 Don't give up. Every topper starts with improvement. Review your mistakes and try again with confidence.";
}

// Competition ranking: 100,100,98 → 1,1,3
export function computeTestRanks(attempts: Attempt[]): Map<string, number> {
  const submitted = attempts.filter((a) => a.submitted);
  const sorted = [...submitted].sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0));
  const rankMap = new Map<string, number>();
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && (sorted[i].percentage ?? 0) < (sorted[i - 1].percentage ?? 0)) {
      rank = i + 1;
    }
    rankMap.set(sorted[i].id, rank);
  }
  return rankMap;
}

// Overall rank for a student across all their submitted attempts (by average %)
export function computeOverallRank(studentId: string, allAttempts: Attempt[]): number {
  const submitted = allAttempts.filter((a) => a.submitted);
  const studentMap = new Map<string, number[]>();
  for (const a of submitted) {
    if (!studentMap.has(a.studentId)) studentMap.set(a.studentId, []);
    studentMap.get(a.studentId)!.push(a.percentage ?? 0);
  }
  const avgs = Array.from(studentMap.entries()).map(([sid, pcts]) => ({
    sid,
    avg: pcts.reduce((s, p) => s + p, 0) / pcts.length,
  }));
  avgs.sort((a, b) => b.avg - a.avg);
  let rank = 1;
  for (let i = 0; i < avgs.length; i++) {
    if (i > 0 && avgs[i].avg < avgs[i - 1].avg) rank = i + 1;
    if (avgs[i].sid === studentId) return rank;
  }
  return -1;
}
