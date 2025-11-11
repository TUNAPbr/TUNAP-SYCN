import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Cliente Admin do Supabase (usa Service Role Key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, nome_completo, nivel_hierarquico_id, tipo_empresa, ativo } = body

    // Validações
    if (!email || !password || !nome_completo || !nivel_hierarquico_id || !tipo_empresa) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // 2. Criar registro na tabela usuarios
    const { error: userError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: authData.user.id,
        nome_completo,
        email,
        nivel_hierarquico_id,
        tipo_empresa,
        ativo: ativo !== undefined ? ativo : true,
      })

    if (userError) {
      console.error('Erro ao criar registro de usuário:', userError)
      
      // Tentar deletar o usuário do Auth se falhou criar na tabela
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { error: userError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, user: authData.user },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erro na criação de usuário:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
