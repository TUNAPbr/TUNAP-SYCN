// components/admin/FormularioUsuario.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCargos, useTiposEquipe, useCamposFormulario } from '@/hooks/usePermissoes';
import type { UsuarioFormData } from '@/types/permissoes';

type Props = {
  usuarioId?: string; // Se fornecido, é edição
  onSuccess: () => void;
  onCancel: () => void;
};

export default function FormularioUsuario({ usuarioId, onSuccess, onCancel }: Props) {
  const { cargos, loading: loadingCargos } = useCargos();
  const { tiposEquipe, loading: loadingTipos } = useTiposEquipe();
  
  const [formData, setFormData] = useState<UsuarioFormData>({
    nome: '',
    email: '',
    senha: '',
    cargo_id: '',
    ativo: true,
    equipes_ids: [],
    tipos_equipe_ids: [],
    unidades_ids: [],
    grupos_ids: [],
    conglomerados_ids: [],
  });

  const [equipes, setEquipes] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [conglomerados, setConglomerados] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const campos = useCamposFormulario(formData.cargo_id);

  // Buscar dados existentes se for edição
  useEffect(() => {
    if (!usuarioId) return;

    const fetchUsuario = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_usuario_completo', { p_usuario_id: usuarioId });

        if (error) throw error;

        setFormData({
          nome: data.usuario.nome,
          email: data.usuario.email,
          cargo_id: data.usuario.cargo_id || '',
          ativo: data.usuario.ativo,
          equipes_ids: data.equipes_diretas?.map((e: any) => e.id) || [],
          tipos_equipe_ids: data.tipos_equipe?.map((t: any) => t.id) || [],
          unidades_ids: data.unidades?.map((u: any) => u.id) || [],
          grupos_ids: data.grupos?.map((g: any) => g.id) || [],
          conglomerados_ids: data.conglomerados?.map((c: any) => c.id) || [],
        });
      } catch (err: any) {
        console.error('Erro ao buscar usuário:', err);
        setError(err.message);
      }
    };

    fetchUsuario();
  }, [usuarioId]);

  // Buscar equipes disponíveis
  useEffect(() => {
    const fetchEquipes = async () => {
      const { data } = await supabase
        .from('equipes')
        .select(`
          id,
          nome,
          unidade_id,
          unidades (nome)
        `)
        .eq('ativo', true)
        .order('nome');
      
      setEquipes(data || []);
    };

    fetchEquipes();
  }, []);

  // Buscar unidades disponíveis
  useEffect(() => {
    const fetchUnidades = async () => {
      const { data } = await supabase
        .from('unidades')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      
      setUnidades(data || []);
    };

    fetchUnidades();
  }, []);

  // Buscar grupos disponíveis
  useEffect(() => {
    const fetchGrupos = async () => {
      const { data } = await supabase
        .from('grupos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      
      setGrupos(data || []);
    };

    fetchGrupos();
  }, []);

  // Buscar conglomerados disponíveis
  useEffect(() => {
    const fetchConglomerados = async () => {
      const { data } = await supabase
        .from('conglomerados')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      
      setConglomerados(data || []);
    };

    fetchConglomerados();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Criar/Atualizar usuário
      let usuarioIdFinal = usuarioId;

      if (usuarioId) {
        // Edição
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({
            nome: formData.nome,
            email: formData.email,
            cargo_id: formData.cargo_id,
            ativo: formData.ativo,
          })
          .eq('id', usuarioId);

        if (updateError) throw updateError;
      } else {
        // Criação
        const { data: novoUsuario, error: insertError } = await supabase
          .from('usuarios')
          .insert({
            nome: formData.nome,
            email: formData.email,
            cargo_id: formData.cargo_id,
            ativo: formData.ativo,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        usuarioIdFinal = novoUsuario.id;
      }

      // 2. Limpar vínculos antigos
      await supabase.from('usuario_equipes').delete().eq('usuario_id', usuarioIdFinal);
      await supabase.from('usuario_tipos_equipe').delete().eq('usuario_id', usuarioIdFinal);
      await supabase.from('usuario_escopos').delete().eq('usuario_id', usuarioIdFinal);

      // 3. Criar novos vínculos baseado no cargo
      if (campos.mostrarEquipes && formData.equipes_ids && formData.equipes_ids.length > 0) {
        // Operador/Supervisor: vincular equipes diretas
        const equipesVinculos = formData.equipes_ids.map(equipe_id => ({
          usuario_id: usuarioIdFinal,
          equipe_id,
        }));

        const { error: equipesError } = await supabase
          .from('usuario_equipes')
          .insert(equipesVinculos);

        if (equipesError) throw equipesError;
      }

      if (campos.mostrarTiposEquipe && formData.tipos_equipe_ids && formData.tipos_equipe_ids.length > 0) {
        // Gerente+: vincular tipos de equipe
        const tiposVinculos = formData.tipos_equipe_ids.map(tipo_equipe_id => ({
          usuario_id: usuarioIdFinal,
          tipo_equipe_id,
        }));

        const { error: tiposError } = await supabase
          .from('usuario_tipos_equipe')
          .insert(tiposVinculos);

        if (tiposError) throw tiposError;
      }

      if (campos.mostrarUnidades && formData.unidades_ids && formData.unidades_ids.length > 0) {
        // Gerente: vincular unidades
        const unidadesVinculos = formData.unidades_ids.map(unidade_id => ({
          usuario_id: usuarioIdFinal,
          unidade_id,
        }));

        const { error: unidadesError } = await supabase
          .from('usuario_escopos')
          .insert(unidadesVinculos);

        if (unidadesError) throw unidadesError;
      }

      if (campos.mostrarGrupos && formData.grupos_ids && formData.grupos_ids.length > 0) {
        // Diretor: vincular grupos
        const gruposVinculos = formData.grupos_ids.map(grupo_id => ({
          usuario_id: usuarioIdFinal,
          grupo_id,
        }));

        const { error: gruposError } = await supabase
          .from('usuario_escopos')
          .insert(gruposVinculos);

        if (gruposError) throw gruposError;
      }

      if (campos.mostrarConglomerados && formData.conglomerados_ids && formData.conglomerados_ids.length > 0) {
        // Presidente: vincular conglomerados
        const conglomeradosVinculos = formData.conglomerados_ids.map(conglomerado_id => ({
          usuario_id: usuarioIdFinal,
          conglomerado_id,
        }));

        const { error: conglomeradosError } = await supabase
          .from('usuario_escopos')
          .insert(conglomeradosVinculos);

        if (conglomeradosError) throw conglomeradosError;
      }

      onSuccess();
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMultiSelectChange = (field: keyof UsuarioFormData, value: string) => {
    const currentValues = (formData[field] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    setFormData(prev => ({ ...prev, [field]: newValues }));
  };

  if (loadingCargos || loadingTipos) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">
        {usuarioId ? 'Editar Usuário' : 'Novo Usuário'}
      </h2>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}

      {/* Dados Básicos */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome *</label>
          <input
            type="text"
            required
            value={formData.nome}
            onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {!usuarioId && (
          <div>
            <label className="block text-sm font-medium mb-1">Senha *</label>
            <input
              type="password"
              required
              value={formData.senha}
              onChange={e => setFormData(prev => ({ ...prev, senha: e.target.value }))}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Cargo *</label>
          <select
            required
            value={formData.cargo_id}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              cargo_id: e.target.value,
              // Limpar campos ao trocar cargo
              equipes_ids: [],
              tipos_equipe_ids: [],
              unidades_ids: [],
              grupos_ids: [],
              conglomerados_ids: [],
            }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um cargo</option>
            {cargos.map(cargo => (
              <option key={cargo.id} value={cargo.id}>
                {cargo.nome} ({cargo.escopo})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ativo"
            checked={formData.ativo}
            onChange={e => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="ativo" className="text-sm font-medium">Ativo</label>
        </div>
      </div>

      {/* Campos Dinâmicos baseados no Cargo */}
      {campos.mostrarEquipes && (
        <div>
          <label className="block text-sm font-medium mb-2">Equipes *</label>
          <div className="border rounded p-3 max-h-60 overflow-y-auto space-y-2">
            {equipes.map(equipe => (
              <label key={equipe.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={formData.equipes_ids?.includes(equipe.id) || false}
                  onChange={() => handleMultiSelectChange('equipes_ids', equipe.id)}
                  className="rounded"
                />
                <span className="text-sm">
                  {equipe.nome} - {equipe.unidades?.nome}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {campos.mostrarTiposEquipe && (
        <div>
          <label className="block text-sm font-medium mb-2">Tipos de Equipe *</label>
          <div className="border rounded p-3 space-y-2">
            {tiposEquipe.map(tipo => (
              <label key={tipo.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={formData.tipos_equipe_ids?.includes(tipo.id) || false}
                  onChange={() => handleMultiSelectChange('tipos_equipe_ids', tipo.id)}
                  className="rounded"
                />
                <span className="text-sm">{tipo.nome}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {campos.mostrarUnidades && (
        <div>
          <label className="block text-sm font-medium mb-2">Unidades *</label>
          <div className="border rounded p-3 max-h-60 overflow-y-auto space-y-2">
            {unidades.map(unidade => (
              <label key={unidade.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={formData.unidades_ids?.includes(unidade.id) || false}
                  onChange={() => handleMultiSelectChange('unidades_ids', unidade.id)}
                  className="rounded"
                />
                <span className="text-sm">{unidade.nome}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {campos.mostrarGrupos && (
        <div>
          <label className="block text-sm font-medium mb-2">Grupos *</label>
          <div className="border rounded p-3 max-h-60 overflow-y-auto space-y-2">
            {grupos.map(grupo => (
              <label key={grupo.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={formData.grupos_ids?.includes(grupo.id) || false}
                  onChange={() => handleMultiSelectChange('grupos_ids', grupo.id)}
                  className="rounded"
                />
                <span className="text-sm">{grupo.nome}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {campos.mostrarConglomerados && (
        <div>
          <label className="block text-sm font-medium mb-2">Conglomerados *</label>
          <div className="border rounded p-3 max-h-60 overflow-y-auto space-y-2">
            {conglomerados.map(conglomerado => (
              <label key={conglomerado.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={formData.conglomerados_ids?.includes(conglomerado.id) || false}
                  onChange={() => handleMultiSelectChange('conglomerados_ids', conglomerado.id)}
                  className="rounded"
                />
                <span className="text-sm">{conglomerado.nome}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-50"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
