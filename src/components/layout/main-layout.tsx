'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  Calendar, 
  FileText, 
  MoreHorizontal,
  Package,
  Wallet,
  Settings,
  BarChart3,
  BookOpen,
  Bell,
  LogOut,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ReminderPoller } from '@/components/recordatorios/reminder-poller'


const mainNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, iconClass: 'icon-tilt' },
  { name: 'Clientes', href: '/clientes', icon: Users, iconClass: 'icon-pulse-glow' },
  { name: 'Trabajos', href: '/trabajos', icon: Wrench, iconClass: 'icon-wrench' },
  { name: 'Agenda', href: '/agenda', icon: Calendar, iconClass: 'icon-bounce' },
  { name: 'Cotizaciones', href: '/cotizaciones', icon: FileText, iconClass: 'icon-bounce' },
]

const moreNavItems = [
  { name: 'Catálogo / Servicios', href: '/catalogo', icon: BookOpen, iconClass: 'icon-tilt' },
  { name: 'Stock', href: '/stock', icon: Package, iconClass: 'icon-bounce' },
  { name: 'Caja', href: '/caja', icon: Wallet, iconClass: 'icon-pulse-glow' },
  { name: 'Reportes', href: '/reportes', icon: BarChart3, iconClass: 'icon-bounce' },
  { name: 'Recordatorios', href: '/recordatorios', icon: Bell, iconClass: 'icon-ring' },
  { name: 'Ajustes', href: '/ajustes', icon: Settings, iconClass: 'icon-spin' },
]

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  
  if (pathname === '/login') return <>{children}</>

  return (
    <div className="min-h-screen bg-background">
      <ReminderPoller />
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r border-sidebar-border/10 bg-sidebar shadow-[4px_0_30px_rgba(0,0,0,0.15)] rounded-tr-[2.2rem] rounded-br-[2.2rem] overflow-hidden sidebar-premium-bg">
        {/* Premium Logo Header */}
        <div className="relative px-5 py-6 flex flex-col items-center bg-transparent border-b border-sidebar-border/10 overflow-hidden">
          {/* Subtle turquoise glow in top corner */}
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[#00C9E0]/15 blur-2xl pointer-events-none animate-pulse" />
          <img 
            src="/assets/logo.png" 
            alt="Epotech Solutions" 
            className="h-16 w-auto object-contain relative z-10 logo-premium" 
          />
          {/* Accent line + tagline */}
          <div className="mt-3 flex items-center gap-2 relative z-10">
            <div className="h-[1.5px] w-5 bg-[#00C9E0] rounded-full" />
            <span className="text-[10px] font-black tracking-[0.25em] text-[#00C9E0] uppercase">Portal CRM</span>
            <div className="h-[1.5px] w-5 bg-[#00C9E0] rounded-full" />
          </div>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto no-scrollbar">
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-400/90 tracking-[0.2em] uppercase">
              Principal
            </p>
            <div className="space-y-0.5">
              {mainNavItems.map((item, index) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-out group relative overflow-hidden animate-sidebar-item",
                      isActive
                        ? "sidebar-link-active text-white font-semibold"
                        : "text-sidebar-foreground/70 hover:bg-white/[0.03] hover:text-sidebar-foreground hover:translate-x-1"
                    )}
                  >
                    <div className={cn(
                      "absolute left-0 top-1/4 bottom-1/4 w-[3.5px] rounded-r-full bg-[#00C9E0] transition-all duration-300 origin-left ease-out",
                      isActive 
                        ? "scale-y-[1.8] opacity-100 shadow-[0_0_10px_rgba(0,201,224,0.7)]" 
                        : "scale-y-0 opacity-0 group-hover:scale-y-[1.1] group-hover:opacity-40"
                    )} />
                    <item.icon className={cn(
                       "h-[17px] w-[17px] transition-all duration-300 flex-shrink-0 relative z-10",
                       item.iconClass,
                       isActive 
                         ? "text-[#00C9E0] scale-110 drop-shadow-[0_0_8px_rgba(0,201,224,0.4)]" 
                         : "text-sidebar-foreground/50 group-hover:text-primary group-hover:scale-105"
                    )} />
                    <span className="text-[13px] relative z-10 transition-colors duration-300">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-400/90 tracking-[0.2em] uppercase">
              Gestión
            </p>
            <div className="space-y-0.5">
              {moreNavItems.map((item, index) => {
                const isActive = pathname.startsWith(item.href)
                const globalIndex = mainNavItems.length + index
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{ animationDelay: `${globalIndex * 50}ms` }}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-out group relative overflow-hidden animate-sidebar-item",
                      isActive
                        ? "sidebar-link-active text-white font-semibold"
                        : "text-sidebar-foreground/70 hover:bg-white/[0.03] hover:text-sidebar-foreground hover:translate-x-1"
                    )}
                  >
                    <div className={cn(
                      "absolute left-0 top-1/4 bottom-1/4 w-[3.5px] rounded-r-full bg-[#00C9E0] transition-all duration-300 origin-left ease-out",
                      isActive 
                        ? "scale-y-[1.8] opacity-100 shadow-[0_0_10px_rgba(0,201,224,0.7)]" 
                        : "scale-y-0 opacity-0 group-hover:scale-y-[1.1] group-hover:opacity-40"
                    )} />
                    <item.icon className={cn(
                       "h-[17px] w-[17px] transition-all duration-300 flex-shrink-0 relative z-10",
                       item.iconClass,
                       isActive 
                         ? "text-[#00C9E0] scale-110 drop-shadow-[0_0_8px_rgba(0,201,224,0.4)]" 
                         : "text-sidebar-foreground/50 group-hover:text-primary group-hover:scale-105"
                    )} />
                    <span className="text-[13px] relative z-10 transition-colors duration-300">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Logout Footer */}
        <div className="border-t border-sidebar-border px-4 py-4 animate-sidebar-item" style={{ animationDelay: `${(mainNavItems.length + moreNavItems.length) * 50}ms` }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-bold text-red-500 border border-red-500/30 bg-red-950/10 hover:bg-red-500/15 hover:text-red-400 transition-all duration-300 ease-out group"
          >
            <LogOut className="h-[16px] w-[16px] flex-shrink-0 transition-transform duration-300 group-hover:scale-105" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={cn(
        "pb-24 md:pb-0 transition-all duration-300",
        "md:pl-64 min-h-screen bg-[#F0F5FA]"
      )}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-5 left-2.5 right-2.5 z-50 h-16 rounded-2xl border border-sidebar-border/10 bg-sidebar/85 backdrop-blur-xl px-2 shadow-[0_12px_40px_rgba(0,0,0,0.3)] flex items-center justify-around">
        <div className="flex items-center justify-between w-full h-full gap-0.5">
          {mainNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-1 py-1.5 rounded-xl transition-all duration-300 ease-out relative group min-w-0 flex-1",
                  isActive
                    ? "sidebar-link-active text-white font-semibold scale-105 shadow-md"
                    : "text-sidebar-foreground/50 hover:bg-white/[0.03] hover:text-sidebar-foreground hover:scale-102"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-all duration-300 relative z-10",
                  isActive 
                    ? "text-[#00C9E0] scale-110 drop-shadow-[0_0_6px_rgba(0,201,224,0.4)]" 
                    : "group-hover:scale-105 group-hover:text-sidebar-foreground"
                )} />
                <span className="text-[9px] font-medium tracking-tighter relative z-10 transition-colors duration-300 truncate w-full text-center">{item.name}</span>
                {isActive && (
                  <div className="absolute bottom-1 w-3 h-[2px] rounded-full bg-[#00C9E0] shadow-[0_0_6px_rgba(0,201,224,0.7)] transition-all duration-300" />
                )}
              </Link>
            )
          })}
          
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 px-1 py-1.5 rounded-xl text-sidebar-foreground/50 hover:bg-white/[0.03] hover:text-sidebar-foreground active:scale-95 transition-all duration-300 group relative min-w-0 flex-1">
                <MoreHorizontal className="h-5 w-5 transition-transform duration-300 group-hover:scale-105" />
                <span className="text-[9px] font-medium tracking-tighter truncate w-full text-center">Más</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] p-0 rounded-l-3xl border-l border-sidebar-border bg-sidebar backdrop-blur-xl">
              <SheetHeader className="p-6 text-left border-b border-sidebar-border">
                <SheetTitle className="font-extrabold text-xl tracking-tight text-sidebar-foreground">
                  Menú Principal
                </SheetTitle>
                <SheetDescription className="text-xs text-sidebar-foreground/50">
                  Accede a todos los módulos del sistema
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 px-4 space-y-3 overflow-y-auto max-h-[calc(100vh-9rem)]">
                {moreNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between gap-4 px-4 py-4.5 text-base font-medium transition-all duration-300 ease-out group relative overflow-hidden rounded-2xl border border-white/[0.01]",
                        isActive
                          ? "sidebar-link-active text-white font-bold shadow-md active:scale-95"
                          : "text-sidebar-foreground/75 hover:bg-white/[0.02] hover:text-sidebar-foreground hover:translate-x-1 active:scale-[0.98]"
                      )}
                    >
                      <div className="flex items-center gap-4 relative z-10 w-full">
                        <div className={cn(
                          "absolute left-0 top-1/4 bottom-1/4 w-[3.5px] rounded-r-full bg-[#00C9E0] transition-all duration-300 origin-left ease-out",
                          isActive 
                            ? "scale-y-[1.8] opacity-100 shadow-[0_0_10px_rgba(0,201,224,0.7)]" 
                            : "scale-y-0 opacity-0 group-hover:scale-y-[1.1] group-hover:opacity-40"
                        )} />
                        <item.icon className={cn(
                          "h-[20px] w-[20px] transition-all duration-300 relative z-10 flex-shrink-0",
                          isActive 
                            ? "text-[#00C9E0] scale-110 drop-shadow-[0_0_8px_rgba(0,201,224,0.4)]" 
                            : "text-sidebar-foreground/50 group-hover:text-primary group-hover:scale-105"
                        )} />
                        <span className={cn(
                          "relative z-10 transition-colors duration-300 text-[15px] tracking-wide",
                          isActive ? "font-semibold text-white" : "font-medium"
                        )}>{item.name}</span>
                      </div>
                      <ChevronRight className={cn(
                        "h-5 w-5 transition-all duration-300 relative z-10 flex-shrink-0",
                        isActive 
                          ? "text-[#00C9E0] translate-x-0.5" 
                          : "text-sidebar-foreground/20 group-hover:text-sidebar-foreground/50 group-hover:translate-x-1"
                      )} />
                    </Link>
                  )
                })}
              </div>
              {/* Logout in sheet */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border px-4 py-4 bg-sidebar">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl text-base font-bold text-red-400 border border-red-500/20 bg-red-950/20 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40 active:scale-98 transition-all duration-300 ease-out group shadow-[0_4px_16px_rgba(239,68,68,0.1)]"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                  Cerrar Sesión
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  )
}
