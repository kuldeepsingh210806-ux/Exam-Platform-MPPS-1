import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot,
  writeBatch, limit,
} from "firebase/firestore";
import { db } from "./firebase";

export type StudentProfile = {
  uid: string;
  name: string;
  admissionNumber?: string;
  class: string;
  section: string;
  rollNumber: string;
  mobile: string;
  createdAt: string;
};

export type TeacherProfile = {
  uid: string;
  name: string;
  mobile: string;
  subject: string;
  assignedClasses?: string[];
  createdAt: string;
};

export type MCQQuestion = {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  marks: number;
};

export type Test = {
  id: string;
  title: string;
  subject: string;
  class: string;
  targetClass: string;
  duration: number;
  totalMarks: number;
  scheduledAt: string;
  endsAt: string;
  createdAt: string;
  createdBy: string;
  questions: MCQQuestion[];
  published: boolean;
  isActive?: boolean;
};

export type Attempt = {
  id: string;
  testId: string;
  studentId: string;
  answers: Record<string, string>;
  currentQuestion: number;
  startedAt: string;
  submitted: boolean;
  submittedAt?: string;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  timeTaken?: number;
  violations: number;
};

export type Notice = {
  id: string;
  title: string;
  content: string;
  targetAudience: "All" | "Students" | "Teachers";
  targetClasses?: string[];
  author: string;
  authorRole?: "principal" | "teacher";
  teacherId?: string;
  createdAt: string;
};

export type Violation = {
  id: string;
  studentId: string;
  testId: string;
  type: string;
  count: number;
  autoSubmitted: boolean;
  lastViolationAt?: string;
};

export type SharingHistory = {
  id: string;
  type: "individual" | "class";
  studentId?: string;
  studentName?: string;
  className?: string;
  testId: string;
  testTitle: string;
  sharedBy: string;
  sharedAt: string;
  message: string;
  phone?: string;
};

export const SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Hindi",
  "SST",
  "Business Studies",
  "Accountancy",
  "Economics",
  "Computer Science",
] as const;

export const CLASSES = [
  "3rd","4th","5th","6th","7th","8th","9th","10th",
  "11th Bio","11th Commerce","11th Maths",
  "12th Bio","12th Commerce","12th Maths",
] as const;

// ── Students ──────────────────────────────────────────────────────────────────
export async function saveStudentProfile(uid: string, data: Omit<StudentProfile, "uid">) {
  await setDoc(doc(db, "students", uid), { uid, ...data });
}
export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {
  const snap = await getDoc(doc(db, "students", uid));
  return snap.exists() ? (snap.data() as StudentProfile) : null;
}
export async function updateStudentProfile(uid: string, data: Partial<Omit<StudentProfile, "uid">>) {
  await updateDoc(doc(db, "students", uid), data as Record<string, unknown>);
}
export async function getAllStudents(): Promise<StudentProfile[]> {
  const snap = await getDocs(collection(db, "students"));
  return snap.docs.map((d) => d.data() as StudentProfile).filter((s) => s && s.uid);
}
export function listenStudents(cb: (students: StudentProfile[]) => void) {
  return onSnapshot(collection(db, "students"), (snap) => {
    cb(snap.docs.map((d) => d.data() as StudentProfile).filter((s) => s && s.uid));
  });
}
export async function deleteStudentProfile(uid: string) {
  await deleteDoc(doc(db, "students", uid));
}

// ── Teachers ──────────────────────────────────────────────────────────────────
export async function saveTeacherProfile(uid: string, data: Omit<TeacherProfile, "uid">) {
  await setDoc(doc(db, "teachers", uid), { uid, ...data });
}
export async function getTeacherProfile(uid: string): Promise<TeacherProfile | null> {
  const snap = await getDoc(doc(db, "teachers", uid));
  return snap.exists() ? (snap.data() as TeacherProfile) : null;
}
export function listenTeachers(cb: (teachers: TeacherProfile[]) => void) {
  return onSnapshot(collection(db, "teachers"), (snap) => {
    cb(snap.docs.map((d) => d.data() as TeacherProfile));
  });
}
export async function deleteTeacherProfile(uid: string) {
  await deleteDoc(doc(db, "teachers", uid));
}

