'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/admin/DataTable'
import { Key, CheckCircle } from 'lucide-react'
import FormularioUsuario from '@/components/admin/FormularioUsuario'
import ResetSenhaModal from '@/components/admin/ResetSenhaModal'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showResetModal, setShowResetModal] = useState(false)
  const [usuarioReset, setUsuarioReset] = useState<any>(null)
  const [sucesso, setSucesso] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<string | undefined>()

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_usuarios_completo')
        .select('*')
        .order('nome_completo')

      if (error) throw error
      setUsuarios(data || [])
    } catch (error: any) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNovoUsuario = () => {
    setUsuarioEditando(undefined)
    setMostrarForm(true)
  }

  const handleEditarUsuario = (row: any) => {
    setUsuarioEditando(row.id)
    setMostrarForm(true)
  }

  const handleDesativar = async (row: any) => {
    if (!confirm(`Deseja realmente desativar "${row.nome_completo}"?`)) return

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: false })
        .eq('id', row.id)

      if (error) throw error

      setSucesso('Usuário desativado com sucesso!')
      await loadUsuarios()
      setTimeout(() => setSucesso(''), 3000)
    } catch (error: any) {
      alert('Erro ao desativar: ' + error.message)
    }
  }

  const handleResetPassword = (row: any) => {
    setUsuarioReset(row)
    setShowResetModal(true)
  }

  const handleSuccess = () => {
    setMostrarForm(false)
    setSucesso('Operação realizada com sucesso!')
    loadUsuarios()
    setTimeout(() => setSucesso(''), 3000)
  }

  const columns = [
    { 
      key: 'nome_completo', 
      label: 'Nome' 
    },
    { 
      key: 'email', 
      label: 'Email' 
    },
    {
      key: 'cargo_exibicao',
      label: 'Função',
      render: (value: string, row: any) => (
        <div>
          <span className="font-medium text-gray-900">{value}</span>
          {row.cargo_exibicao !== row.cargo_nome && (
            <p className="text-xs text-gray-500">({row.cargo_nome})</p>
          )}
        </div>
      ),
    },
    {
      key: 'cargo_escopo',
      label: 'Nível',
      render: (value: string) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
          {value}
        </span>
      ),
    },
    {
      key: 'tipo_empresa',
      label: 'Tipo',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value === 'TUNAP'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
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

  // Se estiver mostrando o formulário
  if (mostrarForm) {
    return (
      <FormularioUsuario
        usuarioId={usuarioEditando}
        onSuccess={handleSuccess}
        onCancel={() => setMostrarForm(false)}
      />
    )
  }

  return (
    <>
      {/* Mensagem de Sucesso */}
      {sucesso && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 shadow-lg">
          <CheckCircle className="w-5 h-5" />
          <span>{sucesso}</span>
        </div>
      )}

      <DataTable
        title="Usuários"
        columns={columns}
        data={usuarios}
        onAdd={handleNovoUsuario}
        onEdit={handleEditarUsuario}
        onDelete={handleDesativar}
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

      {/* Modal Reset Senha */}
      {showResetModal && usuarioReset && (
        <ResetSenhaModal
          usuario={usuarioReset}
          onClose={() => setShowResetModal(false)}
          onSuccess={() => {
            setSucesso('Senha resetada com sucesso!')
            setShowResetModal(false)
            setTimeout(() => setSucesso(''), 3000)
          }}
        />
      )}
    </>
  )
}
