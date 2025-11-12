// types/permissoes.ts
// Tipos para o novo sistema de permissões

export type TipoEquipe = {
  id: string;
  nome: 'Agendamento' | 'Acessórios' | 'Mecânica' | 'Consultoria' | 'Estoque' | 'Estética' | 'Novos' | 'Semi Novos' | 'Funilaria';
  descricao: string | null;
  ativo: boolean;
  created_at: string;
};

export type CargoEscopo = 'proprio' | 'equipe' | 'unidade' | 'grupo' | 'conglomerado' | 'todos';

export type Cargo = {
  id: string;
  nome: 'Operador' | 'Supervisor' | 'Gerente' | 'Diretor' | 'Presidente' | 'Admin TUNAP';
  escopo: CargoEscopo;
  nivel_acesso: number;
  created_at: string;
};

export type UsuarioTipoEquipe = {
  id: string;
  usuario_id: string;
  tipo_equipe_id: string;
  created_at: string;
  tipo_equipe?: TipoEquipe; // Incluído quando faz JOIN
};

export type UsuarioEscopo = {
  id: string;
  usuario_id: string;
  unidade_id: string | null;
  grupo_id: string | null;
  conglomerado_id: string | null;
  created_at: string;
  unidade?: Unidade; // Incluído quando faz JOIN
  grupo?: Grupo;
  conglomerado?: Conglomerado;
};

// Atualizar tipo Usuario existente
export type Usuario = {
  id: string;
  nome: string;
  email: string;
  cargo_id: string | null;
  nivel_hierarquico_id: string | null; // Manter compatibilidade
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Relações
  cargo?: Cargo;
  tipos_equipe?: TipoEquipe[];
  equipes_diretas?: Equipe[];
  unidades?: Unidade[];
  grupos?: Grupo[];
  conglomerados?: Conglomerado[];
};

// Atualizar tipo Equipe existente
export type Equipe = {
  id: string;
  nome: string;
  unidade_id: string;
  tipo_equipe_id: string | null;
  ativo: boolean;
  created_at: string;
  // Relações
  tipo_equipe?: TipoEquipe;
  unidade?: Unidade;
};

// Tipos para formulários
export type UsuarioFormData = {
  nome: string;
  email: string;
  senha?: string;
  cargo_id: string;
  ativo: boolean;
  // Campos dinâmicos baseados no cargo
  equipes_ids?: string[]; // Para Operador/Supervisor
  tipos_equipe_ids?: string[]; // Para Gerente/Diretor/Presidente
  unidades_ids?: string[]; // Para Gerente
  grupos_ids?: string[]; // Para Diretor
  conglomerados_ids?: string[]; // Para Presidente
};

// Response da função get_usuario_completo
export type UsuarioCompleto = {
  usuario: Usuario;
  cargo: Cargo | null;
  tipos_equipe: TipoEquipe[] | null;
  equipes_diretas: Equipe[] | null;
  unidades: Unidade[] | null;
  grupos: Grupo[] | null;
  conglomerados: Conglomerado[] | null;
};

// Helper types para componentes
export type CamposFormularioPorCargo = {
  mostrarEquipes: boolean;
  mostrarTiposEquipe: boolean;
  mostrarUnidades: boolean;
  mostrarGrupos: boolean;
  mostrarConglomerados: boolean;
};

// Tipos existentes que precisam ser mantidos
export type Unidade = {
  id: string;
  nome: string;
  grupo_id: string;
  ativo: boolean;
  created_at: string;
};

export type Grupo = {
  id: string;
  nome: string;
  conglomerado_id: string;
  ativo: boolean;
  created_at: string;
};

export type Conglomerado = {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
};

export type Venda = {
  id: string;
  usuario_id: string;
  equipe_id: string;
  unidade_id: string;
  data_venda: string;
  numero_identificacao: string;
  valor_total: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};
