'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { SearchableSelect } from '@/components/SearchableSelect'
import { Plus, Trash2, Save, ArrowLeft, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useEquipesUsuario } from '@/hooks/usePermissoes'
import { useAuth } from '@/hooks/useAuth'

interface UnidadeFormatada {
  value: string
  label: string
}

interface ProdutoFormatado {
  value: string
  label: string
}

interface ItemVenda {
  produto_id: string
  produto_nome: string
  quantidade: number
}

export default function NovaVendaPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const { user: authUser } = useAuth()
  const { equipes, loading: loadingEquipes } = useEquipesUsuario(authUser?.id)

  // Estados do formulário
  const [formData, setFormData] = useState({
    equipe_id: '',
    data_venda: new Date().toISOString().split('T')[0],
    numero_identificacao: '',
    valor_total: '',
    observacoes: '',
  })

  // Estados auxiliares
  const [unidades, setUnidades] = useState<UnidadeFormatada[]>([])
  const [produtos, setProdutos] = useState<ProdutoFormatado[]>([])
  const [itens, setItens] = useState<ItemVenda[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadUnidades()
  }, [user])

  useEffect(() => {
    if (formData.equipe_id) {
      const equipeSelecionada = equipes.find(e => e.id === formData.equipe_id)
      if (equipeSelecionada) {
        loadProdutos(equipeSelecionada.unidade_id)
      }
    }
  }, [formData.equipe_id, equipes])

  const loadUnidades = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('unidades')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error

      const unidadesFormatadas = (data || []).map((u) => ({
        value: u.id,
        label: u.nome,
      }))

      setUnidades(unidadesFormatadas)
    } catch (error) {
      console.error('Erro ao carregar unidades:', error)
    }
  }

  const loadProdutos = async (unidadeId: string) => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome')
        .eq('unidade_id', unidadeId)
        .eq('ativo', true)
        .order('nome')

      if (error) throw error

      const produtosFormatados = (data || []).map((p) => ({
        value: p.id,
        label: p.nome,
      }))

      setProdutos(produtosFormatados)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const adicionarItem = () => {
    setItens([
      ...itens,
      {
        produto_id: '',
        produto_nome: '',
        quantidade: 1,
      },
    ])
  }

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const atualizarItem = (index: number, field: keyof ItemVenda, value: any) => {
    const novosItens = [...itens]
    if (field === 'produto_id') {
      const produto = produtos.find((p) => p.value === value)
      novosItens[index].produto_id = value
      novosItens[index].produto_nome = produto?.label || ''
    } else {
      novosItens[index][field] = value
    }
    setItens(novosItens)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validar que a equipe selecionada é permitida
      const equipeSelecionada = equipes.find(eq => eq.id === formData.equipe_id)
      if (!equipeSelecionada) {
        throw new Error('Equipe não permitida para este usuário')
      }

      // Validar itens
      if (itens.length === 0) {
        throw new Error('Adicione pelo menos um produto')
      }

      // Validar todos os itens
      for (const item of itens) {
        if (!item.produto_id) {
          throw new Error('Selecione um produto para todos os itens')
        }
        if (item.quantidade < 1) {
          throw new Error('Quantidade deve ser maior que zero')
        }
      }

      // Criar venda
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          usuario_id: user?.id,
          equipe_id: formData.equipe_id,
          unidade_id: equipeSelecionada.unidade_id,
          data_venda: formData.data_venda,
          numero_identificacao: formData.numero_identificacao,
          valor_total: parseFloat(formData.valor_total),
          observacoes: formData.observacoes || null,
        })
        .select()
        .single()

      if (vendaError) throw vendaError

      // Criar itens da venda
      const itensParaInserir = itens.map(item => ({
        venda_id: vendaData.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
      }))

      const { error: itensError } = await supabase
        .from('itens_venda')
        .insert(itensParaInserir)

      if (itensError) throw itensError

      setSuccess(true)
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err: any) {
      console.error('Erro ao criar venda:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingEquipes) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Se usuário não tem equipes permitidas
  if (equipes.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded">
          <p className="font-medium">Sem permissão para criar vendas</p>
          <p className="text-sm mt-1">
            Você não possui equipes vinculadas. Entre em contato com o administrador.
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Save className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Venda Cadastrada com Sucesso!
          </h2>
          <p className="text-gray-600">
            Redirecionando para o dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Nova Venda</h1>
          <p className="text-gray-600 mt-1">Registre uma nova venda realizada</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Básicos */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Informações da Venda
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Equipe */}
            <div className="md:col-span-2">
              <label className="label">Equipe *</label>
              <select
                required
                value={formData.equipe_id}
                onChange={e => setFormData(prev => ({ ...prev, equipe_id: e.target.value }))}
                className="input-field"
                disabled={loading}
              >
                <option value="">Selecione uma equipe</option>
                {equipes.map(equipe => (
                  <option key={equipe.id} value={equipe.id}>
                    {equipe.nome}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Mostrando apenas equipes que você tem permissão
              </p>
            </div>

            {/* Data */}
            <div>
              <label className="label">Data da Venda *</label>
              <input
                type="date"
                value={formData.data_venda}
                onChange={(e) => setFormData(prev => ({ ...prev, data_venda: e.target.value }))}
                className="input-field"
                required
                disabled={loading}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            {/* Número de Identificação */}
            <div>
              <label className="label">Número NF / OS / OSW *</label>
              <input
                type="text"
                value={formData.numero_identificacao}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_identificacao: e.target.value }))}
                className="input-field"
                placeholder="Ex: NF-12345 ou OS-67890"
                required
                disabled={loading}
              />
            </div>

            {/* Valor Total */}
            <div>
              <label className="label">Valor Total *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_total}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_total: e.target.value }))}
                className="input-field"
                placeholder="0.00"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Observações */}
          <div className="mt-4">
            <label className="label">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              className="input-field"
              rows={3}
              placeholder="Informações adicionais sobre a venda..."
              disabled={loading}
            />
          </div>
        </div>

        {/* Produtos */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Produtos Vendidos</h2>
            <button
              type="button"
              onClick={adicionarItem}
              disabled={!formData.equipe_id || loading || produtos.length === 0}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Produto
            </button>
          </div>

          {!formData.equipe_id ? (
            <div className="text-center py-8 text-gray-500">
              Selecione uma equipe primeiro para ver os produtos disponíveis.
            </div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum produto cadastrado para esta unidade.
            </div>
          ) : itens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum produto adicionado ainda.
              <br />
              Clique em "Adicionar Produto" para começar.
            </div>
          ) : (
            <div className="space-y-4">
              {itens.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  {/* Produto */}
                  <div className="md:col-span-10">
                    <label className="label">Produto *</label>
                    <select
                      value={item.produto_id}
                      onChange={(e) => atualizarItem(index, 'produto_id', e.target.value)}
                      className="input-field"
                      required
                      disabled={loading}
                    >
                      <option value="">Selecione o produto...</option>
                      {produtos.map(produto => (
                        <option key={produto.value} value={produto.value}>
                          {produto.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantidade */}
                  <div className="md:col-span-1">
                    <label className="label">Qtd *</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) =>
                        atualizarItem(index, 'quantidade', Number(e.target.value))
                      }
                      className="input-field"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Remover */}
                  <div className="md:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removerItem(index)}
                      className="btn-danger w-full p-2"
                      disabled={loading}
                      title="Remover item"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Total de Itens */}
              <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-700">
                  Total de Produtos:
                </span>
                <span className="text-2xl font-bold text-primary-600">
                  {itens.reduce((sum, item) => sum + item.quantidade, 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary flex-1"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || itens.length === 0}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Venda
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
