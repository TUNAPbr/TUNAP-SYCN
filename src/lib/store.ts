import { create } from 'zustand'

// ========================================
// TIPOS ATUALIZADOS
// ========================================

export interface Usuario {
  id: string
  nome_completo: string
  email: string
  cargo_id: string
  cargo_label: string | null
  cargo_descricao: string | null
  tipo_empresa: 'CLIENTE' | 'TUNAP'
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Cargo {
  id: string
  nome: string
  escopo: 'proprio' | 'equipe' | 'unidade' | 'grupo' | 'conglomerado' | 'todos'
  nivel_acesso: number
  categoria: string
  cor: string
}

export interface Equipe {
  id: string
  nome: string
  unidade_id: string
  tipo_equipe_id: string | null
  ativo: boolean
}

// ========================================
// STORE
// ========================================

interface UserStore {
  user: Usuario | null
  cargo: Cargo | null  // ← MUDOU: era nivelHierarquico
  equipes: Equipe[]
  setUser: (user: Usuario | null) => void
  setCargo: (cargo: Cargo | null) => void  // ← MUDOU: era setNivelHierarquico
  setEquipes: (equipes: Equipe[]) => void
  logout: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  cargo: null,
  equipes: [],
  setUser: (user) => set({ user }),
  setCargo: (cargo) => set({ cargo }),
  setEquipes: (equipes) => set({ equipes }),
  logout: () => set({ user: null, cargo: null, equipes: [] }),
}))
