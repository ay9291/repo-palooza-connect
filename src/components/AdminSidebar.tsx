import { NavLink, useNavigate } from "react-router-dom";
import { Package, ShoppingBag, Store, LayoutDashboard, LogOut, Home, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Orders", url: "/admin/orders", icon: ShoppingBag },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Showrooms", url: "/admin/showrooms", icon: Store },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64 border-r bg-background/95 backdrop-blur"} collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <div className="px-3 pt-2 pb-1">
          {!isCollapsed && (
            <div className="rounded-xl border bg-gradient-to-br from-background to-accent/10 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-accent" />
                Premium Admin
              </div>
              <p className="text-xs text-muted-foreground mt-1">Manage orders, products and partners.</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent text-accent-foreground font-medium border border-accent/40"
                          : "hover:bg-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-3 space-y-2">
          {!isCollapsed ? (
            <>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full justify-start">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="w-full justify-start">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="icon" onClick={() => navigate("/")} className="w-full">
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleSignOut} className="w-full">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
