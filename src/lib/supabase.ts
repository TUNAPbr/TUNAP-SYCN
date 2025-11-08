import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos TypeScript para o banco de dados
export type TipoEmpresa = 'CLIENTE' | 'TUNAP'

export interface Usuario {
  id: string
  nome_completo: string
  email: string
  tipo_empresa: TipoEmpresa
  nivel_hierarquico_id: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface NivelHierarquico {
  id: string
  nome: string
  tipo_empresa: TipoEmpresa
  nivel_acesso: number
  label: string
}

export interface Conglomerado {
  id: string
  nome: string
  ativo: boolean
}

export interface Grupo {
  id: string
  conglomerado_id: string
  nome: string
  ativo: boolean
}

export interface Unidade {
  id: string
  grupo_id: string
  nome: string
  cnpj: string
  ativo: boolean
}

export interface Equipe {
  id: string
  unidade_id: string
  nome: string
  ativo: boolean
}

export interface Produto {
  id: string
  unidade_id: string
  nome: string
  codigo: string
  descricao?: string
  preco_base: number
  ativo: boolean
}

export interface Venda {
  id: string
  usuario_id: string
  unidade_id: string
  equipe_id: string
  data_venda: string
  numero_identificacao: string
  valor_total: number
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface VendaItem {
  id: string
  venda_id: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

export interface VendaComDetalhes extends Venda {
  itens?: VendaItem[]
  produtos?: Produto[]
  unidade?: Unidade
  equipe?: Equipe
}
