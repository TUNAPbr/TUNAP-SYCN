'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/admin/DataTable'
import { X, AlertCircle, CheckCircle } from 'lucide-react'

export default function ProdutosUnidadesPage() {
  const [vinculos, setVinculos] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  // Form states
  const [produtoId, setProdutoId] = useState('')
  const [unidadeId, setUnidadeId] = useState('')
  const [referenciaLocal, setReferenciaLocal] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [vinculosRes, produtosRes, unidadesRes] = await Promise.all([
        supabase
          .from('produtos_unidades')
          .select(`
            *,
            produtos (referencia, nome_sintetico),
            unidades (nome, cnpj)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('produtos')
          .select('*')
          .eq('ativo', true)
          .order('nome_sintetico'),
        supabase
          .from('unidades')
          .select('*, grupos (nome)')
          .eq('ativo', true)
          .order('nome')
      ])

      if (vinculosRes.error) throw vinculosRes.error
      if (produtosRes.error) throw produtosRes.error
      if (unidadesRes.error) throw unidadesRes.error

      setVinculos(vinculosRes.data || [])
      setProdutos(produtosRes.data || [])
      setUnidades(unidadesRes.data || [])
    } catch (error: any) {
      console.error('Erro:', error)
      setErro(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditando(null)
    setProdutoId('')
    setUnidadeId('')
    setReferenciaLocal('')
    setErro('')
    setSucesso('')
    setShowModal(true)
  }

  const handleEdit = (row: any) => {
    setEditando(row)
    setProdutoId(row.produto_id)
    setUnidadeId(row.unidade_id)
    setReferenciaLocal(row.referencia_local || '')
    setErro('')
    setSucesso('')
    setShowModal(true)
  }

  const handleDelete = async (row: any) => {
    if (!confirm('Deseja realmente remover este vínculo?')) return

    try {
      const { error } = await supabase
        .from('produtos_unidades')
        .delete()
        .eq('id', row.id)

      if (error) throw error

      setSucesso('Vínculo removido com sucesso!')
      await loadData()
      setTimeout(() => setSucesso(''), 3000)
    } catch (error: any) {
      alert('Erro ao remover: ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setSucesso('')

    try {
      const vinculoData = {
        produto_id: produtoId,
        unidade_id: unidadeId,
        referencia_local: referenciaLocal || null,
      }

      if (editando) {
        const { error } = await supabase
          .from('produtos_unidades')
          .update(vinculoData)
          .eq('id', editando.id)

        if (error) throw error
        setSucesso('Vínculo atualizado com sucesso!')
      } else {
        // Verificar se já existe
        const { data: existente } = await supabase
          .from('produtos_unidades')
          .select('id')
          .eq('produto_id', produtoId)
          .eq('unidade_id', unidadeId)
          .single()

        if (existente) {
          setErro('Este vínculo já existe!')
          return
        }

        const { error } = await supabase
          .from('produtos_unidades')
          .insert(vinculoData)

        if (error) throw error
        setSucesso('Vínculo criado com sucesso!')
      }

      setShowModal(false)
      await loadData()
      setTimeout(() => setSucesso(''), 3000)
    } catch (error: any) {
      setErro(error.message)
    }
  }

  const columns = [
    {
      key: 'produtos',
      label: 'Produto TUNAP',
      render: (value: any) => (
        <div>
          <p className="font-medium text-gray-900">
            {value?.nome_sintetico || '-'}
          </p>
          <p className="text-xs text-gray-500">
            Ref: {value?.referencia || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'referencia_local',
      label: 'Ref. Local',
      render: (value: string | null) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
          {value || 'Não definida'}
        </span>
      ),
    },
    {
      key: 'unidades',
      label: 'Unidade',
      render: (value: any) => (
        <div>
          <p className="font-medium text-gray-900">
            {value?.nome || '-'}
          </p>
          <p className="text-xs text-gray-500">
            CNPJ: {value?.cnpj || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Vinculado em',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR'),
    },
  ]

  return (
    <>
      {sucesso && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span>{sucesso}</span>
        </div>
      )}

      <DataTable
        title="Produtos x Unidades"
        columns={columns}
        data={vinculos}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar vínculo..."
        loading={loading}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editando ? 'Editar' : 'Novo'} Vínculo
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Produto TUNAP *</label>
                <select
                  value={produtoId}
                  onChange={(e) => setProdutoId(e.target.value)}
                  className="input-field"
                  required
                  disabled={!!editando}
                >
                  <option value="">Selecione...</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.referencia} - {p.nome_sintetico}
                    </option>
                  ))}
                </select>
                {editando && (
                  <p className="text-xs text-gray-500 mt-1">
                    Produto não pode ser alterado
                  </p>
                )}
              </div>

              <div>
                <label className="label">Unidade *</label>
                <select
                  value={unidadeId}
                  onChange={(e) => setUnidadeId(e.target.value)}
                  className="input-field"
                  required
                  disabled={!!editando}
                >
                  <option value="">Selecione...</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.grupos?.nome} - {u.nome}
                    </option>
                  ))}
                </select>
                {editando && (
                  <p className="text-xs text-gray-500 mt-1">
                    Unidade não pode ser alterada
                  </p>
                )}
              </div>

              <div>
                <label className="label">Referência Local</label>
                <input
                  type="text"
                  value={referenciaLocal}
                  onChange={(e) => setReferenciaLocal(e.target.value)}
                  className="input-field"
                  placeholder="Ex: REF-LOCAL-123"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Código/referência usada pela unidade para este produto
                </p>
              </div>

              {erro && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{erro}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editando ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
