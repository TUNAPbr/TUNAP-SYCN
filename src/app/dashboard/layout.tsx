'use client'

import { AuthProvider } from '@/components/AuthProvider'
import { useUserStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Home, ShoppingCart, BarChart3, LogOut, User, Menu, X, Settings } from 'lucide-react'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, nivelHierarquico, logout } = useUserStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    router.push('/')
  }

  // Verifica se o usuário é admin (nivel_acesso >= 80)
  const isAdmin = nivelHierarquico && nivelHierarquico.nivel_acesso >= 80

  const menuItems = [
    { icon: Home, label: 'Início', href: '/dashboard' },
    { 
      icon: ShoppingCart, 
      label: 'Agendamento', 
      subItems: [
        { icon: ShoppingCart, label: 'Nova Venda', href: '/dashboard/vendas/nova' },
        { icon: BarChart3, label: 'Relatórios', href: '/dashboard/relatorios' },
      ]
    },
  ]

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar Desktop - SEMPRE VISÍVEL */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Image
                    src="/logo-tunap.png"
                    alt="TUNAP Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary-600">TUNAP</h1>
                  <p className="text-xs text-gray-600">Sync</p>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.nome_completo}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {nivelHierarquico?.label}
                  </p>
                </div>
              </div>
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
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
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
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )}
                </div>
              ))}

              {/* Botão Admin - Apenas se for admin */}
              {isAdmin && (
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors font-medium"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Painel Admin</span>
                  </Link>
                </div>
              )}
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

        {/* Sidebar Mobile */}
        <aside
          className={`
            lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex flex-col h-full">
            {/* Logo Mobile */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Image
                    src="/logo-tunap.png"
                    alt="TUNAP Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary-600">TUNAP</h1>
                  <p className="text-xs text-gray-600">Sync</p>
                </div>
              </div>
            </div>

            {/* User Info Mobile */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.nome_completo}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {nivelHierarquico?.label}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Mobile */}
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
                            onClick={() => setSidebarOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
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
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )}
                </div>
              ))}

              {/* Botão Admin Mobile - Apenas se for admin */}
              {isAdmin && (
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <Link
                    href="/admin"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors font-medium"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Painel Admin</span>
                  </Link>
                </div>
              )}
            </nav>

            {/* Logout Mobile */}
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

        {/* Overlay Mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64">
          {/* Header Mobile */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo-tunap.png"
                  alt="TUNAP Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
              <h1 className="text-lg font-bold text-gray-900">TUNAP Sync</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Page Content */}
          <main className="p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}
