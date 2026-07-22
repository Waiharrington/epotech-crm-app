'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, ShieldCheck, Mail, Lock, Eye, EyeOff, LogIn, BarChart3, Users, Wallet } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Custom pressure washing micro-effects
  const [revealed, setRevealed] = useState(false)
  const [animationDone, setAnimationDone] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Dedicated satisfying clean reveal sweep (triggers automatically 450ms after mount and purges from DOM after 1.95s)
  useEffect(() => {
    const revealTimer = setTimeout(() => {
      setRevealed(true)
    }, 450)

    const doneTimer = setTimeout(() => {
      setAnimationDone(true)
    }, 1950)

    return () => {
      clearTimeout(revealTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  useEffect(() => {

    // 2. Interactive Water Spray Particles / Ripple effect
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Mouse coordinates tracker
    const mouse = { x: -1000, y: -1000 }
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const handleMouseLeave = () => {
      mouse.x = -1000
      mouse.y = -1000
    }

    const parent = canvas.parentElement
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove)
      parent.addEventListener('mouseleave', handleMouseLeave)
    }

    // Initialize light hydro-particles representing mist/pressure wash spray
    const particleCount = 40
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      alpha: number
      color: string
    }> = []

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.45 + 0.1,
        color: Math.random() > 0.4 ? '#00C9E0' : '#ffffff'
      })
    }

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        p.x += p.vx
        p.y += p.vy

        // Keep inside canvas bounds
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        // Repulsion physics from user cursor
        if (mouse.x > -500) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 130) {
            const force = (130 - dist) / 130
            const angle = Math.atan2(dy, dx)
            
            // Push away dynamically
            p.x += Math.cos(angle) * force * 5
            p.y += Math.sin(angle) * force * 5
          }
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove)
        parent.removeEventListener('mouseleave', handleMouseLeave)
      }
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.refresh()
      router.push('/dashboard')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-screen max-h-screen overflow-hidden bg-[#030b17] font-sans antialiased">
      
      {/* Left Column: Premium Private Operations Terminal for Sebastian (Only on desktop and landscape tablets) */}
      <div 
        className="hidden lg:flex flex-col justify-between p-12 lg:p-16 relative text-white overflow-hidden h-full"
        style={{ 
          backgroundImage: `url('/assets/worker.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: '38% 18%',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Luxury, high-end dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#051325]/98 via-[#0b1e35]/80 to-[#00C9E0]/15 z-10" />

        {/* Top Branding Section */}
        <div className="relative z-20 space-y-4">
          <div className="w-12 h-[3px] bg-[#00C9E0] rounded-full mb-1" />
          <div className="flex flex-col space-y-1">
            <span className="text-3xl font-black tracking-tight text-white uppercase">
              Gestión Inteligente
            </span>
            <p className="text-[10px] font-black text-[#00C9E0] tracking-[0.25em] uppercase pl-0.5">
              Portal CRM
            </p>
          </div>
        </div>

        {/* Bottom Feature Badges Grid */}
        <div className="relative z-20 grid grid-cols-4 gap-4 border-t border-white/10 pt-10">
          <div className="flex flex-col items-center text-center space-y-2.5">
            <ShieldCheck className="h-9 w-9 text-[#00C9E0]" />
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-bold text-white">Control Total</span>
              <span className="text-[11px] font-medium text-[#00C9E0]">Administrativo</span>
            </div>
          </div>
          <div className="flex flex-col items-center text-center space-y-2.5">
            <Users className="h-9 w-9 text-[#00C9E0]" />
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-bold text-white">Gestión de Clientes</span>
              <span className="text-[11px] font-medium text-[#00C9E0]">Y Agendamientos</span>
            </div>
          </div>
          <div className="flex flex-col items-center text-center space-y-2.5">
            <Wallet className="h-9 w-9 text-[#00C9E0]" />
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-bold text-white">Caja y Presupuestos</span>
              <span className="text-[11px] font-medium text-[#00C9E0]">Finanzas y Control</span>
            </div>
          </div>
          <div className="flex flex-col items-center text-center space-y-2.5">
            <BarChart3 className="h-9 w-9 text-[#00C9E0]" />
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-bold text-white">Métricas de Negocio</span>
              <span className="text-[11px] font-medium text-[#00C9E0]">Reportes Analíticos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Premium Responsive Login Container with luxury CRM menu background */}
      <div className="flex flex-col h-screen max-h-screen overflow-hidden sidebar-premium-bg lg:bg-[#F1F5F9] relative">
        {/* Satisfying water droplet micro-particles */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10 opacity-40" />
        
        {/* Mobile-Only Hero Header */}
        <div className="lg:hidden w-full relative flex-shrink-0 bg-[#030b17] z-10 m-0 p-0 overflow-hidden login-hero-height" style={{ height: '270px' }}>
          <img 
            src="/assets/login_hero_mobile.jpeg"
            alt="Epotech Solutions Worker"
            className="w-full h-full object-cover m-0 p-0 block"
            style={{ 
              objectPosition: '23% 12%',
              transform: 'scale(1.03)',
              transformOrigin: '23% 12%'
            }}
          />
          {/* Elegant gradient overlay: clear at the top, rich solid deep navy (#030b17) at the bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030b17]/30 to-[#030b17] z-10 pointer-events-none" />
        </div>

        {/* Card Container (Floats on solid dark navy on mobile, centered light grey on desktop) */}
        <div className="flex-1 flex flex-col items-center justify-center lg:justify-center p-4 sm:p-6 relative z-20 bg-transparent lg:bg-transparent overflow-y-visible lg:overflow-hidden no-scrollbar">
          
          {/* Seamless blending gradient to fade out the dotted pattern as it approaches the photo container, preventing any sharp visual cuts */}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#030b17] to-transparent pointer-events-none z-10 lg:hidden" />
          


          {/* Mobile-Only Greeting (Positioned on the solid blue background, exactly in the middle between the photo and the card) */}
          <div className="lg:hidden w-full max-w-[485px] text-center flex flex-col items-center pt-2 pb-2 sm:pt-5 sm:pb-5 px-4 z-20 flex-shrink-0 login-greeting-padding mb-4 sm:mb-0">
            {/* Accent Line - Resized for premium proportions */}
            <div className="w-16 h-[4px] bg-[#00C9E0] rounded-full mb-2 sm:mb-3" />
            <span className="text-[20px] sm:text-[30px] md:text-[44px] font-black tracking-tight text-white uppercase block leading-tight">
              Gestión Inteligente
            </span>
            <p className="text-[10px] sm:text-[14px] font-black text-[#00C9E0] tracking-[0.28em] uppercase mt-1 sm:mt-2">
              Portal CRM
            </p>
          </div>

          <div ref={cardRef} className="w-full max-w-[485px] lg:my-auto flex-shrink-0 z-20">
            {/* Card with luxury glass border, premium deep shadows, and hover cyan glow */}
            <Card className="w-full shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] border border-slate-100 dark:border-slate-800 lg:border-slate-200/60 bg-white rounded-[24px] overflow-hidden pt-10 pb-6 px-6 sm:p-8 flex flex-col gap-0 relative transition-all duration-500 hover:shadow-[0_30px_70px_-15px_rgba(15,23,42,0.3),0_0_30px_rgba(0,201,224,0.06)] hover:border-[#00C9E0]/20 group/card login-card-padding">
              
              {/* 1. Satisfying Clean Reveal Frosted Glass Overlay (Fully animated on mobile & desktop via hardware-accelerated transform to bypass WebKit clip-path/blur repaint bugs. DOM-purged after 1.8s) */}
              {!animationDone && (
                <div 
                  className="absolute inset-0 z-30 pointer-events-none rounded-[24px] overflow-hidden"
                  style={{ 
                    transform: revealed ? 'translateX(100%)' : 'translateX(0%)',
                    transition: 'transform 1400ms cubic-bezier(0.25, 1, 0.5, 1)',
                    willChange: 'transform'
                  }}
                >
                  {/* The frosted glass texture (dirt/matte layer to be cleaned) */}
                  <div 
                    className="absolute inset-0 bg-slate-100/60" 
                    style={{
                      backdropFilter: 'blur(6px)',
                      WebkitBackdropFilter: 'blur(6px)'
                    }}
                  />
                  
                  {/* High-Pressure Water Jet Line (Sweeping cyan light effect, attached to leading edge) */}
                  <div className="absolute top-0 bottom-0 left-0 w-[6px] -translate-x-1/2 bg-gradient-to-b from-transparent via-[#00C9E0] to-transparent z-40" />
                </div>
              )}

              <CardHeader className="space-y-3 pb-4 pt-1 px-2 text-center flex-shrink-0">
                {/* Real Logo - Enlarged for greater brand presence */}
                <div className="flex justify-center mb-1">
                  <img 
                    src="/assets/logo_horizontal.png" 
                    alt="Epotech Solutions Logo" 
                    className="h-16 sm:h-[70px] w-auto object-contain transition-transform duration-300 hover:scale-101 login-form-logo" 
                  />
                </div>
                
                <CardDescription className="text-[11px] text-slate-500 font-semibold max-w-xs sm:max-w-none sm:whitespace-nowrap mx-auto leading-relaxed pt-0.5">
                  Ingresa tus credenciales para acceder<br className="block sm:hidden" /> al sistema interno de gestión
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleLogin} className="flex flex-col gap-0">
                {/* Space between input elements */}
                <CardContent className="space-y-4 px-2 pb-3 pt-2">
                  {error && (
                    <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5 shadow-inner py-2 px-3">
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                      <AlertDescription className="text-[11px] font-semibold">{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-1.5 group/input">
                    <Label htmlFor="email" className="text-[9px] font-extrabold text-[#102A43] uppercase tracking-widest pl-1 transition-colors duration-300 group-focus-within/input:text-[#00C9E0]">
                      Correo Electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400/80 transition-all duration-300 group-focus-within/input:text-[#00C9E0] group-focus-within/input:scale-110 group-focus-within/input:drop-shadow-[0_0_4px_rgba(0,201,224,0.4)]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="sebastian@epotech.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="rounded-[12px] border-slate-200 focus:border-[#00C9E0] focus:ring-4 focus:ring-[#00C9E0]/12 h-10.5 pl-11 pr-4 shadow-sm bg-white font-medium text-slate-800 focus:shadow-[0_0_15px_rgba(0,201,224,0.1)] transition-all duration-300 text-xs hover:border-[#00C9E0]/40"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 group/input">
                    <Label htmlFor="password" className="text-[9px] font-extrabold text-[#102A43] uppercase tracking-widest pl-1 transition-colors duration-300 group-focus-within/input:text-[#00C9E0]">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400/80 transition-all duration-300 group-focus-within/input:text-[#00C9E0] group-focus-within/input:scale-110 group-focus-within/input:drop-shadow-[0_0_4px_rgba(0,201,224,0.4)]" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="rounded-[12px] border-slate-200 focus:border-[#00C9E0] focus:ring-4 focus:ring-[#00C9E0]/12 h-10.5 pl-11 pr-10 shadow-sm bg-white font-medium text-slate-800 focus:shadow-[0_0_15px_rgba(0,201,224,0.1)] transition-all duration-300 text-xs hover:border-[#00C9E0]/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#00C9E0] transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="px-2 pb-4 pt-3 bg-transparent border-0">
                  <Button 
                    className="w-full h-11 rounded-[12px] font-extrabold bg-[#00C9E0] hover:bg-[#00B5CC] text-white transition-all duration-300 shadow-lg shadow-[#00C9E0]/25 hover:shadow-[0_0_25px_rgba(0,201,224,0.45)] text-xs hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 border border-transparent relative overflow-hidden active:translate-y-px" 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="absolute inset-0 w-full h-full bg-[#00B5CC] flex items-center justify-center">
                        {/* Turbulent water spray filling effect */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-[#00B5CC]" 
                          style={{
                            width: '100%',
                            backgroundImage: 'linear-gradient(90deg, #00C9E0 0%, #80EFFF 50%, #00C9E0 100%)',
                            backgroundSize: '200% auto',
                            animation: 'shimmerWater 1.2s linear infinite'
                          }}
                        />
                        <div className="relative z-10 flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <span className="text-white uppercase tracking-widest text-[9px] font-black">Cargando Presión...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        <LogIn className="h-4 w-4 text-white" />
                        <span className="text-white">Ingresar al Sistema</span>
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>

        {/* Global animations for dynamic hydraulic micro-effects */}
        <style>{`
          @keyframes shimmerWater {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @media (max-height: 680px) {
            .login-hero-height {
              height: 125px !important;
            }
            .login-card-padding {
              padding-top: 10px !important;
              padding-bottom: 10px !important;
            }
            .login-form-logo {
              height: 48px !important;
            }
            .login-greeting-padding {
              margin-bottom: 4px !important;
            }
          }
          @media (min-height: 880px) {
            .login-hero-height {
              height: 330px !important;
            }
            .login-greeting-padding {
              margin-bottom: 24px !important;
            }
            .login-card-padding {
              padding-top: 48px !important;
              padding-bottom: 32px !important;
            }
          }
          @media (min-width: 760px) and (max-width: 1100px) and (min-height: 950px) {
            .login-hero-height {
              height: 350px !important;
            }
            .login-greeting-padding {
              margin-bottom: 28px !important;
            }
            .login-card-padding {
              padding-top: 36px !important;
              padding-bottom: 24px !important;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
