'use client'

import { useState } from 'react'
import { X, AlertCircle, Key } from 'lucide-react'

interface ResetSenhaModalProps {
  usuario: {
    id: string
    nome_completo: string
    email: string
  }
  onClose: () => void
  onSuccess: () => void
}

export default function ResetSenhaModal({ usuario, onClose, onSuccess }: ResetSenhaModalProps) {
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    if (novaSenha !== confirmaSenha) {
      setErro('As senhas não coincidem')
      return
    }

    if (novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setSalvando(true)

    try {
      const response = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: usuario.id,
          password: novaSenha,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao resetar senha')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Erro:', error)
      setErro(error.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Resetar Senha</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={salvando}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Usuário:</strong> {usuario.nome_completo}
            <br />
            <strong>Email:</strong> {usuario.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nova Senha *</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="input-field"
              required
              disabled={salvando}
              placeholder="••••••••"
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
          </div>

          <div>
            <label className="label">Confirmar Senha *</label>
            <input
              type="password"
              value={confirmaSenha}
              onChange={(e) => setConfirmaSenha(e.target.value)}
              className="input-field"
              required
              disabled={salvando}
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
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={salvando}
            >
              <Key className="w-4 h-4" />
              {salvando ? 'Resetando...' : 'Resetar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
