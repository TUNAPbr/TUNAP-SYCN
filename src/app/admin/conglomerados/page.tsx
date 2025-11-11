'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/admin/DataTable'
import { X, AlertCircle } from 'lucide-react'

export default function ConglomeradosPage() {
  const [conglomerados, setConglomerados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [erro, setErro] = useState('')

  // Form states
  const [nome, setNome] = useState('')
  const [ativo, setAtivo] = useState(true)

  useEffect(() => {
    loadConglomerados()
  }, [])

  const loadConglomerados = async () => {
    try {
      const { data, error } = await supabase
        .from('conglomerados')
        .select('*')
        .order('nome')

      if (error) throw error
      setConglomerados(data || [])
    } catch (error: any) {
      console.error('Erro:', error)
      setErro(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditando(null)
    setNome('')
    setAtivo(true)
    setErro('')
    setShowModal(true)
  }

  const handleEdit = (row: any) => {
    setEditando(row)
    setNome(row.nome)
    setAtivo(row.ativo)
    setErro('')
    setShowModal(true)
  }

  const handleDelete = async (row: any) => {
    if (!confirm(`Deseja realmente excluir "${row.nome}"?`)) return

    try {
      const { error } = await supabase
        .from('conglomerados')
        .delete()
        .eq('id', row.id)

      if (error) throw error

      await loadConglomerados()
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    try {
      if (editando) {
        // Atualizar
        const { error } = await supabase
          .from('conglomerados')
          .update({ nome, ativo })
          .eq('id', editando.id)

        if (error) throw error
      } else {
        // Criar
        const { error } = await supabase
          .from('conglomerados')
          .insert({ nome, ativo })

        if (error) throw error
      }

      setShowModal(false)
      await loadConglomerados()
    } catch (error: any) {
      setErro(error.message)
    }
  }

  const columns = [
    {
      key: 'nome',
      label: 'Nome',
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
    {
      key: 'created_at',
      label: 'Criado em',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR'),
    },
  ]

  return (
    <>
      <DataTable
        title="Conglomerados"
        columns={columns}
        data={conglomerados}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar conglomerado..."
        loading={loading}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editando ? 'Editar' : 'Novo'} Conglomerado
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
                <label className="label">Nome *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="input-field"
                  required
                  placeholder="Ex: Grupo Automotivo XYZ"
                />
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
