'use client'

import { AuthProvider } from '@/components/AuthProvider'
import { AdminAuthGuard } from '@/components/AdminAuthGuard'
import { useUserStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Home, 
  Building2, 
  Network, 
  MapPin, 
  Users, 
  Package, 
  Link as LinkIcon,
  UserPlus,
  Tag,
  Users2,
  ArrowLeft,
  LogOut
} from 'lucide-react'
import { useState } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useUserStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    router.push('/')
  }

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/admin' },
    { 
      icon: Building2, 
      label: 'Estrutura', 
      subItems: [
        { icon: Building2, label: 'Conglomerados', href: '/admin/conglomerados' },
        { icon: Network, label: 'Grupos', href: '/admin/grupos' },
        { icon: Tag, label: 'Marcas', href: '/admin/marcas' },
        { icon: MapPin, label: 'Unidades', href: '/admin/unidades' },
        { icon: Users2, label: 'Equipes', href: '/admin/equipes' },
      ]
    },
    { icon: Users, label: 'Usuários', href: '/admin/usuarios' },
    { 
      icon: Package, 
      label: 'Produtos', 
      subItems: [
        { icon: Package, label: 'Produtos TUNAP', href: '/admin/produtos' },
        { icon: LinkIcon, label: 'Produtos x Unidades', href: '/admin/produtos-unidades' },
      ]
    },
    { icon: UserPlus, label: 'Usuários x Equipes', href: '/admin/usuarios-equipes' },
  ]

  return (
    <AuthProvider>
      <AdminAuthGuard>
        <div className="min-h-screen bg-gray-50 flex">
          {/* Sidebar Desktop */}
          <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <Image
                    src="/logo-tunap.png"
                    alt="TUNAP Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-primary-600">ADMIN</h1>
                    <p className="text-xs text-gray-600">Painel Administrativo</p>
                  </div>
                </div>
                
                {/* Voltar ao Dashboard */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao Sistema
                </Link>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                  <div key={item.label}>
                    {item.subItems ? (
                      <div>
                        <div className="flex items-center gap-3 px-3 py-2 text-gray-700 font-medium text-sm">
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </div>
                        <div className="ml-8 space-y-1">
                          {item.subItems.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                pathname === subItem.href
                                  ? 'bg-primary-50 text-primary-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <subItem.icon className="w-4 h-4" />
                              <span>{subItem.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={item.href!}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          pathname === item.href
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </nav>

              {/* Logout */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 lg:pl-64">
            {/* Header Mobile */}
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo-tunap.png"
                  alt="TUNAP Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <h1 className="text-lg font-bold text-gray-900">ADMIN</h1>
              </div>
            </div>

            <main className="p-4 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </AdminAuthGuard>
    </AuthProvider>
  )
}
