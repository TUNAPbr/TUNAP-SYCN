'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/admin/DataTable'
import { X, AlertCircle } from 'lucide-react'

export default function MarcasPage() {
  const [marcas, setMarcas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [erro, setErro] = useState('')

  // Form states
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('')

  useEffect(() => {
    loadMarcas()
  }, [])

  const loadMarcas = async () => {
    try {
      const { data, error } = await supabase
        .from('marcas')
        .select('*')
        .order('nome')

      if (error) throw error
      setMarcas(data || [])
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
    setCategoria('')
    setErro('')
    setShowModal(true)
  }

  const handleEdit = (row: any) => {
    setEditando(row)
    setNome(row.nome)
    setCategoria(row.categoria)
    setErro('')
    setShowModal(true)
  }

  const handleDelete = async (row: any) => {
    if (!confirm(`Deseja realmente excluir "${row.nome}"?`)) return

    try {
      const { error } = await supabase
        .from('marcas')
        .delete()
        .eq('id', row.id)

      if (error) throw error

      await loadMarcas()
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    try {
      if (editando) {
        const { error } = await supabase
          .from('marcas')
          .update({ nome, categoria })
          .eq('id', editando.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('marcas')
          .insert({ nome, categoria })

        if (error) throw error
      }

      setShowModal(false)
      await loadMarcas()
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
      key: 'categoria',
      label: 'Categoria',
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
        title="Marcas"
        columns={columns}
        data={marcas}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar marca..."
        loading={loading}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editando ? 'Editar' : 'Nova'} Marca
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
                  placeholder="Ex: Toyota, Honda, Fiat"
                />
              </div>

              <div>
                <label className="label">Categoria *</label>
                <input
                  type="text"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="input-field"
                  required
                  placeholder="Ex: Automóveis, Caminhões, Motos"
                />
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
