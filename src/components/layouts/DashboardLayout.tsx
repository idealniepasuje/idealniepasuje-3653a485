import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export const DashboardLayout = ({ children, sidebar }: DashboardLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-secondary/30">
        {sidebar}
        <SidebarInset className="flex-1">
          <header className="h-14 flex items-center justify-between border-b bg-background px-4 md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1" />
            <LanguageSwitcher />
          </header>
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
