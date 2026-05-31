import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";

interface PortalLayoutProps {
  children: ReactNode;
  title: string;
  links: { label: string; href: string }[];
  basePath: string;
}

export function PortalLayout({ children, title, links, basePath }: PortalLayoutProps) {
  const [location] = useLocation();
  const { signOut, role, studentProfile, teacherProfile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.replace("/");
  };

  const displayName =
    role === "student" ? studentProfile?.name :
    role === "teacher" ? teacherProfile?.name :
    "Principal";

  const NavLinks = () => (
    <>
      {links.map((link) => {
        const fullPath = `${basePath}${link.href}`;
        const isActive = location === fullPath || (link.href === "" && location === basePath);
        return (
          <Link key={link.href} href={fullPath}>
            <span className={`block px-4 py-3 rounded-md mb-1 font-medium transition-colors cursor-pointer ${
              isActive
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </>
  );

  const BottomSection = () => (
    <div className="pt-4 border-t border-sidebar-border mt-auto space-y-1">
      {displayName && (
        <p className="text-xs text-sidebar-foreground/50 px-4 py-1 truncate">
          Signed in as <span className="text-sidebar-foreground/80 font-medium">{displayName}</span>
        </p>
      )}
      <Link href="/">
        <span className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors font-medium cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </span>
      </Link>
      {role !== "principal" && (
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors font-medium text-left"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      )}
      {role === "principal" && (
        <button
          onClick={() => window.location.replace("/")}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors font-medium text-left"
        >
          <LogOut className="h-4 w-4" /> Exit Portal
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden bg-primary text-primary-foreground p-4 flex items-center justify-between sticky top-0 z-10 border-b-4 border-accent">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar text-sidebar-foreground border-sidebar-border p-0 w-[280px]">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sidebar-border">
                  <img src="/mpps-logo.jpg" alt="MPPS" className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <h2 className="font-bold tracking-tight">MPPS</h2>
                    <p className="text-xs text-sidebar-foreground/70">{title}</p>
                  </div>
                </div>
                <nav className="flex-1"><NavLinks /></nav>
                <BottomSection />
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-bold text-lg">{title}</span>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0 h-screen">
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-sidebar-border">
            <img src="/mpps-logo.jpg" alt="MPPS" className="w-10 h-10 rounded-full object-cover border border-white/20" />
            <div>
              <h2 className="font-bold text-base tracking-tight">MPPS</h2>
              <p className="text-xs font-medium text-accent tracking-wide uppercase mt-0.5">{title}</p>
            </div>
          </div>
          <nav className="flex-1"><NavLinks /></nav>
          <BottomSection />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="hidden md:flex bg-white border-b border-border px-6 py-4 items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <div className="text-sm font-medium text-muted-foreground">MP Public School, Mathuranagar</div>
        </header>
        <div className="flex-1 p-4 md:p-8 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
