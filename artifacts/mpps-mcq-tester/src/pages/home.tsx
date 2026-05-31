import { Link } from "wouter";
import { GraduationCap, Users, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent selection:text-white">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-8 border-b-4 border-accent">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/mpps-logo.jpg"
                alt="MPPS Logo"
                className="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-accent/40 bg-white"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">MP Public School</h1>
                <p className="text-primary-foreground/80 font-medium tracking-wide">Mathuranagar</p>
              </div>
            </div>
            <div className="text-center md:text-right hidden sm:block">
              <p className="text-sm font-semibold text-accent tracking-wider uppercase">Official Portal</p>
              <p className="text-sm text-primary-foreground/80 mt-1 max-w-xs">
                Empowering Futures Through Excellence in Education
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12 md:py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Welcome to MPPS MCQ Tester
          </h2>
          <p className="text-lg text-muted-foreground">
            Select your portal to access live tests, results, and administrative tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Student Portal */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group flex flex-col bg-card border border-border shadow-sm rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
          >
            <div className="p-8 pb-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card border-b border-border">
              <div className="w-14 h-14 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Student Portal</h3>
              <p className="text-muted-foreground text-sm">For enrolled students to take tests and view results.</p>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Live Tests",
                  "Upcoming Tests",
                  "Previous Tests",
                  "Results",
                  "Review Answers"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm font-medium text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mr-3" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/student" className="block w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-center rounded-lg font-semibold transition-colors">
                Enter Student Portal
              </Link>
            </div>
          </motion.div>

          {/* Teacher Portal */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group flex flex-col bg-card border border-border shadow-sm rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 relative"
          >
            <div className="p-8 pb-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card border-b border-border">
              <div className="w-14 h-14 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Teacher Portal</h3>
              <p className="text-muted-foreground text-sm">For faculty and staff to manage tests and students.</p>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Create Tests",
                  "Upload MCQ Questions",
                  "Manage Students",
                  "View Results",
                  "Generate PDF Reports"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm font-medium text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mr-3" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/teacher" className="block w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-center rounded-lg font-semibold transition-colors">
                Enter Teacher Portal
              </Link>
            </div>
          </motion.div>

          {/* Principal Portal */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group flex flex-col bg-card border border-border shadow-sm rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 relative"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-bl-full -z-10" />
            <div className="p-8 pb-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card border-b border-border">
              <div className="w-14 h-14 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Principal Portal</h3>
              <p className="text-muted-foreground text-sm">For school administration and oversight.</p>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "School Analytics",
                  "Class Rankings",
                  "Performance Reports",
                  "Notices",
                  "PDF Report Generation"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm font-medium text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mr-3" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/principal" className="block w-full py-3 px-4 bg-accent hover:bg-accent/90 text-accent-foreground text-center rounded-lg font-semibold transition-colors shadow-sm">
                Enter Principal Portal
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8 border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 text-center text-sm text-primary-foreground/70">
          <p className="font-medium text-primary-foreground mb-2">MP Public School, Mathuranagar</p>
          <p>© {new Date().getFullYear()} MPPS MCQ Tester. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
