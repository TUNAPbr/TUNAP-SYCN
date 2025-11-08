'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/lib/store'
import { Loader2 } from 'lucide-react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const { setUser, setNivelHierarquico, setEquipes } = useUserStore()

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Verificar se há sessão ativa
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/')
          return
        }

        // Buscar dados do usuário
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select(`
            *,
            niveis_hierarquicos (*)
          `)
          .eq('id', session.user.id)
          .single()

        if (userError || !userData || !userData.ativo) {
          await supabase.auth.signOut()
          router.push('/')
          return
        }

        setUser(userData)
        setNivelHierarquico(userData.niveis_hierarquicos)

        // Buscar equipes do usuário
        const { data: equipesData } = await supabase
          .from('usuario_equipes')
          .select('equipes (*)')
          .eq('usuario_id', session.user.id)

        if (equipesData) {
          const equipes = equipesData.map((ue: any) => ue.equipes)
          setEquipes(equipes)
        }

      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, setUser, setNivelHierarquico, setEquipes])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
