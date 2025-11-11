'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })

      if (authError) throw authError

      if (authData.user) {
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select(`
            *,
            niveis_hierarquicos (*)
          `)
          .eq('id', authData.user.id)
          .single()

        if (userError) throw userError

        if (!userData || !userData.ativo) {
          throw new Error('Usuário inativo ou não encontrado')
        }

        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Erro no login:', error)
      setErro(error.message || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4">
      <div className="max-w-md w-full">
        <div className="card">
          {/* Logo e Título */}
          <div className="text-center mb-8">
            {/* Logo TUNAP */}
            <div className="mb-6 flex justify-center">
              <div className="w-32 h-32 bg-primary-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-5xl font-bold">T</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900">TUNAP Sync</h1>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label htmlFor="senha" className="label">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Mensagem de Erro */}
            {erro && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {/* Botão Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Link recuperar senha */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Esqueceu a senha? Entre em contato com o administrador
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
