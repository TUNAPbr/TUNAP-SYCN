import { create } from 'zustand'
import { Usuario, NivelHierarquico, Equipe } from './supabase'

interface UserStore {
  user: Usuario | null
  nivelHierarquico: NivelHierarquico | null
  equipes: Equipe[]
  setUser: (user: Usuario | null) => void
  setNivelHierarquico: (nivel: NivelHierarquico | null) => void
  setEquipes: (equipes: Equipe[]) => void
  logout: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  nivelHierarquico: null,
  equipes: [],
  setUser: (user) => set({ user }),
  setNivelHierarquico: (nivel) => set({ nivelHierarquico: nivel }),
  setEquipes: (equipes) => set({ equipes }),
  logout: () => set({ user: null, nivelHierarquico: null, equipes: [] }),
}))