// ── Tests ─────────────────────────────────────────────────────────────────────
export async function saveTest(test: Test) {
  await setDoc(doc(db, "tests", test.id), test);
}
export async function updateTest(testId: string, data: Partial<Test>) {
  await updateDoc(doc(db, "tests", testId), data as Record<string, unknown>);
}
export async function deleteTest(testId: string) {
  await deleteDoc(doc(db, "tests", testId));
}
export async function getAllTests(): Promise<Test[]> {
  console.log("[MPPS] getAllTests: fetching all tests from Firestore");
  const snap = await getDocs(collection(db, "tests"));
  const tests = snap.docs.map((d) => d.data() as Test).filter((t) => t && t.id);
  console.log(`[MPPS] getAllTests: received ${tests.length} test(s)`, tests.map(t => ({ id: t.id, title: t.title, published: t.published, scheduledAt: t.scheduledAt, endsAt: t.endsAt })));
  return tests;
}
export function listenTests(cb: (tests: Test[]) => void) {
  console.log("[MPPS] listenTests: subscribing to all tests (no filters)");
  return onSnapshot(
    collection(db, "tests"),
    (snap) => {
      const tests = snap.docs.map((d) => d.data() as Test);
      console.log(`[MPPS] listenTests snapshot: ${tests.length} test(s) from Firestore (fromCache=${snap.metadata.fromCache})`, tests.map(t => ({ id: t.id, title: t.title, published: t.published })));
      cb(tests);
    },
    (err) => {
      console.error("[MPPS] listenTests ERROR:", err);
    }
  );
}
export async function getTestsByClass(cls: string): Promise<Test[]> {
  console.log(`[MPPS] getTestsByClass: fetching published tests for class="${cls}"`);
  const q = query(collection(db, "tests"), where("targetClass", "==", cls), where("published", "==", true));
  const snap = await getDocs(q);
  const tests = snap.docs.map((d) => d.data() as Test);
  console.log(`[MPPS] getTestsByClass(${cls}): received ${tests.length} test(s)`, tests.map(t => ({ id: t.id, title: t.title, scheduledAt: t.scheduledAt, endsAt: t.endsAt })));
  return tests;
}
export function listenTestsByClass(cls: string, cb: (tests: Test[]) => void) {
  console.log(`[MPPS] listenTestsByClass: subscribing to published tests for class="${cls}"`);
  const q = query(collection(db, "tests"), where("targetClass", "==", cls), where("published", "==", true));
  return onSnapshot(
    q,
    (snap) => {
      const tests = snap.docs.map((d) => d.data() as Test);
      console.log(`[MPPS] listenTestsByClass(${cls}) snapshot: ${tests.length} test(s) (fromCache=${snap.metadata.fromCache})`, tests.map(t => ({ id: t.id, title: t.title, scheduledAt: t.scheduledAt, endsAt: t.endsAt })));
      cb(tests);
    },
    (err) => {
      console.error(`[MPPS] listenTestsByClass(${cls}) ERROR:`, err);
    }
  );
}

