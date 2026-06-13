import { ReactNode, ComponentType } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Menu, LogOut, LucideProps } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "@/components/notification-bell";

interface NavLink {
  label: string;
  href: string;
  icon?: ComponentType<LucideProps>;
}

interface PortalLayoutProps {
  children: ReactNode;
  title: string;
  links: NavLink[];
  basePath: string;
  noticeAudience?: "Students" | "Teachers" | "All";
  noticesPath?: string;
}

export function PortalLayout({
  children, title, links, basePath,
  noticeAudience, noticesPath,
}: PortalLayoutProps) {
  const [location, navigate] = useLocation();
  const { signOut, role, studentProfile, teacherProfile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const displayName =
    role === "student"   ? studentProfile?.name :
    role === "teacher"   ? teacherProfile?.name :
    "Principal";

  const bellAudience  = noticeAudience  ?? (role === "student" ? "Students" : role === "teacher" ? "Teachers" : "All");
  const bellNavTarget = noticesPath ?? `${basePath}/notices`;

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="space-y-0.5">
      {links.map((link) => {
        const fullPath = `${basePath}${link.href}`;
        const isActive = location === fullPath || (link.href === "" && location === basePath);
        const Icon = link.icon;
        return (
          <Link key={link.href} href={fullPath} onClick={onNavigate}>
            <span
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer select-none ${
                isActive
                  ? "bg-accent text-white shadow-sm font-semibold"
                  : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
            >
              {Icon && (
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-white/70"}`} />
              )}
              <span className="truncate">{link.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );

  const BottomSection = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="pt-3 border-t border-white/10 mt-auto space-y-0.5">
      {displayName && (
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-0.5">Signed in as</p>
          <p className="text-sm text-white font-semibold truncate">{displayName}</p>
        </div>
      )}
      <Link href="/" onClick={onNavigate}>
        <span className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-150 cursor-pointer">
          <ArrowLeft className="h-4 w-4 shrink-0 text-white/60" />
          Back to Home
        </span>
      </Link>
      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-150"
      >
        <LogOut className="h-4 w-4 shrink-0 text-white/60" />
        {role === "principal" ? "Exit Portal" : "Sign Out"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">

      {/* ── Mobile Header ────────────────────────────────── */}
      <header className="md:hidden bg-primary text-white p-4 flex items-center justify-between sticky top-0 z-20 border-b-4 border-accent shadow-sm">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/15 rounded-lg" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] border-r-0" style={{ background: "hsl(215 90% 15%)", color: "white" }}>
              <div className="flex flex-col h-full p-4">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
                  <img src="/mpps-logo.jpg" alt="MPPS" className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0" />
                  <div className="min-w-0">
                    <h2 className="font-bold text-white text-sm tracking-tight leading-tight">MP Public School</h2>
                    <p className="text-xs text-accent font-semibold tracking-wide mt-0.5 truncate">{title}</p>
                  </div>
                </div>
                <nav className="flex-1 overflow-y-auto"><NavLinks /></nav>
                <BottomSection />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 min-w-0">
            <img src="/mpps-logo.jpg" alt="MPPS" className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0" />
            <span className="font-bold text-base truncate">{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell audience={bellAudience} navigateTo={bellNavTarget} />
          {displayName && (
            <span className="hidden sm:block text-xs text-white/70 font-medium truncate max-w-[120px] ml-1">
              {displayName}
            </span>
          )}
        </div>
      </header>

      {/* ── Desktop Sidebar ───────────────────────────────── */}
      <aside className="hidden md:flex w-64 flex-col sticky top-0 h-screen border-r border-white/5" style={{ background: "hsl(215 90% 15%)", color: "white" }}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/10">
            <img src="/mpps-logo.jpg" alt="MPPS" className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-bold text-white text-sm tracking-tight">MP Public School</h2>
              <p className="text-xs text-accent font-semibold tracking-wide uppercase mt-0.5 truncate">{title}</p>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto"><NavLinks /></nav>
          <BottomSection />
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="hidden md:flex bg-white border-b border-border px-6 py-4 items-center justify-between sticky top-0 z-10 shadow-sm">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-full p-1">
              <NotificationBell audience={bellAudience} navigateTo={bellNavTarget} />
            </div>
            <div className="text-sm font-medium text-muted-foreground">MP Public School, Mathuranagar</div>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
