'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/store'
import { Loader2, AlertCircle } from 'lucide-react'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, cargo } = useUserStore()  // ← MUDOU: era nivelHierarquico
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const checkAdmin = () => {
      // Verificar se o usuário está logado
      if (!user) {
        router.push('/')
        return
      }

      // ========================================
      // CORRIGIDO: Verificar nivel_acesso do cargo
      // ========================================
      // Nivel de acesso >= 80 = Admin
      if (!cargo || cargo.nivel_acesso < 80) {
        setErro('Você não tem permissão para acessar o painel administrativo.')
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
        return
      }

      setLoading(false)
    }

    checkAdmin()
  }, [user, cargo, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 mb-4">{erro}</p>
          <p className="text-sm text-gray-500">
            Redirecionando para o dashboard...
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
