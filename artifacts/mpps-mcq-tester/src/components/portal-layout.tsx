import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, GraduationCap, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface PortalLayoutProps {
  children: ReactNode;
  title: string;
  links: { label: string; href: string }[];
  basePath: string;
}

export function PortalLayout({ children, title, links, basePath }: PortalLayoutProps) {
  const [location] = useLocation();

  const NavLinks = () => (
    <>
      {links.map((link) => {
        const isActive = location === `${basePath}${link.href}`;
        return (
          <Link key={link.href} href={`${basePath}${link.href}`}>
            <span className={`block px-4 py-3 rounded-md mb-2 font-medium transition-colors ${
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
              <div className="p-6">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-sidebar-border">
                  <div className="bg-white p-2 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold tracking-tight">MPPS</h2>
                    <p className="text-xs text-sidebar-foreground/70">{title}</p>
                  </div>
                </div>
                <nav>
                  <NavLinks />
                </nav>
                <div className="mt-8 pt-6 border-t border-sidebar-border">
                  <Link href="/">
                    <span className="flex items-center gap-2 px-4 py-3 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors font-medium">
                      <ArrowLeft className="h-4 w-4" />
                      Back to Home
                    </span>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-bold text-lg">{title}</span>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0 h-screen">
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-sidebar-border">
            <div className="bg-white p-2.5 rounded-lg shadow-sm">
              <GraduationCap className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight">MPPS</h2>
              <p className="text-xs font-medium text-accent tracking-wide uppercase mt-0.5">{title}</p>
            </div>
          </div>
          
          <nav className="flex-1">
            <NavLinks />
          </nav>

          <div className="pt-6 border-t border-sidebar-border mt-auto">
            <Link href="/">
              <span className="flex items-center gap-2 px-4 py-3 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors font-medium w-full cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Top Nav/Header Area */}
        <header className="hidden md:flex bg-white border-b border-border p-6 items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            MP Public School, Mathuranagar
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
