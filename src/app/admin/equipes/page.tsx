'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/admin/DataTable'
import { X, AlertCircle } from 'lucide-react'

export default function EquipesPage() {
  const [equipes, setEquipes] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [erro, setErro] = useState('')

  // Form states
  const [nome, setNome] = useState('')
  const [unidadeId, setUnidadeId] = useState('')
  const [ativo, setAtivo] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [equipesRes, unidadesRes] = await Promise.all([
        supabase
          .from('equipes')
          .select(`
            *,
            unidades (nome, grupos (nome))
          `)
          .order('nome'),
        supabase
          .from('unidades')
          .select('*, grupos (nome)')
          .eq('ativo', true)
          .order('nome')
      ])

      if (equipesRes.error) throw equipesRes.error
      if (unidadesRes.error) throw unidadesRes.error

      setEquipes(equipesRes.data || [])
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
    setNome('')
    setUnidadeId('')
    setAtivo(true)
    setErro('')
    setShowModal(true)
  }

  const handleEdit = (row: any) => {
    setEditando(row)
    setNome(row.nome)
    setUnidadeId(row.unidade_id)
    setAtivo(row.ativo)
    setErro('')
    setShowModal(true)
  }

  const handleDelete = async (row: any) => {
    if (!confirm(`Deseja realmente excluir "${row.nome}"?`)) return

    try {
      const { error } = await supabase
        .from('equipes')
        .delete()
        .eq('id', row.id)

      if (error) throw error

      await loadData()
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
          .from('equipes')
          .update({ nome, unidade_id: unidadeId, ativo })
          .eq('id', editando.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('equipes')
          .insert({ nome, unidade_id: unidadeId, ativo })

        if (error) throw error
      }

      setShowModal(false)
      await loadData()
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
      key: 'unidades',
      label: 'Unidade',
      render: (value: any) => value?.nome || '-',
    },
    {
      key: 'grupos',
      label: 'Grupo',
      render: (_: any, row: any) => row.unidades?.grupos?.nome || '-',
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
        title="Equipes"
        columns={columns}
        data={equipes}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar equipe..."
        loading={loading}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editando ? 'Editar' : 'Nova'} Equipe
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
                  placeholder="Ex: Equipe Agendamento A"
                />
              </div>

              <div>
                <label className="label">Unidade *</label>
                <select
                  value={unidadeId}
                  onChange={(e) => setUnidadeId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecione...</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} - {u.grupos?.nome}
                    </option>
                  ))}
                </select>
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
