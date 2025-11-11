import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos TypeScript atualizados
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
  created_at: string
}

export interface Conglomerado {
  id: string
  nome: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Grupo {
  id: string
  conglomerado_id: string
  nome: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Marca {
  id: string
  nome: string
  categoria: string
  created_at: string
}

export interface Unidade {
  id: string
  grupo_id: string
  nome: string
  cnpj: string
  ativo: boolean
  marca_id: string | null
  created_at: string
  updated_at: string
}

export interface Equipe {
  id: string
  unidade_id: string
  nome: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Produto {
  id: string
  referencia: string
  nome: string
  nome_sintetico: string
  numero: string
  imagem: string | null
  ativo: boolean
  created_at: string
}

export interface ProdutoUnidade {
  id: number
  produto_id: string
  unidade_id: string
  referencia_local: string | null
  created_at: string
}

export interface Venda {
  id: string
  usuario_id: string
  unidade_id: string
  data_venda: string
  numero_identificacao: string
  valor_total: number
  observacoes: string | null
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
  created_at: string
}

// Tipos combinados para queries
export interface ProdutoComUnidade extends Produto {
  produtos_unidades?: ProdutoUnidade[]
}

export interface VendaComDetalhes extends Venda {
  itens?: VendaItem[]
  unidade?: Unidade
  usuario?: Usuario
}
