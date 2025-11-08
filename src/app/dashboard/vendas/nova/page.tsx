'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/store'
import { supabase, Produto, Unidade, Equipe } from '@/lib/supabase'
import { Plus, Trash2, Save, ArrowLeft, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface ItemVenda {
  produto_id: string
  produto_nome: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

export default function NovaVendaPage() {
  const router = useRouter()
  const { user, equipes } = useUserStore()

  // Estados do formulário
  const [dataVenda, setDataVenda] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [numeroIdentificacao, setNumeroIdentificacao] = useState('')
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('')
  const [equipeSelecionada, setEquipeSelecionada] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState<ItemVenda[]>([])

  // Estados auxiliares
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [equipesDisponiveis, setEquipesDisponiveis] = useState<Equipe[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  // Carregar unidades disponíveis
  useEffect(() => {
    loadUnidades()
  }, [equipes])

  // Carregar equipes quando unidade mudar
  useEffect(() => {
    if (unidadeSelecionada) {
      loadEquipes()
      loadProdutos()
    }
  }, [unidadeSelecionada])

  const loadUnidades = async () => {
    if (!equipes || equipes.length === 0) return

    try {
      // Buscar unidades das equipes do usuário
      const unidadeIds = Array.from(new Set(equipes.map((e) => e.unidade_id)))
      
      const { data, error } = await supabase
        .from('unidades')
        .select('*')
        .in('id', unidadeIds)
        .eq('ativo', true)

      if (error) throw error
      
      if (data) {
        setUnidades(data)
        if (data.length === 1) {
          setUnidadeSelecionada(data[0].id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error)
    }
  }

  const loadEquipes = async () => {
    if (!unidadeSelecionada) return

    try {
      // Filtrar equipes do usuário para a unidade selecionada
      const equipesUnidade = equipes.filter(
        (e) => e.unidade_id === unidadeSelecionada
      )
      
      setEquipesDisponiveis(equipesUnidade)
      
      if (equipesUnidade.length === 1) {
        setEquipeSelecionada(equipesUnidade[0].id)
      }
    } catch (error) {
      console.error('Erro ao carregar equipes:', error)
    }
  }

  const loadProdutos = async () => {
    if (!unidadeSelecionada) return

    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('unidade_id', unidadeSelecionada)
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      if (data) setProdutos(data)
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
        preco_unitario: 0,
        subtotal: 0,
      },
    ])
  }

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const atualizarItem = (index: number, campo: keyof ItemVenda, valor: any) => {
    const novosItens = [...itens]
    
    if (campo === 'produto_id') {
      const produto = produtos.find((p) => p.id === valor)
      if (produto) {
        novosItens[index].produto_id = valor
        novosItens[index].produto_nome = produto.nome
        novosItens[index].preco_unitario = Number(produto.preco_base)
      }
    } else {
      novosItens[index][campo] = valor as never
    }

    // Recalcular subtotal
    novosItens[index].subtotal =
      novosItens[index].quantidade * novosItens[index].preco_unitario

    setItens(novosItens)
  }

  const calcularTotal = () => {
    return itens.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const validarFormulario = () => {
    if (!dataVenda) {
      setErro('Data da venda é obrigatória')
      return false
    }

    if (!numeroIdentificacao.trim()) {
      setErro('Número de identificação é obrigatório')
      return false
    }

    if (!unidadeSelecionada) {
      setErro('Selecione uma unidade')
      return false
    }

    if (!equipeSelecionada) {
      setErro('Selecione uma equipe')
      return false
    }

    if (itens.length === 0) {
      setErro('Adicione pelo menos um produto')
      return false
    }

    for (const item of itens) {
      if (!item.produto_id) {
        setErro('Selecione um produto para todos os itens')
        return false
      }
      if (item.quantidade <= 0) {
        setErro('Quantidade deve ser maior que zero')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    if (!validarFormulario() || !user) return

    setLoading(true)

    try {
      const valorTotal = calcularTotal()

      // Inserir venda
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          usuario_id: user.id,
          unidade_id: unidadeSelecionada,
          equipe_id: equipeSelecionada,
          data_venda: dataVenda,
          numero_identificacao: numeroIdentificacao,
          valor_total: valorTotal,
          observacoes: observacoes || null,
        })
        .select()
        .single()

      if (vendaError) throw vendaError

      // Inserir itens da venda
      const itensParaInserir = itens.map((item) => ({
        venda_id: vendaData.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
      }))

      const { error: itensError } = await supabase
        .from('venda_itens')
        .insert(itensParaInserir)

      if (itensError) throw itensError

      setSucesso(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Erro ao salvar venda:', error)
      setErro(error.message || 'Erro ao salvar venda. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
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
            {/* Data */}
            <div>
              <label className="label">Data da Venda *</label>
              <input
                type="date"
                value={dataVenda}
                onChange={(e) => setDataVenda(e.target.value)}
                className="input-field"
                required
                disabled={loading}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            {/* Número de Identificação */}
            <div>
              <label className="label">Número OS / NF *</label>
              <input
                type="text"
                value={numeroIdentificacao}
                onChange={(e) => setNumeroIdentificacao(e.target.value)}
                className="input-field"
                placeholder="Ex: OS-12345"
                required
                disabled={loading}
              />
            </div>

            {/* Unidade */}
            <div>
              <label className="label">Unidade *</label>
              <select
                value={unidadeSelecionada}
                onChange={(e) => {
                  setUnidadeSelecionada(e.target.value)
                  setEquipeSelecionada('')
                  setItens([])
                }}
                className="input-field"
                required
                disabled={loading || unidades.length === 1}
              >
                <option value="">Selecione...</option>
                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Equipe */}
            <div>
              <label className="label">Equipe *</label>
              <select
                value={equipeSelecionada}
                onChange={(e) => setEquipeSelecionada(e.target.value)}
                className="input-field"
                required
                disabled={loading || !unidadeSelecionada || equipesDisponiveis.length === 1}
              >
                <option value="">Selecione...</option>
                {equipesDisponiveis.map((equipe) => (
                  <option key={equipe.id} value={equipe.id}>
                    {equipe.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Observações */}
          <div className="mt-4">
            <label className="label">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
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
              disabled={!unidadeSelecionada || loading}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Produto
            </button>
          </div>

          {itens.length === 0 ? (
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
                  <div className="md:col-span-5">
                    <label className="label">Produto *</label>
                    <select
                      value={item.produto_id}
                      onChange={(e) =>
                        atualizarItem(index, 'produto_id', e.target.value)
                      }
                      className="input-field"
                      required
                      disabled={loading}
                    >
                      <option value="">Selecione...</option>
                      {produtos.map((produto) => (
                        <option key={produto.id} value={produto.id}>
                          {produto.nome} - R$ {Number(produto.preco_base).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantidade */}
                  <div className="md:col-span-2">
                    <label className="label">Quantidade *</label>
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

                  {/* Preço Unitário */}
                  <div className="md:col-span-2">
                    <label className="label">Preço Unit. *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.preco_unitario}
                      onChange={(e) =>
                        atualizarItem(index, 'preco_unitario', Number(e.target.value))
                      }
                      className="input-field"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="md:col-span-2">
                    <label className="label">Subtotal</label>
                    <input
                      type="text"
                      value={`R$ ${item.subtotal.toFixed(2)}`}
                      className="input-field bg-gray-200"
                      disabled
                    />
                  </div>

                  {/* Remover */}
                  <div className="md:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removerItem(index)}
                      className="btn-danger w-full md:w-auto p-2"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-700">
                  Valor Total:
                </span>
                <span className="text-2xl font-bold text-primary-600">
                  R$ {calcularTotal().toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{erro}</span>
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