// ── Attempts ──────────────────────────────────────────────────────────────────
export async function saveAttempt(attempt: Attempt) {
  await setDoc(doc(db, "studentAttempts", attempt.id), attempt);
}
export async function updateAttemptAnswers(
  attemptId: string,
  answers: Record<string, string>,
  currentQuestion: number
) {
  await updateDoc(doc(db, "studentAttempts", attemptId), { answers, currentQuestion });
}
export async function submitAttempt(attemptId: string, result: {
  score: number; totalMarks: number; percentage: number; timeTaken: number; submittedAt: string;
}) {
  await updateDoc(doc(db, "studentAttempts", attemptId), { ...result, submitted: true });
}
export async function getAttempt(attemptId: string): Promise<Attempt | null> {
  const snap = await getDoc(doc(db, "studentAttempts", attemptId));
  return snap.exists() ? (snap.data() as Attempt) : null;
}
export async function getAttemptByStudentAndTest(studentId: string, testId: string): Promise<Attempt | null> {
  const q = query(
    collection(db, "studentAttempts"),
    where("studentId", "==", studentId),
    where("testId", "==", testId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Attempt;
}
export async function getAttemptsByStudent(studentId: string): Promise<Attempt[]> {
  const q = query(collection(db, "studentAttempts"), where("studentId", "==", studentId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Attempt);
}
export function listenAttemptsByStudent(studentId: string, cb: (attempts: Attempt[]) => void) {
  const q = query(collection(db, "studentAttempts"), where("studentId", "==", studentId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as Attempt));
  });
}
export async function getAttemptsByTest(testId: string): Promise<Attempt[]> {
  const q = query(
    collection(db, "studentAttempts"),
    where("testId", "==", testId),
    where("submitted", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Attempt);
}
export async function getAllAttempts(): Promise<Attempt[]> {
  const snap = await getDocs(collection(db, "studentAttempts"));
  return snap.docs.map((d) => d.data() as Attempt);
}
export function listenAttempts(cb: (attempts: Attempt[]) => void) {
  return onSnapshot(collection(db, "studentAttempts"), (snap) => {
    cb(snap.docs.map((d) => d.data() as Attempt));
  });
}

// ── Violations ────────────────────────────────────────────────────────────────
export async function upsertViolation(studentId: string, testId: string, type: string): Promise<number> {
  const id = `${studentId}_${testId}`;
  const ref = doc(db, "violations", id);
  const snap = await getDoc(ref);
  const current = snap.exists()
    ? (snap.data() as Violation)
    : { id, studentId, testId, type, count: 0, autoSubmitted: false };
  const newCount = current.count + 1;
  await setDoc(ref, {
    ...current,
    count: newCount,
    autoSubmitted: newCount >= 3,
    lastViolationAt: new Date().toISOString(),
  }, { merge: true });
  return newCount;
}
export async function getAllViolations(): Promise<Violation[]> {
  const snap = await getDocs(collection(db, "violations"));
  return snap.docs.map((d) => d.data() as Violation);
}
export function listenViolations(cb: (violations: Violation[]) => void) {
  return onSnapshot(collection(db, "violations"), (snap) => {
    cb(snap.docs.map((d) => d.data() as Violation));
  });
}

// ── Notices ───────────────────────────────────────────────────────────────────
export async function saveNotice(notice: Notice) {
  await setDoc(doc(db, "notices", notice.id), notice);
}
export async function addNotice(notice: Notice) {
  await setDoc(doc(db, "notices", notice.id), notice);
}
export async function updateNotice(noticeId: string, data: Partial<Notice>) {
  await updateDoc(doc(db, "notices", noticeId), data as Record<string, unknown>);
}
export async function deleteNotice(id: string) {
  await deleteDoc(doc(db, "notices", id));
}
export function listenNotices(cb: (notices: Notice[]) => void) {
  const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as Notice));
  });
}

// ── Sharing History ────────────────────────────────────────────────────────────
export async function saveSharingHistory(h: SharingHistory) {
  await setDoc(doc(db, "sharingHistory", h.id), h);
}
export async function getSharingHistory(): Promise<SharingHistory[]> {
  const q = query(collection(db, "sharingHistory"), orderBy("sharedAt", "desc"), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as SharingHistory);
}

// ── ID helper ─────────────────────────────────────────────────────────────────
export function generateId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

// ── Notice read tracking (localStorage-based, per-device) ─────────────────────
export function getLastSeenNotices(uid: string): number {
  const val = localStorage.getItem(`mpps_notices_seen_${uid}`);
  return val ? parseInt(val, 10) : 0;
}
export function markNoticesSeen(uid: string) {
  localStorage.setItem(`mpps_notices_seen_${uid}`, Date.now().toString());
}
export function countUnreadNotices(notices: Notice[], uid: string): number {
  const lastSeen = getLastSeenNotices(uid);
  return notices.filter(n => new Date(n.createdAt).getTime() > lastSeen).length;
}
