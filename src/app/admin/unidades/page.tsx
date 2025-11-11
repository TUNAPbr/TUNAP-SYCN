'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/admin/DataTable'
import { X, AlertCircle } from 'lucide-react'

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<any[]>([])
  const [grupos, setGrupos] = useState<any[]>([])
  const [marcas, setMarcas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [erro, setErro] = useState('')

  // Form states
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [marcaId, setMarcaId] = useState('')
  const [ativo, setAtivo] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [unidadesRes, gruposRes, marcasRes] = await Promise.all([
        supabase
          .from('unidades')
          .select(`
            *,
            grupos (nome, conglomerados (nome)),
            marcas (nome)
          `)
          .order('nome'),
        supabase
          .from('grupos')
          .select('*, conglomerados (nome)')
          .eq('ativo', true)
          .order('nome'),
        supabase
          .from('marcas')
          .select('*')
          .order('nome')
      ])

      if (unidadesRes.error) throw unidadesRes.error
      if (gruposRes.error) throw gruposRes.error
      if (marcasRes.error) throw marcasRes.error

      setUnidades(unidadesRes.data || [])
      setGrupos(gruposRes.data || [])
      setMarcas(marcasRes.data || [])
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
    setCnpj('')
    setGrupoId('')
    setMarcaId('')
    setAtivo(true)
    setErro('')
    setShowModal(true)
  }

  const handleEdit = (row: any) => {
    setEditando(row)
    setNome(row.nome)
    setCnpj(row.cnpj)
    setGrupoId(row.grupo_id)
    setMarcaId(row.marca_id || '')
    setAtivo(row.ativo)
    setErro('')
    setShowModal(true)
  }

  const handleDelete = async (row: any) => {
    if (!confirm(`Deseja realmente excluir "${row.nome}"?`)) return

    try {
      const { error } = await supabase
        .from('unidades')
        .delete()
        .eq('id', row.id)

      if (error) throw error

      await loadData()
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    try {
      const data = {
        nome,
        cnpj: cnpj.replace(/\D/g, ''),
        grupo_id: grupoId,
        marca_id: marcaId || null,
        ativo
      }

      if (editando) {
        const { error } = await supabase
          .from('unidades')
          .update(data)
          .eq('id', editando.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('unidades')
          .insert(data)

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
      key: 'cnpj',
      label: 'CNPJ',
      render: (value: string) => formatCNPJ(value),
    },
    {
      key: 'grupos',
      label: 'Grupo',
      render: (value: any) => value?.nome || '-',
    },
    {
      key: 'marcas',
      label: 'Marca',
      render: (value: any) => value?.nome || '-',
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
        title="Unidades"
        columns={columns}
        data={unidades}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar unidade..."
        loading={loading}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editando ? 'Editar' : 'Nova'} Unidade
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
                  placeholder="Ex: Loja Centro"
                />
              </div>

              <div>
                <label className="label">CNPJ *</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  className="input-field"
                  required
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="label">Grupo *</label>
                <select
                  value={grupoId}
                  onChange={(e) => setGrupoId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecione...</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome} - {g.conglomerados?.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Marca</label>
                <select
                  value={marcaId}
                  onChange={(e) => setMarcaId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Nenhuma</option>
                  {marcas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
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
