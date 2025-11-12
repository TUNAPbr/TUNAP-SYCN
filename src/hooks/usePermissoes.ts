// hooks/usePermissoes.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { UsuarioCompleto, Cargo, TipoEquipe, Equipe } from '@/types/permissoes';

/**
 * Hook para obter dados completos do usuário logado
 */
export function useUsuarioCompleto(usuarioId: string | undefined) {
  const [usuario, setUsuario] = useState<UsuarioCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuarioId) {
      setLoading(false);
      return;
    }

    const fetchUsuario = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .rpc('get_usuario_completo', { p_usuario_id: usuarioId });

        if (error) throw error;
        setUsuario(data);
      } catch (err: any) {
        setError(err.message);
        console.error('Erro ao buscar usuário:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, [usuarioId]);

  return { usuario, loading, error };
}

/**
 * Hook para obter vendas do usuário com base em suas permissões
 */
export function useVendasUsuario(usuarioId: string | undefined) {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendas = async () => {
    if (!usuarioId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_vendas_usuario', { p_usuario_id: usuarioId });

      if (error) throw error;
      setVendas(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar vendas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendas();
  }, [usuarioId]);

  return { vendas, loading, error, refetch: fetchVendas };
}

/**
 * Hook para obter equipes permitidas do usuário (para Nova Venda)
 */
export function useEquipesUsuario(usuarioId: string | undefined) {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuarioId) {
      setLoading(false);
      return;
    }

    const fetchEquipes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .rpc('get_equipes_usuario', { p_usuario_id: usuarioId });

        if (error) throw error;
        setEquipes(data || []);
      } catch (err: any) {
        setError(err.message);
        console.error('Erro ao buscar equipes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipes();
  }, [usuarioId]);

  return { equipes, loading, error };
}

/**
 * Hook para obter todos os cargos disponíveis
 */
export function useCargos() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCargos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cargos')
          .select('*')
          .order('nivel_acesso', { ascending: true });

        if (error) throw error;
        setCargos(data || []);
      } catch (err: any) {
        setError(err.message);
        console.error('Erro ao buscar cargos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCargos();
  }, []);

  return { cargos, loading, error };
}

/**
 * Hook para obter todos os tipos de equipe
 */
export function useTiposEquipe() {
  const [tiposEquipe, setTiposEquipe] = useState<TipoEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTiposEquipe = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tipos_equipe')
          .select('*')
          .eq('ativo', true)
          .order('nome', { ascending: true });

        if (error) throw error;
        setTiposEquipe(data || []);
      } catch (err: any) {
        setError(err.message);
        console.error('Erro ao buscar tipos de equipe:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTiposEquipe();
  }, []);

  return { tiposEquipe, loading, error };
}

/**
 * Hook auxiliar para determinar quais campos mostrar no formulário baseado no cargo
 */
export function useCamposFormulario(cargoId: string | null) {
  const [campos, setCampos] = useState({
    mostrarEquipes: false,
    mostrarTiposEquipe: false,
    mostrarUnidades: false,
    mostrarGrupos: false,
    mostrarConglomerados: false,
  });

  useEffect(() => {
    const fetchCargo = async () => {
      if (!cargoId) {
        setCampos({
          mostrarEquipes: false,
          mostrarTiposEquipe: false,
          mostrarUnidades: false,
          mostrarGrupos: false,
          mostrarConglomerados: false,
        });
        return;
      }

      try {
        const { data: cargo } = await supabase
          .from('cargos')
          .select('escopo')
          .eq('id', cargoId)
          .single();

        if (!cargo) return;

        switch (cargo.escopo) {
          case 'proprio':
          case 'equipe':
            setCampos({
              mostrarEquipes: true,
              mostrarTiposEquipe: false,
              mostrarUnidades: false,
              mostrarGrupos: false,
              mostrarConglomerados: false,
            });
            break;
          case 'unidade':
            setCampos({
              mostrarEquipes: false,
              mostrarTiposEquipe: true,
              mostrarUnidades: true,
              mostrarGrupos: false,
              mostrarConglomerados: false,
            });
            break;
          case 'grupo':
            setCampos({
              mostrarEquipes: false,
              mostrarTiposEquipe: true,
              mostrarUnidades: false,
              mostrarGrupos: true,
              mostrarConglomerados: false,
            });
            break;
          case 'conglomerado':
            setCampos({
              mostrarEquipes: false,
              mostrarTiposEquipe: true,
              mostrarUnidades: false,
              mostrarGrupos: false,
              mostrarConglomerados: true,
            });
            break;
          case 'todos':
            setCampos({
              mostrarEquipes: false,
              mostrarTiposEquipe: false,
              mostrarUnidades: false,
              mostrarGrupos: false,
              mostrarConglomerados: false,
            });
            break;
        }
      } catch (err) {
        console.error('Erro ao buscar cargo:', err);
      }
    };

    fetchCargo();
  }, [cargoId]);

  return campos;
}

/**
 * Hook para verificar se usuário tem permissão específica
 */
export function useTemPermissao(usuarioId: string | undefined, permissaoRequerida: 'proprio' | 'equipe' | 'unidade' | 'grupo' | 'conglomerado' | 'todos') {
  const { usuario } = useUsuarioCompleto(usuarioId);
  
  if (!usuario?.cargo) return false;

  const nivelPermissao = {
    'proprio': 10,
    'equipe': 30,
    'unidade': 50,
    'grupo': 70,
    'conglomerado': 90,
    'todos': 100,
  };

  return usuario.cargo.nivel_acesso >= nivelPermissao[permissaoRequerida];
}
