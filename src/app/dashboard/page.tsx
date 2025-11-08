'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { TrendingUp, DollarSign, ShoppingBag, Calendar } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

interface DashboardStats {
  vendasHoje: number
  vendasMes: number
  valorHoje: number
  valorMes: number
}

export default function DashboardPage() {
  const { user } = useUserStore()
  const [stats, setStats] = useState<DashboardStats>({
    vendasHoje: 0,
    vendasMes: 0,
    valorHoje: 0,
    valorMes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [user])

  const loadStats = async () => {
    if (!user) return

    try {
      const hoje = format(new Date(), 'yyyy-MM-dd')
      const inicioMes = format(startOfMonth(new Date()), 'yyyy-MM-dd')
      const fimMes = format(endOfMonth(new Date()), 'yyyy-MM-dd')

      const { data: vendasHoje } = await supabase
        .from('vendas')
        .select('valor_total')
        .eq('data_venda', hoje)

      const { data: vendasMes } = await supabase
        .from('vendas')
        .select('valor_total')
        .gte('data_venda', inicioMes)
        .lte('data_venda', fimMes)

      if (vendasHoje) {
        setStats((prev) => ({
          ...prev,
          vendasHoje: vendasHoje.length,
          valorHoje: vendasHoje.reduce((sum, v) => sum + Number(v.valor_total), 0),
        }))
      }

      if (vendasMes) {
        setStats((prev) => ({
          ...prev,
          vendasMes: vendasMes.length,
          valorMes: vendasMes.reduce((sum, v) => sum + Number(v.valor_total), 0),
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const cards = [
    {
      title: 'Vendas Hoje',
      value: stats.vendasHoje,
      icon: ShoppingBag,
      color: 'bg-blue-500',
    },
    {
      title: 'Valor Hoje',
      value: formatCurrency(stats.valorHoje),
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Vendas do Mês',
      value: stats.vendasMes,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Valor do Mês',
      value: formatCurrency(stats.valorMes),
      icon: Calendar,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Olá, {user?.nome_completo?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Bem-vindo ao sistema de vendas TUNAP
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
