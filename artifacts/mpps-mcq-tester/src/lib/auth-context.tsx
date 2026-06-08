import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase";
import { getStudentProfile, getTeacherProfile, StudentProfile, TeacherProfile } from "./firestore";

type Role = "student" | "teacher" | "principal" | null;

type AuthContextType = {
  user: User | null;
  role: Role;
  studentProfile: StudentProfile | null;
  teacherProfile: TeacherProfile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  setRole: (role: Role) => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const ROLE_KEY = (uid: string) => `mpps_role_${uid}`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Use localStorage so role persists across tabs, browser restarts, and other devices
        const savedRole = localStorage.getItem(ROLE_KEY(u.uid)) as Role;

        if (savedRole && savedRole !== "principal") {
          // Role was saved — restore it and load the matching profile
          setRole(savedRole);
          if (savedRole === "student") {
            const sp = await getStudentProfile(u.uid);
            setStudentProfile(sp);
          } else if (savedRole === "teacher") {
            const tp = await getTeacherProfile(u.uid);
            setTeacherProfile(tp);
          }
        } else if (savedRole === "principal") {
          setRole("principal");
        } else {
          // No saved role — auto-detect from Firestore (handles cross-device logins)
          const [sp, tp] = await Promise.all([
            getStudentProfile(u.uid),
            getTeacherProfile(u.uid),
          ]);
          if (sp) {
            setRole("student");
            setStudentProfile(sp);
            localStorage.setItem(ROLE_KEY(u.uid), "student");
          } else if (tp) {
            setRole("teacher");
            setTeacherProfile(tp);
            localStorage.setItem(ROLE_KEY(u.uid), "teacher");
          }
          // Principal uses a fixed account — no Firestore profile needed
        }
      } else {
        setRole(null);
        setStudentProfile(null);
        setTeacherProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signUp = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const signOut = async () => {
    if (user) localStorage.removeItem(ROLE_KEY(user.uid));
    await firebaseSignOut(auth);
    setRole(null);
    setStudentProfile(null);
    setTeacherProfile(null);
  };

  const handleSetRole = (r: Role) => {
    setRole(r);
    if (user && r) localStorage.setItem(ROLE_KEY(user.uid), r);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const currentRole = role;
    if (currentRole === "student") {
      const sp = await getStudentProfile(user.uid);
      setStudentProfile(sp);
    } else if (currentRole === "teacher") {
      const tp = await getTeacherProfile(user.uid);
      setTeacherProfile(tp);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, role, studentProfile, teacherProfile, loading,
      signUp, signIn, signOut, setRole: handleSetRole, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
