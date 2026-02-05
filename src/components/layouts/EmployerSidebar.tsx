import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Briefcase, Users, Settings, LogOut, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { titleKey: "sidebar.start", icon: Home, path: "/employer/dashboard" },
  { titleKey: "sidebar.jobOffers", icon: Briefcase, path: "/employer/offers" },
  { titleKey: "sidebar.profile", icon: Settings, path: "/employer/profile" },
];

export const EmployerSidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border gradient-sidebar text-primary-foreground">
      <SidebarHeader className="p-4">
        <Link to="/employer/dashboard" className="flex items-center gap-2">
          <Building2 className="w-8 h-8 text-cta" />
          {!isCollapsed && (
            <span className="text-lg font-bold">
              idealnie<span className="text-cta">pasuje</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path === "/employer/offers" && location.pathname.startsWith("/employer/offer"));
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={t(item.titleKey)}
                      className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 data-[active=true]:bg-primary-foreground/15 data-[active=true]:text-primary-foreground"
                    >
                      <Link to={item.path}>
                        <item.icon className="w-5 h-5" />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        {!isCollapsed && user && (
          <div className="px-2 py-1 text-xs text-primary-foreground/60 truncate mb-2">
            {user.email}
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip={t("common.logout")}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="w-5 h-5" />
              <span>{t("common.logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
