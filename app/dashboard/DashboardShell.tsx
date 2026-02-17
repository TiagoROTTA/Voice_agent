"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { signOut } from "./actions";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-zinc-200 bg-white">
        <SidebarHeader className="border-b border-zinc-200 p-4">
          <span className="font-semibold text-black">Cluvo</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        pathname === item.href ||
                        (item.href !== "/dashboard" &&
                          pathname.startsWith(item.href))
                      }
                      className="text-zinc-700 data-[active=true]:bg-zinc-100 data-[active=true]:text-black"
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-zinc-200 p-2">
          {userEmail && (
            <p className="truncate px-2 py-1 text-xs text-zinc-500">
              {userEmail}
            </p>
          )}
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-zinc-700 hover:bg-zinc-100 hover:text-black"
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="flex flex-1 flex-col bg-white p-6 text-zinc-900">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
