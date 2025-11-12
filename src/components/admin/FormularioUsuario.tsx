'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, AlertCircle, CheckCircle, User, Briefcase, Tag, FileText } from 'lucide-react'

interface FormularioUsuarioProps {
  usuarioId?: string
  onSuccess: () => void
  onCancel: () => void
}

interface Cargo {
  id: string
  nome: string
  categoria: string
  cor: string
  escopo: string
  nivel_acesso: number
}

export default function FormularioUsuario({ usuarioId, onSuccess, onCancel }: FormularioUsuarioProps) {
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  // Dados do formulário
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [cargoId, setCargoId] = useState('')
  const [cargoLabel, setCargoLabel] = useState('')
  const [cargoDescricao, setCargoDescricao] = useState('')
  const [tipoEmpresa, setTipoEmpresa] = useState<'CLIENTE' | 'TUNAP'>('CLIENTE')
  const [ativo, setAtivo] = useState(true)

  // Listas
  const [cargos, setCargos] = useState<Cargo[]>([])

  // Sugestões de labels por categoria
  const labelsSugeridos: Record<string, string[]> = {
    'OPERACIONAL': [
      'Consultor',
      'Mecânico',
      'Vendedor',
      'Balcão',
      'Agendador',
      'Recepcionista',
      'Auxiliar',
      'Técnico',
    ],
    'GESTAO': [
      'Coordenador',
      'Líder de Equipe',
      'Supervisor de Vendas',
      'Supervisor Técnico',
      'Supervisor Operacional',
    ],
    'DIRETORIA': [
      'Diretor Comercial',
      'Diretor Operacional',
      'Diretor Regional',
      'Diretor Geral',
    ],
    'EXECUTIVO': [
      'CEO',
      'CFO',
      'COO',
      'Presidente',
      'Vice-Presidente',
    ],
  }

  useEffect(() => {
    loadData()
  }, [usuarioId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar cargos
      const { data: cargosData, error: cargosError } = await supabase
        .from('cargos')
        .select('*')
        .order('nivel_acesso')

      if (cargosError) throw cargosError
      setCargos(cargosData || [])

      // Se está editando, carregar dados do usuário
      if (usuarioId) {
        const { data: usuarioData, error: usuarioError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', usuarioId)
          .single()

        if (usuarioError) throw usuarioError

        setNomeCompleto(usuarioData.nome_completo)
        setEmail(usuarioData.email)
        setCargoId(usuarioData.cargo_id)
        setCargoLabel(usuarioData.cargo_label || '')
        setCargoDescricao(usuarioData.cargo_descricao || '')
        setTipoEmpresa(usuarioData.tipo_empresa)
        setAtivo(usuarioData.ativo)
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      setErro(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setSalvando(true)

    try {
      if (usuarioId) {
        // ========================================
        // ATUALIZAR USUÁRIO EXISTENTE
        // ========================================
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({
            nome_completo: nomeCompleto,
            cargo_id: cargoId,
            cargo_label: cargoLabel || null,
            cargo_descricao: cargoDescricao || null,
            tipo_empresa: tipoEmpresa,
            ativo,
          })
          .eq('id', usuarioId)

        if (updateError) throw updateError

        // Se mudou senha
        if (senha) {
          const response = await fetch('/api/admin/update-user-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: usuarioId,
              password: senha,
            }),
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Erro ao atualizar senha')
          }
        }

        setSucesso('Usuário atualizado com sucesso!')
      } else {
        // ========================================
        // CRIAR NOVO USUÁRIO
        // ========================================
        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: senha,
            nome_completo: nomeCompleto,
            cargo_id: cargoId,
            cargo_label: cargoLabel || null,
            cargo_descricao: cargoDescricao || null,
            tipo_empresa: tipoEmpresa,
            ativo,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erro ao criar usuário')
        }

        setSucesso('Usuário criado com sucesso!')
      }

      // Aguardar 1 segundo e voltar
      setTimeout(() => {
        onSuccess()
      }, 1000)
    } catch (error: any) {
      console.error('Erro:', error)
      setErro(error.message)
    } finally {
      setSalvando(false)
    }
  }

  const cargoSelecionado = cargos.find((c) => c.id === cargoId)
  const sugestoes = cargoSelecionado
    ? labelsSugeridos[cargoSelecionado.categoria] || []
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {usuarioId ? 'Editar' : 'Novo'} Usuário
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {usuarioId
              ? 'Atualize os dados do usuário'
              : 'Preencha os dados para criar um novo usuário'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
          disabled={salvando}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Mensagens */}
      {erro && (
        <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div className="mb-6 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card: Informações Básicas */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Informações Básicas
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Nome Completo *</label>
              <input
                type="text"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                className="input-field"
                required
                disabled={salvando}
                placeholder="João da Silva"
              />
            </div>

            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
                disabled={!!usuarioId || salvando}
                placeholder="joao@empresa.com"
              />
              {usuarioId && (
                <p className="text-xs text-gray-500 mt-1">
                  Email não pode ser alterado
                </p>
              )}
            </div>

            <div>
              <label className="label">
                Senha {usuarioId ? '(deixe em branco para manter)' : '*'}
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="input-field"
                required={!usuarioId}
                disabled={salvando}
                placeholder="••••••••"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo de 6 caracteres
              </p>
            </div>
          </div>
        </div>

        {/* Card: Cargo e Função */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Cargo e Função
            </h2>
          </div>

          <div className="space-y-4">
            {/* Cargo Base */}
            <div>
              <label className="label">
                Cargo Base *
                <span className="text-xs text-gray-500 ml-2 font-normal">
                  (Define permissões no sistema)
                </span>
              </label>
              <select
                value={cargoId}
                onChange={(e) => setCargoId(e.target.value)}
                className="input-field"
                required
                disabled={salvando}
              >
                <option value="">Selecione...</option>
                {cargos.map((cargo) => (
                  <option key={cargo.id} value={cargo.id}>
                    {cargo.nome} - {cargo.categoria} (Acesso: {cargo.nivel_acesso})
                  </option>
                ))}
              </select>
            </div>

            {/* Label Customizado */}
            {cargoId && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label className="label flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  Função Específica (Label Customizado)
                  <span className="text-xs text-gray-500 font-normal">
                    - Opcional
                  </span>
                </label>

                <input
                  type="text"
                  value={cargoLabel}
                  onChange={(e) => setCargoLabel(e.target.value)}
                  className="input-field mb-3"
                  placeholder={cargoSelecionado?.nome || 'Ex: Consultor, Mecânico, Vendedor...'}
                  disabled={salvando}
                />

                {/* Sugestões */}
                {sugestoes.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 mb-2">💡 Sugestões:</p>
                    <div className="flex flex-wrap gap-2">
                      {sugestoes.map((sugestao) => (
                        <button
                          key={sugestao}
                          type="button"
                          onClick={() => setCargoLabel(sugestao)}
                          className="px-3 py-1 text-xs bg-white border border-blue-300 rounded hover:bg-blue-100 transition-colors"
                          disabled={salvando}
                        >
                          {sugestao}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                  <p className="text-xs text-gray-500 mb-1">📋 Preview:</p>
                  <p className="font-semibold text-gray-900">
                    {cargoLabel || cargoSelecionado?.nome || '...'}
                  </p>
                  {cargoLabel && (
                    <p className="text-xs text-gray-500 mt-1">
                      Cargo base: {cargoSelecionado?.nome}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Descrição */}
            <div>
              <label className="label flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Descrição (Opcional)
              </label>
              <textarea
                value={cargoDescricao}
                onChange={(e) => setCargoDescricao(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Ex: Especialista em produtos de linha premium"
                disabled={salvando}
              />
              <p className="text-xs text-gray-500 mt-1">
                Informações adicionais sobre a função deste usuário
              </p>
            </div>
          </div>
        </div>

        {/* Card: Configurações */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Configurações
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Tipo de Empresa *</label>
              <select
                value={tipoEmpresa}
                onChange={(e) => setTipoEmpresa(e.target.value as any)}
                className="input-field"
                required
                disabled={salvando}
              >
                <option value="CLIENTE">Cliente</option>
                <option value="TUNAP">TUNAP</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
                disabled={salvando}
              />
              <label htmlFor="ativo" className="text-sm text-gray-700">
                Usuário ativo
              </label>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : usuarioId ? 'Atualizar' : 'Criar Usuário'}
          </button>
        </div>
      </form>
    </div>
  )
}
