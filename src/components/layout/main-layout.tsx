'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Bell
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
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Trabajos', href: '/trabajos', icon: Wrench },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  { name: 'Cotizaciones', href: '/cotizaciones', icon: FileText },
]

const moreNavItems = [
  { name: 'Catálogo / Servicios', href: '/catalogo', icon: BookOpen },
  { name: 'Stock', href: '/stock', icon: Package },
  { name: 'Caja', href: '/caja', icon: Wallet },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Recordatorios', href: '/recordatorios', icon: Bell },
  { name: 'Ajustes', href: '/ajustes', icon: Settings },
]

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  if (pathname === '/login') return <>{children}</>

  return (
    <div className="min-h-screen bg-background">
      <ReminderPoller />
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r border-border/80 bg-sidebar shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Real Logo in Sidebar */}
        <div className="p-6 flex items-center justify-center border-b border-border/40">
          <img 
            src="/assets/logo.png" 
            alt="Epotech Solutions" 
            className="h-10 w-auto object-contain brightness-0 invert transition-transform duration-300 hover:scale-105" 
          />
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-7 overflow-y-auto">
          <div>
            <p className="px-3 mb-2.5 text-[11px] font-semibold text-muted-foreground/60 tracking-wider uppercase">
              Principal
            </p>
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out group relative",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/10 font-semibold"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-transform duration-300",
                      isActive ? "scale-110" : "group-hover:scale-110"
                    )} />
                    {item.name}
                    {isActive && (
                      <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
          
          <div>
            <p className="px-3 mb-2.5 text-[11px] font-semibold text-muted-foreground/60 tracking-wider uppercase">
              Gestión de Marca
            </p>
            <div className="space-y-1">
              {moreNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out group relative",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/10 font-semibold"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-transform duration-300",
                      isActive ? "scale-110" : "group-hover:scale-110"
                    )} />
                    {item.name}
                    {isActive && (
                      <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={cn(
        "pb-24 md:pb-0 transition-all duration-300",
        "md:pl-64 min-h-screen bg-background/50"
      )}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-sidebar/85 backdrop-blur-xl px-2 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {mainNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 ease-out",
                  isActive
                    ? "text-primary scale-105 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5.5 w-5.5" />
                <span className="text-[10px] font-medium tracking-tight">{item.name}</span>
              </Link>
            )
          })}
          
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground transition-all duration-300">
                <MoreHorizontal className="h-5.5 w-5.5" />
                <span className="text-[10px] font-medium tracking-tight">Más</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] p-0 rounded-l-3xl border-l border-border/80 bg-sidebar/95 backdrop-blur-xl">
              <SheetHeader className="p-6 text-left border-b border-border/40 bg-muted/20">
                <SheetTitle className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Menú Principal
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Accede a todos los módulos y herramientas del sistema
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 px-2 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
                {moreNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-4 px-5 py-3.5 text-sm font-semibold transition-all duration-300 rounded-xl",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5 text-primary" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  )
}
