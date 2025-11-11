'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Save, ArrowLeft, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface UnidadeFormatada {
  id: string
  nome: string
  cnpj: string
  grupo_nome: string
  marca_nome: string
  label: string // "Grupo Marca Unidade - CNPJ"
}

interface ProdutoFormatado {
  id: string
  referencia_local: string
  nome_sintetico: string
  label: string // "referencia_local - nome_sintetico"
}

interface ItemVenda {
  produto_id: string
  produto_nome: string
  quantidade: number
}

export default function NovaVendaPage() {
  const router = useRouter()
  const { user } = useUserStore()

  // Estados do formulário
  const [dataVenda, setDataVenda] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [numeroIdentificacao, setNumeroIdentificacao] = useState('')
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState<ItemVenda[]>([])

  // Estados auxiliares
  const [unidades, setUnidades] = useState<UnidadeFormatada[]>([])
  const [produtos, setProdutos] = useState<ProdutoFormatado[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  // Estados de busca
  const [buscaUnidade, setBuscaUnidade] = useState('')
  const [buscaProduto, setBuscaProduto] = useState<string[]>([])

  useEffect(() => {
    loadUnidades()
  }, [user])

  useEffect(() => {
    if (unidadeSelecionada) {
      loadProdutos()
    } else {
      setProdutos([])
    }
  }, [unidadeSelecionada])

  const loadUnidades = async () => {
    if (!user) return

    try {
      const { data: equipesData, error: equipesError } = await supabase
        .from('usuario_equipes')
        .select('equipe_id')
        .eq('usuario_id', user.id)

      if (equipesError) throw equipesError
      if (!equipesData || equipesData.length === 0) {
        setErro('Você não está associado a nenhuma equipe')
        return
      }

      const equipeIds = equipesData.map((e) => e.equipe_id)

      const { data: equipesCompletas, error: equipesCompletasError } = await supabase
        .from('equipes')
        .select('unidade_id')
        .in('id', equipeIds)

      if (equipesCompletasError) throw equipesCompletasError

      const unidadeIds = Array.from(new Set(equipesCompletas?.map((e) => e.unidade_id) || []))

      // Buscar unidades com grupo e marca
      const { data: unidadesData, error: unidadesError } = await supabase
        .from('unidades')
        .select(`
          id,
          nome,
          cnpj,
          grupos (nome),
          marcas (nome)
        `)
        .in('id', unidadeIds)
        .eq('ativo', true)
        .order('nome')

      if (unidadesError) throw unidadesError

      if (unidadesData) {
        const unidadesFormatadas: UnidadeFormatada[] = unidadesData.map((u: any) => {
          const grupoNome = u.grupos?.nome || 'Sem Grupo'
          const marcaNome = u.marcas?.nome || 'Sem Marca'
          return {
            id: u.id,
            nome: u.nome,
            cnpj: u.cnpj,
            grupo_nome: grupoNome,
            marca_nome: marcaNome,
            label: `${grupoNome} ${marcaNome} ${u.nome} - ${u.cnpj}`,
          }
        })

        setUnidades(unidadesFormatadas)

        if (unidadesFormatadas.length === 1) {
          setUnidadeSelecionada(unidadesFormatadas[0].id)
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar unidades:', error)
      setErro('Erro ao carregar unidades: ' + error.message)
    }
  }

  const loadProdutos = async () => {
    if (!unidadeSelecionada) return

    try {
      const { data, error } = await supabase
        .from('produtos_unidades')
        .select(`
          produto_id,
          referencia_local,
          produtos (
            id,
            nome_sintetico
          )
        `)
        .eq('unidade_id', unidadeSelecionada)

      if (error) throw error

      if (data) {
        const produtosFormatados: ProdutoFormatado[] = data
          .filter((item: any) => item.produtos)
          .map((item: any) => ({
            id: item.produtos.id,
            referencia_local: item.referencia_local || 'S/REF',
            nome_sintetico: item.produtos.nome_sintetico,
            label: `${item.referencia_local || 'S/REF'} - ${item.produtos.nome_sintetico}`,
          }))

        setProdutos(produtosFormatados)
        setBuscaProduto(new Array(itens.length).fill(''))
      }
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error)
      setErro('Erro ao carregar produtos: ' + error.message)
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
    setBuscaProduto([...buscaProduto, ''])
  }

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
    setBuscaProduto(buscaProduto.filter((_, i) => i !== index))
  }

  const atualizarItem = (index: number, campo: keyof ItemVenda, valor: any) => {
    const novosItens = [...itens]
    
    if (campo === 'produto_id') {
      const produto = produtos.find((p) => p.id === valor)
      if (produto) {
        novosItens[index].produto_id = valor
        novosItens[index].produto_nome = produto.nome_sintetico
      }
    } else {
      novosItens[index][campo] = valor as never
    }

    setItens(novosItens)
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
      // Inserir venda (valor_total = 0 pois não temos preços)
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          usuario_id: user.id,
          unidade_id: unidadeSelecionada,
          data_venda: dataVenda,
          numero_identificacao: numeroIdentificacao,
          valor_total: 0,
          observacoes: observacoes || null,
        })
        .select()
        .single()

      if (vendaError) throw vendaError

      // Inserir itens da venda (sem preço)
      const itensParaInserir = itens.map((item) => ({
        venda_id: vendaData.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: 0,
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

  const unidadesFiltradas = unidades.filter((u) =>
    u.label.toLowerCase().includes(buscaUnidade.toLowerCase())
  )

  const getProdutosFiltrados = (index: number) => {
    const busca = buscaProduto[index] || ''
    return produtos.filter((p) =>
      p.label.toLowerCase().includes(busca.toLowerCase())
    )
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
              <label className="label">Número NF / OS / OSW *</label>
              <input
                type="text"
                value={numeroIdentificacao}
                onChange={(e) => setNumeroIdentificacao(e.target.value)}
                className="input-field"
                placeholder="Ex: NF-12345 ou OS-67890"
                required
                disabled={loading}
              />
            </div>

            {/* Unidade com Busca */}
            <div className="md:col-span-2">
              <label className="label">Unidade *</label>
              <input
                type="text"
                value={buscaUnidade}
                onChange={(e) => setBuscaUnidade(e.target.value)}
                className="input-field mb-2"
                placeholder="Digite para buscar..."
                disabled={loading}
              />
              <select
                value={unidadeSelecionada}
                onChange={(e) => {
                  setUnidadeSelecionada(e.target.value)
                  setItens([])
                }}
                className="input-field"
                required
                disabled={loading}
                size={Math.min(unidadesFiltradas.length + 1, 5)}
              >
                <option value="">Selecione a unidade...</option>
                {unidadesFiltradas.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.label}
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
              disabled={!unidadeSelecionada || loading || produtos.length === 0}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Produto
            </button>
          </div>

          {!unidadeSelecionada ? (
            <div className="text-center py-8 text-gray-500">
              Selecione uma unidade primeiro para ver os produtos disponíveis.
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
                  {/* Produto com Busca */}
                  <div className="md:col-span-10">
                    <label className="label">Produto *</label>
                    <input
                      type="text"
                      value={buscaProduto[index] || ''}
                      onChange={(e) => {
                        const novasBuscas = [...buscaProduto]
                        novasBuscas[index] = e.target.value
                        setBuscaProduto(novasBuscas)
                      }}
                      className="input-field mb-2"
                      placeholder="Digite para buscar..."
                      disabled={loading}
                    />
                    <select
                      value={item.produto_id}
                      onChange={(e) =>
                        atualizarItem(index, 'produto_id', e.target.value)
                      }
                      className="input-field"
                      required
                      disabled={loading}
                      size={Math.min(getProdutosFiltrados(index).length + 1, 5)}
                    >
                      <option value="">Selecione...</option>
                      {getProdutosFiltrados(index).map((produto) => (
                        <option key={produto.id} value={produto.id}>
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
