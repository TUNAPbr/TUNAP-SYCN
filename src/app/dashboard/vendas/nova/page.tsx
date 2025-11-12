'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { SearchableSelect } from '@/components/SearchableSelect'
import { Plus, Trash2, Save, ArrowLeft, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useEquipesUsuario } from '@/hooks/usePermissoes';
import { useAuth } from '@/hooks/useAuth';

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

  const { user } = useAuth();
  const { equipes, loading: loadingEquipes } = useEquipesUsuario(user?.id);

  const [formData, setFormData] = useState({
    equipe_id: '',
    data_venda: new Date().toISOString().split('T')[0],
    numero_identificacao: '',
    valor_total: '',
    observacoes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validar que a equipe selecionada é permitida
      const equipeSelecionada = equipes.find(eq => eq.id === formData.equipe_id);
      if (!equipeSelecionada) {
        throw new Error('Equipe não permitida para este usuário');
      }

      const { error: insertError } = await supabase
        .from('vendas')
        .insert({
          usuario_id: user?.id,
          equipe_id: formData.equipe_id,
          unidade_id: equipeSelecionada.unidade_id,
          data_venda: formData.data_venda,
          numero_identificacao: formData.numero_identificacao,
          valor_total: parseFloat(formData.valor_total),
          observacoes: formData.observacoes || null,
        });

      if (insertError) throw insertError;

      setSuccess(true);
      // Limpar formulário
      setFormData({
        equipe_id: '',
        data_venda: new Date().toISOString().split('T')[0],
        numero_identificacao: '',
        valor_total: '',
        observacoes: '',
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erro ao criar venda:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingEquipes) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
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
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Nova Venda</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-600 rounded">
            Venda criada com sucesso!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Equipe *</label>
            <select
              required
              value={formData.equipe_id}
              onChange={e => setFormData(prev => ({ ...prev, equipe_id: e.target.value }))}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <div>
            <label className="block text-sm font-medium mb-1">Data da Venda *</label>
            <input
              type="date"
              required
              value={formData.data_venda}
              onChange={e => setFormData(prev => ({ ...prev, data_venda: e.target.value }))}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Número de Identificação *</label>
            <input
              type="text"
              required
              value={formData.numero_identificacao}
              onChange={e => setFormData(prev => ({ ...prev, numero_identificacao: e.target.value }))}
              placeholder="Ex: OS-12345"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Valor Total *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.valor_total}
              onChange={e => setFormData(prev => ({ ...prev, valor_total: e.target.value }))}
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={e => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={4}
              placeholder="Informações adicionais..."
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-4 py-2 border rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Criar Venda'}
            </button>
          </div>
        </form>
      </div>
    </div>

  useEffect(() => {
    loadUnidades()
  }, [user])

  useEffect(() => {
    if (unidadeSelecionada) {
      loadProdutos()
    } else {
      setProdutos([])
      setItens([])
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

      const { data: unidadesData, error: unidadesError } = await supabase
        .from('unidades')
        .select(`
          id,
          nome,
          cnpj,
          grupos (nome, conglomerados (nome)),
          marcas (nome)
        `)
        .in('id', unidadeIds)
        .eq('ativo', true)
        .order('nome')

      if (unidadesError) throw unidadesError

      if (unidadesData) {
        const unidadesFormatadas: UnidadeFormatada[] = unidadesData.map((u: any) => {
          const conglomerado = u.grupos?.conglomerados?.nome || ''
          const grupo = u.grupos?.nome || ''
          const marca = u.marcas?.nome || ''
          
          // Formato: "Conglomerado > Grupo > Marca > Unidade - CNPJ"
          let label = ''
          if (conglomerado) label += conglomerado + ' > '
          if (grupo) label += grupo + ' > '
          if (marca) label += marca + ' > '
          label += `${u.nome} - ${formatCNPJ(u.cnpj)}`

          return {
            value: u.id,
            label,
          }
        })

        setUnidades(unidadesFormatadas)

        if (unidadesFormatadas.length === 1) {
          setUnidadeSelecionada(unidadesFormatadas[0].value)
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
            value: item.produtos.id,
            label: `${item.referencia_local || 'S/REF'} - ${item.produtos.nome_sintetico}`,
          }))

        setProdutos(produtosFormatados)
      }
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error)
      setErro('Erro ao carregar produtos: ' + error.message)
    }
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
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

  const atualizarItem = (index: number, campo: keyof ItemVenda, valor: any) => {
    const novosItens = [...itens]
    
    if (campo === 'produto_id') {
      const produto = produtos.find((p) => p.value === valor)
      if (produto) {
        novosItens[index].produto_id = valor
        novosItens[index].produto_nome = produto.label
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

            {/* Unidade com SearchableSelect */}
            <div className="md:col-span-2">
              <SearchableSelect
                label="Unidade"
                options={unidades}
                value={unidadeSelecionada}
                onChange={(value) => {
                  setUnidadeSelecionada(value)
                  setItens([])
                }}
                placeholder="Selecione a unidade..."
                disabled={loading}
                required
              />
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
                  {/* Produto com SearchableSelect */}
                  <div className="md:col-span-10">
                    <SearchableSelect
                      label="Produto"
                      options={produtos}
                      value={item.produto_id}
                      onChange={(value) => atualizarItem(index, 'produto_id', value)}
                      placeholder="Selecione o produto..."
                      disabled={loading}
                      required
                    />
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
