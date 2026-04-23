'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts'
import { Briefcase, Users, Wallet, TrendingUp, Calendar, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ReportesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({
    ingresos: [],
    servicios: [],
    clientes: []
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    
    // Simulate data fetching and processing
    // In a real app, we would aggregate SQL data here
    
    const mockIngresos = [
      { name: 'Ene', monto: 1200, neto: 950 },
      { name: 'Feb', monto: 2100, neto: 1600 },
      { name: 'Mar', monto: 1800, neto: 1300 },
      { name: 'Abr', monto: 2400, neto: 1900 },
      { name: 'May', monto: 3200, neto: 2600 },
      { name: 'Jun', monto: 2800, neto: 2200 },
    ]

    const mockServicios = [
      { name: 'Lavado', value: 45 },
      { name: 'Epóxico', value: 25 },
      { name: 'Pintura', value: 15 },
      { name: 'Limpieza', value: 15 },
    ]

    setData({
      ingresos: mockIngresos,
      servicios: mockServicios,
      clientes: []
    })
    
    setLoading(false)
  }

  const COLORS = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B']

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="p-4 md:p-6 border-b bg-card">
         <div className="max-w-7xl mx-auto w-full">
            <h1 className="text-2xl font-bold tracking-tight">Análisis de Negocio</h1>
            <p className="text-muted-foreground text-sm">Visualiza el crecimiento y rentabilidad real de Epotech Solution.</p>
         </div>
      </header>

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto space-y-6">
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
            <>
                {/* Top Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-primary/5 border-primary/10">
                        <CardContent className="p-4 flex flex-col items-center">
                            <Wallet className="h-5 w-5 text-primary mb-2" />
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Ingresos (Brutos)</span>
                            <span className="text-xl font-bold">$13,400</span>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50/50 border-green-200">
                        <CardContent className="p-4 flex flex-col items-center">
                            <TrendingUp className="h-5 w-5 text-green-600 mb-2" />
                            <span className="text-[10px] uppercase font-bold text-green-700">Ganancia Neta</span>
                            <span className="text-xl font-bold text-green-700">$10,550</span>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/5 border-primary/10">
                        <CardContent className="p-4 flex flex-col items-center">
                            <Users className="h-5 w-5 text-primary mb-2" />
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Nuevos Clientes</span>
                            <span className="text-xl font-bold">14</span>
                        </CardContent>
                    </Card>
                    <Card className="border-orange-200 bg-orange-50/30">
                        <CardContent className="p-4 flex flex-col items-center">
                            <Briefcase className="h-5 w-5 text-orange-600 mb-2" />
                            <span className="text-[10px] uppercase font-bold text-orange-700">Ticket Promedio</span>
                            <span className="text-xl font-bold text-orange-700">$245</span>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Ingresos vs Rentabilidad</CardTitle>
                            <CardDescription>Comparativa entre venta bruta y ganancia neta.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.ingresos}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip 
                                        cursor={{fill: 'transparent'}}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="monto" name="Venta Bruta" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="neto" name="Ganancia Neta" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Service Mix Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Distribución de Servicios</CardTitle>
                            <CardDescription>Tipos de trabajos más solicitados.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-80 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.servicios}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.servicios.map((entry: any, index: any) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Secondary data table or more charts */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Rentabilidad por Servicio Estimada</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.ingresos}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="monto" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4, fill: '#7C3AED' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </>
        )}
      </div>
    </div>
  )
}
