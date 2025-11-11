'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/admin/DataTable'
import { X, AlertCircle, Image as ImageIcon } from 'lucide-react'

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [erro, setErro] = useState('')

  // Form states
  const [referencia, setReferencia] = useState('')
  const [nome, setNome] = useState('')
  const [nomeSintetico, setNomeSintetico] = useState('')
  const [numero, setNumero] = useState('')
  const [imagem, setImagem] = useState('')
  const [ativo, setAtivo] = useState(true)

  useEffect(() => {
    loadProdutos()
  }, [])

  const loadProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('referencia')

      if (error) throw error
      setProdutos(data || [])
    } catch (error: any) {
      console.error('Erro:', error)
      setErro(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditando(null)
    setReferencia('')
    setNome('')
    setNomeSintetico('')
    setNumero('')
    setImagem('')
    setAtivo(true)
    setErro('')
    setShowModal(true)
  }

  const handleEdit = (row: any) => {
    setEditando(row)
    setReferencia(row.referencia)
    setNome(row.nome)
    setNomeSintetico(row.nome_sintetico)
    setNumero(row.numero)
    setImagem(row.imagem || '')
    setAtivo(row.ativo)
    setErro('')
    setShowModal(true)
  }

  const handleDelete = async (row: any) => {
    if (!confirm(`Deseja realmente excluir "${row.nome_sintetico}"?`)) return

    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', row.id)

      if (error) throw error

      await loadProdutos()
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    try {
      const produtoData = {
        referencia,
        nome,
        nome_sintetico: nomeSintetico,
        numero,
        imagem: imagem || null,
        ativo,
      }

      if (editando) {
        const { error } = await supabase
          .from('produtos')
          .update(produtoData)
          .eq('id', editando.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert(produtoData)

        if (error) throw error
      }

      setShowModal(false)
      await loadProdutos()
    } catch (error: any) {
      setErro(error.message)
    }
  }

  const columns = [
    {
      key: 'imagem',
      label: 'Imagem',
      render: (value: string | null) => (
        value ? (
          <img 
            src={value} 
            alt="Produto" 
            className="w-12 h-12 object-cover rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E'
            }}
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-gray-400" />
          </div>
        )
      ),
    },
    {
      key: 'referencia',
      label: 'Referência',
    },
    {
      key: 'nome_sintetico',
      label: 'Nome',
    },
    {
      key: 'numero',
      label: 'Número',
    },
    {
      key: 'ativo',
      label: 'Status',
      render: (value: boolean) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {value ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ]

  return (
    <>
      <DataTable
        title="Produtos TUNAP"
        columns={columns}
        data={produtos}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar produto..."
        loading={loading}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editando ? 'Editar' : 'Novo'} Produto TUNAP
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Referência *</label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    className="input-field"
                    required
                    placeholder="Ex: TUN-001"
                  />
                </div>

                <div>
                  <label className="label">Número *</label>
                  <input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="input-field"
                    required
                    placeholder="Ex: 12345"
                  />
                </div>
              </div>

              <div>
                <label className="label">Nome Completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="input-field"
                  required
                  placeholder="Ex: Aditivo para Motor Diesel"
                />
              </div>

              <div>
                <label className="label">Nome Sintético *</label>
                <input
                  type="text"
                  value={nomeSintetico}
                  onChange={(e) => setNomeSintetico(e.target.value)}
                  className="input-field"
                  required
                  placeholder="Ex: Aditivo Diesel"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nome resumido para exibição
                </p>
              </div>

              <div>
                <label className="label">URL da Imagem</label>
                <input
                  type="url"
                  value={imagem}
                  onChange={(e) => setImagem(e.target.value)}
                  className="input-field"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
                {imagem && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-2">Preview:</p>
                    <img 
                      src={imagem} 
                      alt="Preview" 
                      className="w-24 h-24 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="ativo" className="text-sm text-gray-700">
                  Ativo
                </label>
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
