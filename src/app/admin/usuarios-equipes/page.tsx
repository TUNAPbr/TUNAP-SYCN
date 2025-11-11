'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { SearchableSelect } from '@/components/SearchableSelect'
import { Plus, Search, X, AlertCircle, CheckCircle, UserPlus } from 'lucide-react'

export default function UsuariosEquipesPage() {
  const [vinculos, setVinculos] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [equipes, setEquipes] = useState<any[]>([])
  const [conglomerados, setConglomerados] = useState<any[]>([])
  const [grupos, setGrupos] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [search, setSearch] = useState('')

  // Form states
  const [usuarioId, setUsuarioId] = useState('')
  const [equipesSelecionadas, setEquipesSelecionadas] = useState<string[]>([])

  // Filtros
  const [filtroConglomerado, setFiltroConglomerado] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [filtroUnidade, setFiltroUnidade] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [vinculosRes, usuariosRes, equipesRes, conglomeradosRes, gruposRes, unidadesRes] = await Promise.all([
        supabase
          .from('usuario_equipes')
          .select(`
            *,
            usuarios (nome_completo, email),
            equipes (
              nome,
              unidades (
                nome,
                grupos (
                  nome,
                  conglomerados (nome)
                ),
                marcas (nome)
              )
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('usuarios')
          .select('*')
          .eq('ativo', true)
          .order('nome_completo'),
        supabase
          .from('equipes')
          .select(`
            *,
            unidades (
              nome,
              grupos (
                nome,
                conglomerados (nome)
              ),
              marcas (nome)
            )
          `)
          .eq('ativo', true)
          .order('nome'),
        supabase
          .from('conglomerados')
          .select('*')
          .eq('ativo', true)
          .order('nome'),
        supabase
          .from('grupos')
          .select('*, conglomerados (nome)')
          .eq('ativo', true)
          .order('nome'),
        supabase
          .from('unidades')
          .select('*, grupos (nome)')
          .eq('ativo', true)
          .order('nome')
      ])

      if (vinculosRes.error) throw vinculosRes.error
      if (usuariosRes.error) throw usuariosRes.error
      if (equipesRes.error) throw equipesRes.error

      setVinculos(vinculosRes.data || [])
      setUsuarios(usuariosRes.data || [])
      setEquipes(equipesRes.data || [])
      setConglomerados(conglomeradosRes.data || [])
      setGrupos(gruposRes.data || [])
      setUnidades(unidadesRes.data || [])
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
    setFiltroConglomerado('')
    setFiltroGrupo('')
    setFiltroUnidade('')
    setErro('')
    setSucesso('')
    setShowModal(true)
  }

  const handleRemoveVinculo = async (vinculo: any) => {
    const equipeNome = vinculo.equipes?.nome
    if (!confirm(`Deseja realmente remover o usuário da equipe "${equipeNome}"?`)) return

    try {
      const { error } = await supabase
        .from('usuario_equipes')
        .delete()
        .eq('id', vinculo.id)

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
      const { data: existentes } = await supabase
        .from('usuario_equipes')
        .select('equipe_id')
        .eq('usuario_id', usuarioId)

      const equipesExistentes = existentes?.map(e => e.equipe_id) || []
      
      const novasEquipes = equipesSelecionadas.filter(
        equipeId => !equipesExistentes.includes(equipeId)
      )

      if (novasEquipes.length === 0) {
        setErro('Usuário já está em todas as equipes selecionadas!')
        return
      }

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

  // Agrupar vínculos por usuário
  const vinculosAgrupados = vinculos.reduce((acc: any, vinculo) => {
    const userId = vinculo.usuario_id
    if (!acc[userId]) {
      acc[userId] = {
        usuario: vinculo.usuarios,
        vinculos: [],
      }
    }
    acc[userId].vinculos.push(vinculo)
    return acc
  }, {})

  const dadosTabela = Object.values(vinculosAgrupados)
    .filter((item: any) => {
      if (!search) return true
      const usuario = item.usuario
      return (
        usuario?.nome_completo?.toLowerCase().includes(search.toLowerCase()) ||
        usuario?.email?.toLowerCase().includes(search.toLowerCase())
      )
    })

  // Options para SearchableSelect de usuários
  const usuariosOptions = usuarios.map(u => ({
    value: u.id,
    label: `${u.nome_completo} - ${u.email}`,
  }))

  // Filtrar equipes baseado nos filtros
  const equipesFiltradasModal = equipes.filter(equipe => {
    const unidade = equipe.unidades
    const grupo = unidade?.grupos
    const conglomerado = grupo?.conglomerados

    if (filtroConglomerado && conglomerado?.id !== filtroConglomerado) return false
    if (filtroGrupo && grupo?.id !== filtroGrupo) return false
    if (filtroUnidade && unidade?.id !== filtroUnidade) return false

    return true
  })

  return (
    <div className="space-y-4">
      {sucesso && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span>{sucesso}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuários x Equipes</h1>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
          placeholder="Buscar por usuário..."
        />
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Carregando...</p>
          </div>
        ) : dadosTabela.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhum registro encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase w-1/4">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Equipes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dadosTabela.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm align-top">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.usuario?.nome_completo || '-'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.usuario?.email || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {item.vinculos.map((vinculo: any) => {
                        const equipe = vinculo.equipes
                        const unidade = equipe?.unidades
                        const grupo = unidade?.grupos
                        const conglomerado = grupo?.conglomerados
                        const marca = unidade?.marcas

                        // Montar label: Grupo > Marca > Unidade > Equipe
                        const partes = []
                        if (grupo?.nome) partes.push(grupo.nome)
                        if (marca?.nome) partes.push(marca.nome)
                        if (unidade?.nome) partes.push(unidade.nome)
                        if (equipe?.nome) partes.push(equipe.nome)

                        const label = partes.join(' > ')

                        return (
                          <span
                            key={vinculo.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
                          >
                            <span>{label}</span>
                            <button
                              onClick={() => handleRemoveVinculo(vinculo)}
                              className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                              title="Remover vínculo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {!loading && dadosTabela.length > 0 && (
        <div className="text-sm text-gray-600">
          Mostrando {dadosTabela.length} usuário(s)
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 my-8">
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SearchableSelect para Usuário */}
              <SearchableSelect
                label="Usuário"
                options={usuariosOptions}
                value={usuarioId}
                onChange={setUsuarioId}
                placeholder="Buscar usuário..."
                required
              />

              {/* Filtros */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Filtros (opcionais)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Conglomerado</label>
                    <select
                      value={filtroConglomerado}
                      onChange={(e) => setFiltroConglomerado(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Todos</option>
                      {conglomerados.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Grupo</label>
                    <select
                      value={filtroGrupo}
                      onChange={(e) => setFiltroGrupo(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Todos</option>
                      {grupos.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.nome} {g.conglomerados?.nome && `(${g.conglomerados.nome})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Unidade</label>
                    <select
                      value={filtroUnidade}
                      onChange={(e) => setFiltroUnidade(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Todas</option>
                      {unidades.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nome} {u.grupos?.nome && `(${u.grupos.nome})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Equipes */}
              <div>
                <label className="label">Equipes * (selecione uma ou mais)</label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-80 overflow-y-auto space-y-2">
                  {equipesFiltradasModal.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhuma equipe encontrada com os filtros aplicados
                    </p>
                  ) : (
                    equipesFiltradasModal.map((equipe) => {
                      const unidade = equipe.unidades
                      const grupo = unidade?.grupos
                      const conglomerado = grupo?.conglomerados
                      const marca = unidade?.marcas

                      const partes = []
                      if (grupo?.nome) partes.push(grupo.nome)
                      if (marca?.nome) partes.push(marca.nome)
                      if (unidade?.nome) partes.push(unidade.nome)
                      if (equipe.nome) partes.push(equipe.nome)

                      const label = partes.join(' > ')

                      return (
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
                            <p className="font-medium text-gray-900 text-sm">
                              {label}
                            </p>
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {equipesSelecionadas.length} equipe(s) selecionada(s)
                  {equipesFiltradasModal.length > 0 && ` de ${equipesFiltradasModal.length} disponível(is)`}
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
    </div>
  )
}
