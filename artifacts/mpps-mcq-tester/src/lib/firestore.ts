import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, addDoc,
  Timestamp, writeBatch, limit,
} from "firebase/firestore";
import { db } from "./firebase";

export type StudentProfile = {
  uid: string;
  name: string;
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
  targetClass: string;
  duration: number;
  totalMarks: number;
  scheduledAt: string;
  endsAt: string;
  createdAt: string;
  createdBy: string;
  questions: MCQQuestion[];
  published: boolean;
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
  author: string;
  createdAt: string;
};

export type Violation = {
  id: string;
  studentId: string;
  testId: string;
  type: string;
  count: number;
  autoSubmitted: boolean;
};

// ── Students ──────────────────────────────────────────────────────────────────
export async function saveStudentProfile(uid: string, data: Omit<StudentProfile, "uid">) {
  await setDoc(doc(db, "students", uid), { uid, ...data });
}
export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {
  const snap = await getDoc(doc(db, "students", uid));
  return snap.exists() ? (snap.data() as StudentProfile) : null;
}
export async function getAllStudents(): Promise<StudentProfile[]> {
  const snap = await getDocs(collection(db, "students"));
  return snap.docs.map((d) => d.data() as StudentProfile);
}
export function listenStudents(cb: (students: StudentProfile[]) => void) {
  return onSnapshot(collection(db, "students"), (snap) => {
    cb(snap.docs.map((d) => d.data() as StudentProfile));
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
  const snap = await getDocs(collection(db, "tests"));
  return snap.docs.map((d) => d.data() as Test);
}
export function listenTests(cb: (tests: Test[]) => void) {
  return onSnapshot(collection(db, "tests"), (snap) => {
    cb(snap.docs.map((d) => d.data() as Test));
  });
}
export async function getTestsByClass(cls: string): Promise<Test[]> {
  const q = query(collection(db, "tests"), where("targetClass", "==", cls), where("published", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Test);
}
export function listenTestsByClass(cls: string, cb: (tests: Test[]) => void) {
  const q = query(collection(db, "tests"), where("targetClass", "==", cls), where("published", "==", true));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as Test));
  });
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
  const current = snap.exists() ? (snap.data() as Violation) : { id, studentId, testId, type, count: 0, autoSubmitted: false };
  const newCount = current.count + 1;
  await setDoc(ref, { ...current, count: newCount, autoSubmitted: newCount >= 3 }, { merge: true });
  return newCount;
}
export async function getAllViolations(): Promise<Violation[]> {
  const snap = await getDocs(collection(db, "violations"));
  return snap.docs.map((d) => d.data() as Violation);
}

// ── Notices ───────────────────────────────────────────────────────────────────
export async function saveNotice(notice: Notice) {
  await setDoc(doc(db, "notices", notice.id), notice);
}
export async function addNotice(notice: Notice) {
  await setDoc(doc(db, "notices", notice.id), notice);
}
export async function updateNotice(notice: Notice) {
  await setDoc(doc(db, "notices", notice.id), notice, { merge: true });
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

// ── ID helper ─────────────────────────────────────────────────────────────────
export function generateId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}
