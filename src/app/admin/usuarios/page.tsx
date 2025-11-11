'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/admin/DataTable'
import { X, AlertCircle, Key, CheckCircle } from 'lucide-react'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [niveisHierarquicos, setNiveisHierarquicos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [usuarioReset, setUsuarioReset] = useState<any>(null)
  const [editando, setEditando] = useState<any>(null)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  // Form states
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nivelHierarquicoId, setNivelHierarquicoId] = useState('')
  const [tipoEmpresa, setTipoEmpresa] = useState<'CLIENTE' | 'TUNAP'>('CLIENTE')
  const [ativo, setAtivo] = useState(true)

  // Reset senha states
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usuariosRes, niveisRes] = await Promise.all([
        supabase
          .from('usuarios')
          .select(`
            *,
            niveis_hierarquicos (nome, label)
          `)
          .order('nome_completo'),
        supabase
          .from('niveis_hierarquicos')
          .select('*')
          .order('nivel_acesso', { ascending: false })
      ])

      if (usuariosRes.error) throw usuariosRes.error
      if (niveisRes.error) throw niveisRes.error

      setUsuarios(usuariosRes.data || [])
      setNiveisHierarquicos(niveisRes.data || [])
    } catch (error: any) {
      console.error('Erro:', error)
      setErro(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditando(null)
    setNomeCompleto('')
    setEmail('')
    setSenha('')
    setNivelHierarquicoId('')
    setTipoEmpresa('CLIENTE')
    setAtivo(true)
    setErro('')
    setSucesso('')
    setShowModal(true)
  }

  const handleEdit = (row: any) => {
    setEditando(row)
    setNomeCompleto(row.nome_completo)
    setEmail(row.email)
    setSenha('') // Não mostrar senha
    setNivelHierarquicoId(row.nivel_hierarquico_id)
    setTipoEmpresa(row.tipo_empresa)
    setAtivo(row.ativo)
    setErro('')
    setSucesso('')
    setShowModal(true)
  }

  const handleDelete = async (row: any) => {
    if (!confirm(`Deseja realmente excluir "${row.nome_completo}"?`)) return

    try {
      // Desativar ao invés de excluir
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: false })
        .eq('id', row.id)

      if (error) throw error

      await loadData()
    } catch (error: any) {
      alert('Erro ao desativar: ' + error.message)
    }
  }

  const handleResetPassword = (row: any) => {
    setUsuarioReset(row)
    setNovaSenha('')
    setConfirmaSenha('')
    setErro('')
    setSucesso('')
    setShowResetModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setSucesso('')

    try {
      if (editando) {
        // Atualizar usuário
        const { error } = await supabase
          .from('usuarios')
          .update({
            nome_completo: nomeCompleto,
            email,
            nivel_hierarquico_id: nivelHierarquicoId,
            tipo_empresa: tipoEmpresa,
            ativo,
          })
          .eq('id', editando.id)

        if (error) throw error

        // Se mudou a senha, atualizar no auth
        if (senha) {
          const { error: authError } = await supabase.auth.admin.updateUserById(
            editando.id,
            { password: senha }
          )
          if (authError) throw authError
        }
      } else {
        // Criar novo usuário
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: senha,
          email_confirm: true,
        })

        if (authError) throw authError

        // Criar registro do usuário
        const { error: userError } = await supabase
          .from('usuarios')
          .insert({
            id: authData.user.id,
            nome_completo: nomeCompleto,
            email,
            nivel_hierarquico_id: nivelHierarquicoId,
            tipo_empresa: tipoEmpresa,
            ativo,
          })

        if (userError) throw userError
      }

      setShowModal(false)
      setSucesso('Usuário salvo com sucesso!')
      await loadData()

      setTimeout(() => setSucesso(''), 3000)
    } catch (error: any) {
      setErro(error.message)
    }
  }

  const handleSubmitReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setSucesso('')

    if (novaSenha !== confirmaSenha) {
      setErro('As senhas não coincidem')
      return
    }

    if (novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres')
      return
    }

    try {
      const { error } = await supabase.auth.admin.updateUserById(
        usuarioReset.id,
        { password: novaSenha }
      )

      if (error) throw error

      setShowResetModal(false)
      setSucesso(`Senha de ${usuarioReset.nome_completo} resetada com sucesso!`)
      setTimeout(() => setSucesso(''), 5000)
    } catch (error: any) {
      setErro(error.message)
    }
  }

  const columns = [
    {
      key: 'nome_completo',
      label: 'Nome',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'niveis_hierarquicos',
      label: 'Nível',
      render: (value: any) => value?.label || '-',
    },
    {
      key: 'tipo_empresa',
      label: 'Tipo',
      render: (value: string) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
          {value}
        </span>
      ),
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
      {sucesso && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span>{sucesso}</span>
        </div>
      )}

      <DataTable
        title="Usuários"
        columns={columns}
        data={usuarios}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar usuário..."
        loading={loading}
        customActions={(row) => (
          <button
            onClick={() => handleResetPassword(row)}
            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Resetar senha"
          >
            <Key className="w-4 h-4" />
          </button>
        )}
      />

      {/* Modal Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editando ? 'Editar' : 'Novo'} Usuário
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
                <label className="label">Nome Completo *</label>
                <input
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className="input-field"
                  required
                  placeholder="João da Silva"
                />
              </div>

              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                  placeholder="joao@empresa.com"
                  disabled={!!editando}
                />
              </div>

              <div>
                <label className="label">
                  Senha {editando ? '(deixe em branco para manter)' : '*'}
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="input-field"
                  required={!editando}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div>
                <label className="label">Nível Hierárquico *</label>
                <select
                  value={nivelHierarquicoId}
                  onChange={(e) => setNivelHierarquicoId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecione...</option>
                  {niveisHierarquicos.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} (Nível {n.nivel_acesso})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Tipo de Empresa *</label>
                <select
                  value={tipoEmpresa}
                  onChange={(e) => setTipoEmpresa(e.target.value as any)}
                  className="input-field"
                  required
                >
                  <option value="CLIENTE">Cliente</option>
                  <option value="TUNAP">TUNAP</option>
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

      {/* Modal Reset Senha */}
      {showResetModal && usuarioReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Resetar Senha
              </h2>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Usuário:</strong> {usuarioReset.nome_completo}
                <br />
                <strong>Email:</strong> {usuarioReset.email}
              </p>
            </div>

            <form onSubmit={handleSubmitReset} className="space-y-4">
              <div>
                <label className="label">Nova Senha *</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="input-field"
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <div>
                <label className="label">Confirmar Senha *</label>
                <input
                  type="password"
                  value={confirmaSenha}
                  onChange={(e) => setConfirmaSenha(e.target.value)}
                  className="input-field"
                  required
                  placeholder="••••••••"
                  minLength={6}
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
                  onClick={() => setShowResetModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Key className="w-4 h-4" />
                  Resetar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
