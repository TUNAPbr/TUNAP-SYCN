'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Building2, 
  Network, 
  MapPin, 
  Users, 
  Package, 
  Users2,
  TrendingUp 
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    conglomerados: 0,
    grupos: 0,
    unidades: 0,
    equipes: 0,
    usuarios: 0,
    produtos: 0,
    marcas: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [
        { count: conglomerados },
        { count: grupos },
        { count: unidades },
        { count: equipes },
        { count: usuarios },
        { count: produtos },
        { count: marcas },
      ] = await Promise.all([
        supabase.from('conglomerados').select('*', { count: 'exact', head: true }),
        supabase.from('grupos').select('*', { count: 'exact', head: true }),
        supabase.from('unidades').select('*', { count: 'exact', head: true }),
        supabase.from('equipes').select('*', { count: 'exact', head: true }),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }),
        supabase.from('produtos').select('*', { count: 'exact', head: true }),
        supabase.from('marcas').select('*', { count: 'exact', head: true }),
      ])

      setStats({
        conglomerados: conglomerados || 0,
        grupos: grupos || 0,
        unidades: unidades || 0,
        equipes: equipes || 0,
        usuarios: usuarios || 0,
        produtos: produtos || 0,
        marcas: marcas || 0,
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      title: 'Conglomerados',
      value: stats.conglomerados,
      icon: Building2,
      color: 'bg-blue-500',
      href: '/admin/conglomerados',
    },
    {
      title: 'Grupos',
      value: stats.grupos,
      icon: Network,
      color: 'bg-purple-500',
      href: '/admin/grupos',
    },
    {
      title: 'Marcas',
      value: stats.marcas,
      icon: TrendingUp,
      color: 'bg-pink-500',
      href: '/admin/marcas',
    },
    {
      title: 'Unidades',
      value: stats.unidades,
      icon: MapPin,
      color: 'bg-green-500',
      href: '/admin/unidades',
    },
    {
      title: 'Equipes',
      value: stats.equipes,
      icon: Users2,
      color: 'bg-orange-500',
      href: '/admin/equipes',
    },
    {
      title: 'Usuários',
      value: stats.usuarios,
      icon: Users,
      color: 'bg-red-500',
      href: '/admin/usuarios',
    },
    {
      title: 'Produtos TUNAP',
      value: stats.produtos,
      icon: Package,
      color: 'bg-indigo-500',
      href: '/admin/produtos',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-600 mt-1">Visão geral do sistema</p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <a
              key={index}
              href={card.href}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} p-4 rounded-lg`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/admin/usuarios"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center group"
          >
            <Users className="w-8 h-8 text-gray-400 group-hover:text-primary-600 mx-auto mb-2" />
            <p className="font-medium text-gray-700 group-hover:text-primary-600">
              Gerenciar Usuários
            </p>
          </a>

          <a
            href="/admin/unidades"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center group"
          >
            <MapPin className="w-8 h-8 text-gray-400 group-hover:text-primary-600 mx-auto mb-2" />
            <p className="font-medium text-gray-700 group-hover:text-primary-600">
              Gerenciar Unidades
            </p>
          </a>

          <a
            href="/admin/produtos-unidades"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center group"
          >
            <Package className="w-8 h-8 text-gray-400 group-hover:text-primary-600 mx-auto mb-2" />
            <p className="font-medium text-gray-700 group-hover:text-primary-600">
              Produtos x Unidades
            </p>
          </a>
        </div>
      </div>

      {/* Info */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">ℹ️</span>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              Bem-vindo ao Painel Admin
            </h3>
            <p className="text-blue-800 text-sm">
              Aqui você pode gerenciar toda a estrutura do sistema: conglomerados,
              grupos, unidades, equipes, usuários e produtos. Use o menu lateral
              para navegar entre as seções.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
