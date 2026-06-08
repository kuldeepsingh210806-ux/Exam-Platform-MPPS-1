import { Link } from "wouter";
import { GraduationCap, Users, LayoutDashboard, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const portals = [
  {
    icon: Users,
    title: "Student Portal",
    description: "Login or register to take live tests, view your results, and track your progress.",
    href: "/student-login",
    delay: 0.1,
    accent: false,
  },
  {
    icon: GraduationCap,
    title: "Teacher Portal",
    description: "Passkey protected. Create and manage tests, monitor student performance, and generate reports.",
    href: "/teacher-login",
    delay: 0.2,
    accent: false,
  },
  {
    icon: LayoutDashboard,
    title: "Principal Portal",
    description: "Passkey protected. School-wide oversight, analytics, rankings, and administrative tools.",
    href: "/principal-login",
    delay: 0.3,
    accent: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent selection:text-white">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 shadow-md">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/mpps-logo.jpg"
                alt="MPPS Logo"
                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover shadow-md border-2 border-white/20 bg-white"
              />
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-tight">MP Public School</h1>
                <p className="text-primary-foreground/70 text-sm font-medium tracking-wide">Mathuranagar</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-semibold tracking-wider uppercase">
              Official Portal
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background border-b border-border py-14 md:py-20">
        <div className="container mx-auto px-4 md:px-8 text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 tracking-tight">
              Welcome to MPPS MCQ Tester
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Your all-in-one platform for conducting, managing, and analysing multiple-choice assessments.
              Select your portal below to get started.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Portal Cards */}
      <main className="flex-1 container mx-auto px-4 md:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {portals.map(({ icon: Icon, title, description, href, delay, accent }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.45, ease: "easeOut" }}
              className="group flex flex-col bg-card border border-border rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex flex-col flex-1 p-8 gap-6">
                {/* Icon */}
                <div className={`w-13 h-13 w-[52px] h-[52px] flex items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105
                  ${accent ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Text */}
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-bold text-foreground tracking-tight">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>

                {/* Button */}
                <Link
                  href={href}
                  className={`inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors duration-200
                    ${accent
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    }`}
                >
                  Enter Portal
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-6 border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 text-center text-sm text-primary-foreground/60">
          <p className="font-medium text-primary-foreground/80 mb-1">MP Public School, Mathuranagar</p>
          <p>© {new Date().getFullYear()} MPPS MCQ Tester. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
