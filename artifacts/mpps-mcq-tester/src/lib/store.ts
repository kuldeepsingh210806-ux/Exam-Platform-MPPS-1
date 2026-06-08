export type Student = {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  password: string;
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
  questions: MCQQuestion[];
};

export type Submission = {
  id: string;
  studentId: string;
  testId: string;
  answers: Record<string, "A" | "B" | "C" | "D">;
  score: number;
  totalMarks: number;
  percentage: number;
  submittedAt: string;
  timeTaken: number;
};

export type Notice = {
  id: string;
  title: string;
  content: string;
  author: string;
  targetAudience: "All" | "Students" | "Teachers";
  createdAt: string;
};

export type Session = {
  role: "student" | "teacher" | "principal";
  studentId?: string;
};

const KEYS = {
  STUDENTS: "mpps_students",
  TESTS: "mpps_tests",
  SUBMISSIONS: "mpps_submissions",
  NOTICES: "mpps_notices",
  SESSION: "mpps_session",
};

export function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// Internal generic getter/setter
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage`, error);
  }
}

// Students
export const getStudents = () => getItem<Student[]>(KEYS.STUDENTS, []);
export const addStudent = (s: Student) => setItem(KEYS.STUDENTS, [...getStudents(), s]);
export const updateStudent = (s: Student) => setItem(KEYS.STUDENTS, getStudents().map(st => st.id === s.id ? s : st));
export const deleteStudent = (id: string) => setItem(KEYS.STUDENTS, getStudents().filter(st => st.id !== id));

// Tests
export const getTests = () => getItem<Test[]>(KEYS.TESTS, []);
export const addTest = (t: Test) => setItem(KEYS.TESTS, [...getTests(), t]);
export const updateTest = (t: Test) => setItem(KEYS.TESTS, getTests().map(ts => ts.id === t.id ? t : ts));
export const deleteTest = (id: string) => setItem(KEYS.TESTS, getTests().filter(ts => ts.id !== id));

// Submissions
export const getSubmissions = () => getItem<Submission[]>(KEYS.SUBMISSIONS, []);
export const addSubmission = (s: Submission) => setItem(KEYS.SUBMISSIONS, [...getSubmissions(), s]);

// Notices
export const getNotices = () => getItem<Notice[]>(KEYS.NOTICES, []);
export const addNotice = (n: Notice) => setItem(KEYS.NOTICES, [...getNotices(), n]);
export const deleteNotice = (id: string) => setItem(KEYS.NOTICES, getNotices().filter(nt => nt.id !== id));

// Session
export const getSession = () => getItem<Session | null>(KEYS.SESSION, null);
export const setSession = (s: Session) => setItem(KEYS.SESSION, s);
export const clearSession = () => localStorage.removeItem(KEYS.SESSION);

// Seed Data
export function initializeStore() {
  if (localStorage.getItem(KEYS.STUDENTS)) return; // Already seeded

  const now = Date.now();
  const s1: Student = { id: generateId(), name: "Aarav Sharma", rollNumber: "2024001", class: "Class 9", section: "A", password: "password" };
  const s2: Student = { id: generateId(), name: "Diya Patel", rollNumber: "2024002", class: "Class 9", section: "B", password: "password" };
  const s3: Student = { id: generateId(), name: "Rohan Verma", rollNumber: "2024003", class: "Class 10", section: "A", password: "password" };
  
  setItem(KEYS.STUDENTS, [s1, s2, s3]);
  setItem(KEYS.SESSION, { role: "student", studentId: s1.id });

  const pastTestId = generateId();
  const liveTestId = generateId();
  const futureTestId = generateId();

  const mockQuestions: MCQQuestion[] = [
    { id: generateId(), question: "What is the capital of India?", optionA: "Mumbai", optionB: "New Delhi", optionC: "Kolkata", optionD: "Chennai", correctAnswer: "B", marks: 2 },
    { id: generateId(), question: "Which planet is known as the Red Planet?", optionA: "Venus", optionB: "Mars", optionC: "Jupiter", optionD: "Saturn", correctAnswer: "B", marks: 2 }
  ];

  const t1: Test = {
    id: pastTestId,
    title: "Mid-Term History",
    subject: "History",
    targetClass: "Class 9",
    duration: 60,
    totalMarks: 4,
    createdAt: new Date(now - 86400000 * 2).toISOString(),
    scheduledAt: new Date(now - 86400000).toISOString(),
    endsAt: new Date(now - 86400000 + 3600000).toISOString(),
    questions: mockQuestions
  };

  const t2: Test = {
    id: liveTestId,
    title: "Science Weekly Quiz",
    subject: "Science",
    targetClass: "Class 9",
    duration: 60,
    totalMarks: 4,
    createdAt: new Date(now - 86400000).toISOString(),
    scheduledAt: new Date(now - 5 * 60000).toISOString(), // 5 mins ago
    endsAt: new Date(now + 55 * 60000).toISOString(), // 55 mins from now
    questions: mockQuestions
  };

  const t3: Test = {
    id: futureTestId,
    title: "Math Final",
    subject: "Mathematics",
    targetClass: "Class 9",
    duration: 120,
    totalMarks: 4,
    createdAt: new Date(now).toISOString(),
    scheduledAt: new Date(now + 86400000).toISOString(),
    endsAt: new Date(now + 86400000 + 7200000).toISOString(),
    questions: mockQuestions
  };

  setItem(KEYS.TESTS, [t1, t2, t3]);

  const sub1: Submission = {
    id: generateId(),
    studentId: s1.id,
    testId: pastTestId,
    answers: { [mockQuestions[0].id]: "B", [mockQuestions[1].id]: "A" }, // 1 correct, 1 wrong
    score: 2,
    totalMarks: 4,
    percentage: 50,
    submittedAt: new Date(now - 86000000).toISOString(),
    timeTaken: 1500
  };

  setItem(KEYS.SUBMISSIONS, [sub1]);

  const n1: Notice = {
    id: generateId(),
    title: "School Closed on Monday",
    content: "Due to heavy rains, the school will remain closed on Monday.",
    author: "Principal",
    targetAudience: "All",
    createdAt: new Date(now - 86400000).toISOString()
  };
  const n2: Notice = {
    id: generateId(),
    title: "Submit Science Projects",
    content: "All Class 9 students must submit their science projects by Friday.",
    author: "Science Teacher",
    targetAudience: "Students",
    createdAt: new Date(now - 43200000).toISOString()
  };

  setItem(KEYS.NOTICES, [n1, n2]);
}
