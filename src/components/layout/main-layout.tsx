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
  LogOut
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
                      "before:absolute before:left-0 before:top-1/4 before:bottom-1/4 before:w-1 before:rounded-r-full before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
                      isActive
                        ? "sidebar-link-active text-white font-semibold shadow-lg shadow-primary/20"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-1"
                    )}
                  >
                    <item.icon className={cn(
                      "h-[17px] w-[17px] transition-all duration-300 flex-shrink-0",
                      item.iconClass,
                      isActive ? "text-white scale-110" : "text-sidebar-foreground/50 group-hover:text-primary"
                    )} />
                    <span className="text-[13px] relative z-10">{item.name}</span>
                    {isActive && (
                      <span className="absolute right-3.5 h-2 w-2 rounded-full bg-[#00C9E0] shadow-[0_0_8px_rgba(0,201,224,0.9)] animate-pulse" />
                    )}
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
                      "before:absolute before:left-0 before:top-1/4 before:bottom-1/4 before:w-1 before:rounded-r-full before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
                      isActive
                        ? "sidebar-link-active text-white font-semibold shadow-lg shadow-primary/20"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-1"
                    )}
                  >
                    <item.icon className={cn(
                      "h-[17px] w-[17px] transition-all duration-300 flex-shrink-0",
                      item.iconClass,
                      isActive ? "text-white scale-110" : "text-sidebar-foreground/50 group-hover:text-primary"
                    )} />
                    <span className="text-[13px] relative z-10">{item.name}</span>
                    {isActive && (
                      <span className="absolute right-3.5 h-2 w-2 rounded-full bg-[#00C9E0] shadow-[0_0_8px_rgba(0,201,224,0.9)] animate-pulse" />
                    )}
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-sidebar-border bg-sidebar/95 backdrop-blur-xl px-2 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {mainNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ease-out",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium tracking-tight">{item.name}</span>
              </Link>
            )
          })}
          
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-sidebar-foreground/50 hover:text-sidebar-foreground transition-all duration-200">
                <MoreHorizontal className="h-5.5 w-5.5" />
                <span className="text-[10px] font-medium tracking-tight">Más</span>
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
              <div className="py-4 px-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-8rem)]">
                {moreNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl",
                        isActive
                          ? "bg-primary text-white font-semibold"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-white" : "text-primary/70")} />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
              {/* Logout in sheet */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border px-3 py-3 bg-sidebar">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500/80 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
                >
                  <LogOut className="h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
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
