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
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const mainNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Trabajos', href: '/trabajos', icon: Wrench },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  { name: 'Cotiza', href: '/cotizaciones', icon: FileText },
]

const moreNavItems = [
  { name: 'Catálogo', href: '/catalogo', icon: BookOpen },
  { name: 'Stock', href: '/stock', icon: Package },
  { name: 'Caja', href: '/caja', icon: Wallet },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Ajustes', href: '/ajustes', icon: Settings },
]

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  if (pathname === '/login') return <>{children}</>

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-card">
        <div className="p-6 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            E
          </div>
          <span className="font-bold text-xl tracking-tight">Epotech CRM</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <p className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase">Principal</p>
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
          
          <p className="px-2 mt-8 mb-2 text-xs font-semibold text-muted-foreground uppercase">Gestión</p>
          {moreNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={cn(
        "pb-20 md:pb-0 transition-all duration-300",
        "md:pl-64"
      )}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/80 backdrop-blur-lg px-2 py-2 shadow-lg">
        <div className="flex items-center justify-around">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg transition-colors",
                pathname.startsWith(item.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          ))}
          
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-muted-foreground">
                <MoreHorizontal className="h-6 w-6" />
                <span className="text-[10px] font-medium">Más</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] p-0">
              <SheetHeader className="p-6 text-left border-b bg-muted/50">
                <SheetTitle>Menú Principal</SheetTitle>
                <SheetDescription>Accede a todos los módulos del sistema</SheetDescription>
              </SheetHeader>
              <div className="py-4">
                {moreNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 text-base font-medium transition-colors border-b last:border-0",
                      pathname.startsWith(item.href)
                        ? "bg-primary/5 text-primary"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  )
}
