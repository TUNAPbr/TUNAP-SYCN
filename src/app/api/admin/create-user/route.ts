import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const body = await request.json()
    const { 
      email, 
      password, 
      nome_completo, 
      cargo_id,
      cargo_label,
      cargo_descricao,
      tipo_empresa, 
      ativo 
    } = body

    // Validar campos obrigatórios
    if (!email || !password || !nome_completo || !cargo_id || !tipo_empresa) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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
    const { error: dbError } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        nome_completo,
        email,
        cargo_id,
        cargo_label: cargo_label || null,
        cargo_descricao: cargo_descricao || null,
        tipo_empresa,
        ativo,
      })

    if (dbError) {
      console.error('Erro ao criar registro no banco:', dbError)
      
      // Tentar deletar usuário do Auth se falhou no DB
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { error: dbError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true,
      user: authData.user 
    })
  } catch (error: any) {
    console.error('Erro geral:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}
