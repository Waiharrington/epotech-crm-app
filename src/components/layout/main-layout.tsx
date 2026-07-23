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
  ChevronRight,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { ReminderPoller } from '@/components/recordatorios/reminder-poller'


const mainNavItems = [
  { name: 'Dashboard', mobileName: 'Inicio', href: '/dashboard', icon: LayoutDashboard, iconClass: 'icon-tilt' },
  { name: 'Clientes', mobileName: 'Clientes', href: '/clientes', icon: Users, iconClass: 'icon-pulse-glow' },
  { name: 'Trabajos', mobileName: 'Trabajos', href: '/trabajos', icon: Wrench, iconClass: 'icon-wrench' },
  { name: 'Agenda', mobileName: 'Agenda', href: '/agenda', icon: Calendar, iconClass: 'icon-bounce' },
  { name: 'Cotizaciones', mobileName: 'Cotizar', href: '/cotizaciones', icon: FileText, iconClass: 'icon-bounce' },
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

  const [mounted, setMounted] = React.useState(false)
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('epotech_sidebar_collapsed')
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }
  }, [])

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem('epotech_sidebar_collapsed', String(next))
      return next
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  
  if (pathname === '/login') return <>{children}</>

  return (
    <div className="min-h-screen bg-background">
      <ReminderPoller />
      {/* Desktop & Tablet Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col fixed inset-y-0 z-40 border-r border-sidebar-border/10 bg-sidebar shadow-[4px_0_30px_rgba(0,0,0,0.15)] rounded-tr-[2.2rem] rounded-br-[2.2rem] overflow-visible sidebar-premium-bg transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {/* Premium Logo Header & Toggle Button */}
        <div className={cn(
          "relative flex flex-col items-center bg-transparent border-b border-sidebar-border/10 overflow-visible transition-all duration-300 shrink-0",
          isCollapsed ? "px-2 py-3" : "px-4 py-4"
        )}>
          {/* Toggle Button with Brand Cyan Tooltip */}
          <div className="relative group/toggle z-30">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-[#00C9E0]/20 border border-slate-700/60 hover:border-[#00C9E0]/50 text-slate-300 hover:text-[#00C9E0] transition-all duration-300 shadow-md group active:scale-95"
              aria-label={isCollapsed ? "Expandir menú" : "Minimizar menú"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              ) : (
                <ChevronRight className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-0.5" />
              )}
            </button>
            {/* Custom Brand Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/toggle:block z-50 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#030b17] to-[#0B1E3F] border border-[#00C9E0]/40 text-[#00C9E0] text-[10.5px] font-extrabold shadow-[0_4px_15px_rgba(0,201,224,0.25)] tracking-wide flex items-center gap-1">
                <span>{isCollapsed ? "Maximizar menú" : "Minimizar menú"}</span>
              </div>
            </div>
          </div>

          {/* Logo container */}
          {!isCollapsed ? (
            <>
              <img 
                src="/assets/logo.png" 
                alt="Epotech Solutions" 
                className="h-12 w-auto object-contain relative z-10 logo-premium mt-1.5" 
              />
              {/* Accent line + tagline */}
              <div className="mt-1.5 flex items-center gap-2 relative z-10">
                <div className="h-[1.5px] w-4 bg-[#00C9E0] rounded-full" />
                <span className="text-[10px] font-black tracking-[0.22em] text-[#00C9E0] uppercase">Portal CRM</span>
                <div className="h-[1.5px] w-4 bg-[#00C9E0] rounded-full" />
              </div>
            </>
          ) : null}
        </div>
        
        <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto no-scrollbar">
          <div>
            {!isCollapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-400/90 tracking-[0.2em] uppercase">
                Principal
              </p>
            )}
            <div className="space-y-1">
              {mainNavItems.map((item, index) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <div key={item.href} className="relative group/navitem">
                    <Link
                      href={item.href}
                      style={{ animationDelay: `${index * 50}ms` }}
                      className={cn(
                        "flex items-center gap-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-out relative overflow-hidden animate-sidebar-item",
                        isCollapsed ? "justify-center px-0" : "px-3.5",
                        isActive
                          ? "text-white font-semibold"
                          : "text-sidebar-foreground/70 hover:bg-white/[0.03] hover:text-sidebar-foreground"
                      )}
                    >
                      {isActive && (
                        <div className="absolute inset-0 rounded-xl sidebar-link-active z-0 animate-in fade-in zoom-in-95 duration-200" />
                      )}
                      <div className={cn(
                        "absolute left-0 top-1/4 bottom-1/4 w-[3.5px] rounded-r-full bg-[#00C9E0] transition-all duration-300 origin-left ease-out z-10",
                        isActive 
                          ? "scale-y-[1.8] opacity-100 shadow-[0_0_10px_rgba(0,201,224,0.7)]" 
                          : "scale-y-0 opacity-0 group-hover/navitem:scale-y-[1.1] group-hover/navitem:opacity-40"
                      )} />
                      <item.icon className={cn(
                         "h-[18px] w-[18px] transition-all duration-300 flex-shrink-0 relative z-10",
                         item.iconClass,
                         isActive 
                           ? "text-[#00C9E0] scale-110 drop-shadow-[0_0_8px_rgba(0,201,224,0.4)]" 
                           : "text-sidebar-foreground/50 group-hover/navitem:text-primary group-hover/navitem:scale-105"
                      )} />
                      {!isCollapsed && (
                        <span className="text-[13px] relative z-10 transition-colors duration-300 truncate">{item.name}</span>
                      )}
                    </Link>
                    {/* Custom Brand Tooltip for Link - Shown ONLY when sidebar is collapsed */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/navitem:block z-50 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#030b17] via-[#0B1E3F] to-[#030b17] border border-[#00C9E0]/40 text-[#00C9E0] text-[11px] font-extrabold shadow-[0_4px_20px_rgba(0,201,224,0.3)] tracking-wide flex items-center gap-1.5">
                          <item.icon className="h-3.5 w-3.5 text-[#00C9E0]" />
                          <span>{item.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          <div>
            {!isCollapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-400/90 tracking-[0.2em] uppercase">
                Gestión
              </p>
            )}
            <div className="space-y-1">
              {moreNavItems.map((item, index) => {
                const isActive = pathname.startsWith(item.href)
                const globalIndex = mainNavItems.length + index
                return (
                  <div key={item.href} className="relative group/navitem">
                    <Link
                      href={item.href}
                      style={{ animationDelay: `${globalIndex * 50}ms` }}
                      className={cn(
                        "flex items-center gap-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-out relative overflow-hidden animate-sidebar-item",
                        isCollapsed ? "justify-center px-0" : "px-3.5",
                        isActive
                          ? "text-white font-semibold"
                          : "text-sidebar-foreground/70 hover:bg-white/[0.03] hover:text-sidebar-foreground"
                      )}
                    >
                      {isActive && (
                        <div className="absolute inset-0 rounded-xl sidebar-link-active z-0 animate-in fade-in zoom-in-95 duration-200" />
                      )}
                      <div className={cn(
                        "absolute left-0 top-1/4 bottom-1/4 w-[3.5px] rounded-r-full bg-[#00C9E0] transition-all duration-300 origin-left ease-out z-10",
                        isActive 
                          ? "scale-y-[1.8] opacity-100 shadow-[0_0_10px_rgba(0,201,224,0.7)]" 
                          : "scale-y-0 opacity-0 group-hover/navitem:scale-y-[1.1] group-hover/navitem:opacity-40"
                      )} />
                      <item.icon className={cn(
                         "h-[18px] w-[18px] transition-all duration-300 flex-shrink-0 relative z-10",
                         item.iconClass,
                         isActive 
                           ? "text-[#00C9E0] scale-110 drop-shadow-[0_0_8px_rgba(0,201,224,0.4)]" 
                           : "text-sidebar-foreground/50 group-hover/navitem:text-primary group-hover/navitem:scale-105"
                      )} />
                      {!isCollapsed && (
                        <span className="text-[13px] relative z-10 transition-colors duration-300 truncate">{item.name}</span>
                      )}
                    </Link>
                    {/* Custom Brand Tooltip for Link - Shown ONLY when sidebar is collapsed */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/navitem:block z-50 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#030b17] via-[#0B1E3F] to-[#030b17] border border-[#00C9E0]/40 text-[#00C9E0] text-[11px] font-extrabold shadow-[0_4px_20px_rgba(0,201,224,0.3)] tracking-wide flex items-center gap-1.5">
                          <item.icon className="h-3.5 w-3.5 text-[#00C9E0]" />
                          <span>{item.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Logout Footer */}
        <div className="border-t border-sidebar-border/10 px-3 py-3 shrink-0 animate-sidebar-item relative group/logout" style={{ animationDelay: `${(mainNavItems.length + moreNavItems.length) * 50}ms` }}>
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold text-red-500 border border-red-500/30 bg-red-950/10 hover:bg-red-500/15 hover:text-red-400 transition-all duration-300 ease-out group",
              isCollapsed ? "px-0" : "px-3"
            )}
          >
            <LogOut className="h-[16px] w-[16px] flex-shrink-0 transition-transform duration-300 group-hover:scale-105" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
          {/* Custom Brand Tooltip for Logout */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/logout:block z-50 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#030b17] via-[#0B1E3F] to-[#030b17] border border-red-500/40 text-red-400 text-[11px] font-extrabold shadow-[0_4px_20px_rgba(239,68,68,0.3)] tracking-wide flex items-center gap-1.5">
              <LogOut className="h-3.5 w-3.5 text-red-400" />
              <span>Cerrar Sesión</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={cn(
        "pb-32 md:pb-0 transition-all duration-300 ease-in-out min-h-screen bg-[#F0F5FA]",
        isCollapsed ? "md:pl-20" : "md:pl-64"
      )}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {mounted && (
        <nav className="md:hidden fixed bottom-5 left-2.5 right-2.5 z-50 h-16 rounded-2xl border border-sidebar-border/10 sidebar-premium-bg overflow-hidden px-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.3)] flex items-center justify-around">
          <div className="flex items-center justify-between w-full h-full gap-0.5">
            {mainNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 rounded-xl transition-[transform,color] duration-300 ease-out relative group min-w-0 flex-1 py-1.5 h-[85%]",
                    isActive
                      ? "text-white font-semibold scale-105 px-1"
                      : "text-sidebar-foreground/50 active:scale-95 px-1"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl sidebar-link-active z-0 shadow-md animate-in fade-in zoom-in-95 duration-200" />
                  )}
                  <item.icon className={cn(
                    "h-5 w-5 transition-all duration-300 relative z-10",
                    isActive 
                      ? "text-[#00C9E0] scale-110 drop-shadow-[0_0_6px_rgba(0,201,224,0.4)]" 
                      : "group-hover:scale-105 group-hover:text-sidebar-foreground"
                  )} />
                  <span className={cn(
                    "text-[9px] font-medium tracking-tight relative z-10 transition-colors duration-300 truncate w-full text-center px-0.5",
                    isActive ? "text-white font-semibold" : "text-sidebar-foreground/50"
                  )}>
                    {item.mobileName || item.name}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0.5 w-3.5 h-[1.5px] rounded-full bg-[#00C9E0] shadow-[0_0_6px_rgba(0,201,224,0.7)] transition-all duration-300 z-10" />
                  )}
                </Link>
              )
            })}
            
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl text-sidebar-foreground/50 active:scale-95 transition-all duration-300 group relative min-w-0 flex-1 h-[85%]">
                  <MoreHorizontal className="h-5 w-5 transition-transform duration-300 group-hover:scale-105" />
                  <span className="text-[9px] font-medium tracking-tight text-sidebar-foreground/50">Más</span>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85%] p-0 rounded-l-3xl border-l border-sidebar-border sidebar-premium-bg overflow-hidden" showCloseButton={false}>
                <SheetHeader className="pt-14 pb-5 px-6 text-left border-b border-sidebar-border/15 relative">
                  <SheetTitle className="font-extrabold text-xl tracking-tight text-sidebar-foreground">
                    Menú Principal
                  </SheetTitle>
                  <SheetDescription className="text-xs text-sidebar-foreground/50">
                    Accede a todos los módulos del sistema
                  </SheetDescription>
                  <SheetClose className="absolute right-6 top-[54px] rounded-full p-2 bg-white/5 hover:bg-white/10 active:scale-95 text-sidebar-foreground/70 transition-all border border-white/10 flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </SheetClose>
                </SheetHeader>
                <div className="py-6 px-4 space-y-3 overflow-y-auto max-h-[calc(100vh-9rem)]">
                  {moreNavItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between gap-4 px-4 py-4.5 text-base font-medium transition-[transform,color] duration-300 ease-out group relative overflow-hidden rounded-2xl border border-white/[0.01]",
                          isActive
                            ? "text-white font-bold active:scale-95"
                            : "text-sidebar-foreground/75 hover:bg-white/[0.02] hover:text-sidebar-foreground hover:translate-x-1 active:scale-[0.98]"
                        )}
                      >
                        {isActive && (
                          <div className="absolute inset-0 rounded-2xl sidebar-link-active z-0 animate-in fade-in zoom-in-95 duration-200" />
                        )}
                        <div className="flex items-center gap-4 relative z-10 w-full">
                          <div className={cn(
                            "absolute left-0 top-1/4 bottom-1/4 w-[3.5px] rounded-r-full bg-[#00C9E0] transition-all duration-300 origin-left ease-out z-10",
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
                <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border/15 px-4 py-4 bg-[#030b17]">
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
      )}
    </div>
  )
}
