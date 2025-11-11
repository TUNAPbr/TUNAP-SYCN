'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/admin/DataTable'
import { X, AlertCircle, CheckCircle, UserPlus } from 'lucide-react'

export default function UsuariosEquipesPage() {
  const [vinculos, setVinculos] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [equipes, setEquipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  // Form states
  const [usuarioId, setUsuarioId] = useState('')
  const [equipesSelecionadas, setEquipesSelecionadas] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [vinculosRes, usuariosRes, equipesRes] = await Promise.all([
        supabase
          .from('usuario_equipes')
          .select(`
            *,
            usuarios (nome_completo, email),
            equipes (nome, unidades (nome))
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('usuarios')
          .select('*')
          .eq('ativo', true)
          .order('nome_completo'),
        supabase
          .from('equipes')
          .select('*, unidades (nome)')
          .eq('ativo', true)
          .order('nome')
      ])

      if (vinculosRes.error) throw vinculosRes.error
      if (usuariosRes.error) throw usuariosRes.error
      if (equipesRes.error) throw equipesRes.error

      setVinculos(vinculosRes.data || [])
      setUsuarios(usuariosRes.data || [])
      setEquipes(equipesRes.data || [])
    } catch (error: any) {
      console.error('Erro:', error)
      setErro(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setUsuarioId('')
    setEquipesSelecionadas([])
    setErro('')
    setSucesso('')
    setShowModal(true)
  }

  const handleDelete = async (row: any) => {
    if (!confirm('Deseja realmente remover este vínculo?')) return

    try {
      const { error } = await supabase
        .from('usuario_equipes')
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

    if (equipesSelecionadas.length === 0) {
      setErro('Selecione pelo menos uma equipe')
      return
    }

    try {
      // Verificar quais vínculos já existem
      const { data: existentes } = await supabase
        .from('usuario_equipes')
        .select('equipe_id')
        .eq('usuario_id', usuarioId)

      const equipesExistentes = existentes?.map(e => e.equipe_id) || []
      
      // Filtrar apenas as novas
      const novasEquipes = equipesSelecionadas.filter(
        equipeId => !equipesExistentes.includes(equipeId)
      )

      if (novasEquipes.length === 0) {
        setErro('Usuário já está em todas as equipes selecionadas!')
        return
      }

      // Criar vínculos
      const vinculos = novasEquipes.map(equipeId => ({
        usuario_id: usuarioId,
        equipe_id: equipeId,
      }))

      const { error } = await supabase
        .from('usuario_equipes')
        .insert(vinculos)

      if (error) throw error

      const msg = novasEquipes.length === 1 
        ? 'Usuário adicionado à equipe com sucesso!'
        : `Usuário adicionado a ${novasEquipes.length} equipes com sucesso!`
      
      setSucesso(msg)
      setShowModal(false)
      await loadData()
      setTimeout(() => setSucesso(''), 3000)
    } catch (error: any) {
      setErro(error.message)
    }
  }

  const toggleEquipe = (equipeId: string) => {
    setEquipesSelecionadas(prev => 
      prev.includes(equipeId)
        ? prev.filter(id => id !== equipeId)
        : [...prev, equipeId]
    )
  }

  // Agrupar vínculos por usuário para exibição
  const vinculosAgrupados = vinculos.reduce((acc: any, vinculo) => {
    const userId = vinculo.usuario_id
    if (!acc[userId]) {
      acc[userId] = {
        usuario: vinculo.usuarios,
        equipes: [],
        vinculos: [],
      }
    }
    acc[userId].equipes.push(vinculo.equipes)
    acc[userId].vinculos.push(vinculo)
    return acc
  }, {})

  const dadosTabela = Object.values(vinculosAgrupados).map((item: any) => ({
    usuario: item.usuario,
    equipes: item.equipes,
    vinculos: item.vinculos,
  }))

  const columns = [
    {
      key: 'usuario',
      label: 'Usuário',
      render: (value: any) => (
        <div>
          <p className="font-medium text-gray-900">
            {value?.nome_completo || '-'}
          </p>
          <p className="text-xs text-gray-500">
            {value?.email || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'equipes',
      label: 'Equipes',
      render: (value: any[]) => (
        <div className="flex flex-wrap gap-1">
          {value.map((equipe, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium"
            >
              {equipe?.nome || '-'}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'vinculos',
      label: 'Unidades',
      render: (value: any[]) => (
        <div className="text-sm text-gray-600">
          {Array.from(new Set(value.map(v => v.equipes?.unidades?.nome))).join(', ')}
        </div>
      ),
    },
  ]

  // Custom actions para remover vínculos individuais
  const customActions = (row: any) => {
    return (
      <div className="flex flex-col gap-1">
        {row.vinculos.map((vinculo: any) => (
          <button
            key={vinculo.id}
            onClick={() => handleDelete(vinculo)}
            className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-left"
            title={`Remover de ${vinculo.equipes?.nome}`}
          >
            Remover de {vinculo.equipes?.nome}
          </button>
        ))}
      </div>
    )
  }

  return (
    <>
      {sucesso && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span>{sucesso}</span>
        </div>
      )}

      <DataTable
        title="Usuários x Equipes"
        columns={columns}
        data={dadosTabela}
        onAdd={handleAdd}
        searchPlaceholder="Buscar por usuário..."
        loading={loading}
        customActions={customActions}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Adicionar Usuário às Equipes
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Usuário *</label>
                <select
                  value={usuarioId}
                  onChange={(e) => setUsuarioId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecione um usuário...</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome_completo} - {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Equipes * (selecione uma ou mais)</label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                  {equipes.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhuma equipe disponível
                    </p>
                  ) : (
                    equipes.map((equipe) => (
                      <label
                        key={equipe.id}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                          ${equipesSelecionadas.includes(equipe.id)
                            ? 'bg-primary-50 border-2 border-primary-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={equipesSelecionadas.includes(equipe.id)}
                          onChange={() => toggleEquipe(equipe.id)}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {equipe.nome}
                          </p>
                          <p className="text-xs text-gray-600">
                            Unidade: {equipe.unidades?.nome || 'N/A'}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {equipesSelecionadas.length} equipe(s) selecionada(s)
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
                <button 
                  type="submit" 
                  className="btn-primary flex-1"
                  disabled={equipesSelecionadas.length === 0}
                >
                  Adicionar às Equipes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
