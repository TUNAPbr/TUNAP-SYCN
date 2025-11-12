'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/lib/store'
import { supabase, VendaComDetalhes } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Download, Filter, Search } from 'lucide-react'
import { useVendasUsuario, useUsuarioCompleto } from '@/hooks/usePermissoes';
import { useAuth } from '@/hooks/useAuth'; // Seu hook de autenticação existente

export default function RelatoriosPage() {
  const { user } = useUserStore()
  const [vendas, setVendas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [filtroBusca, setFiltroBusca] = useState('')

  useEffect(() => {
    loadVendas()
  }, [user])

  const { user } = useAuth(); // Pega usuário logado
  const { vendas, loading, error } = useVendasUsuario(user?.id);
  const { usuario } = useUsuarioCompleto(user?.id);

  // Calcular métricas baseadas nas vendas permitidas
  const totalVendas = vendas.length;
  const valorTotal = vendas.reduce((acc, v) => acc + Number(v.valor_total || 0), 0);
  const vendasHoje = vendas.filter(v => {
    const hoje = new Date().toISOString().split('T')[0];
    return v.data_venda === hoje;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded">
          Erro ao carregar dados: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header com informações do usuário */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        {usuario?.cargo && (
          <p className="text-gray-600">
            Olá, {usuario.usuario.nome} ({usuario.cargo.nome})
          </p>
        )}
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total de Vendas</h3>
          <p className="text-3xl font-bold mt-2">{totalVendas}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Valor Total</h3>
          <p className="text-3xl font-bold mt-2">
            R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Vendas Hoje</h3>
          <p className="text-3xl font-bold mt-2">{vendasHoje}</p>
        </div>
      </div>

      {/* Tabela de Vendas Recentes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Vendas Recentes</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Observações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vendas.slice(0, 10).map((venda) => (
                <tr key={venda.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(venda.data_venda).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {venda.numero_identificacao}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    R$ {Number(venda.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {venda.observacoes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {vendas.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            Nenhuma venda encontrada
          </div>
        )}
      </div>

      {/* Informações de Debug (remover em produção) */}
      {process.env.NODE_ENV === 'development' && usuario && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Cargo: {usuario.cargo?.nome} ({usuario.cargo?.escopo})</p>
          <p>Tipos de Equipe: {usuario.tipos_equipe?.map(t => t.nome).join(', ') || 'N/A'}</p>
          <p>Unidades: {usuario.unidades?.map(u => u.nome).join(', ') || 'N/A'}</p>
          <p>Grupos: {usuario.grupos?.map(g => g.nome).join(', ') || 'N/A'}</p>
          <p>Vendas visíveis: {vendas.length}</p>
        </div>
      )}
    </div>

  const loadVendas = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          unidades (nome),
          equipes (nome),
          usuarios (nome_completo)
        `)
        .order('data_venda', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      if (data) setVendas(data)
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    let vendasFiltradas = [...vendas]

    if (filtroDataInicio) {
      vendasFiltradas = vendasFiltradas.filter(
        (v) => v.data_venda >= filtroDataInicio
      )
    }

    if (filtroDataFim) {
      vendasFiltradas = vendasFiltradas.filter(
        (v) => v.data_venda <= filtroDataFim
      )
    }

    if (filtroBusca) {
      const busca = filtroBusca.toLowerCase()
      vendasFiltradas = vendasFiltradas.filter(
        (v) =>
          v.numero_identificacao.toLowerCase().includes(busca) ||
          v.unidades?.nome.toLowerCase().includes(busca) ||
          v.usuarios?.nome_completo.toLowerCase().includes(busca)
      )
    }

    return vendasFiltradas
  }

  const vendasFiltradas = aplicarFiltros()

  const calcularTotalPeriodo = () => {
    return vendasFiltradas.reduce((sum, v) => sum + Number(v.valor_total), 0)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
  }

  const exportarCSV = () => {
    const headers = ['Data', 'Número', 'Unidade', 'Equipe', 'Vendedor', 'Valor']
    const rows = vendasFiltradas.map((v) => [
      formatDate(v.data_venda),
      v.numero_identificacao,
      v.unidades?.nome || '',
      v.equipes?.nome || '',
      v.usuarios?.nome_completo || '',
      v.valor_total,
    ])

    let csv = headers.join(',') + '\n'
    rows.forEach((row) => {
      csv += row.join(',') + '\n'
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendas_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Relatórios de Vendas</h1>
        <p className="text-gray-600 mt-1">Visualize e analise todas as vendas registradas</p>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Data Início */}
          <div>
            <label className="label">Data Início</label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Data Fim */}
          <div>
            <label className="label">Data Fim</label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Busca */}
          <div className="md:col-span-2">
            <label className="label">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                className="input-field pl-10"
                placeholder="Número, unidade, vendedor..."
              />
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{vendasFiltradas.length}</span> vendas encontradas
            <span className="mx-2">•</span>
            Total: <span className="font-semibold">{formatCurrency(calcularTotalPeriodo())}</span>
          </div>
          <button
            onClick={exportarCSV}
            className="btn-secondary flex items-center gap-2"
            disabled={vendasFiltradas.length === 0}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Lista de Vendas */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Vendas Registradas
        </h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : vendasFiltradas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhuma venda encontrada com os filtros aplicados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Número
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Unidade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Equipe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Vendedor
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vendasFiltradas.map((venda) => (
                  <tr key={venda.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(venda.data_venda)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {venda.numero_identificacao}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {venda.unidades?.nome}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                        {venda.equipes?.nome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {venda.usuarios?.nome_completo}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(Number(venda.valor_total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
