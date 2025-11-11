import { Plus, Edit, Trash2, Search } from 'lucide-react'
import React from 'react'

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  title: string
  columns: Column[]
  data: any[]
  onAdd?: () => void
  onEdit?: (row: any) => void
  onDelete?: (row: any) => void
  customActions?: (row: any) => React.ReactNode
  searchPlaceholder?: string
  loading?: boolean
}

export function DataTable({
  title,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  customActions,
  searchPlaceholder = 'Buscar...',
  loading = false,
}: DataTableProps) {
  const [search, setSearch] = React.useState('')

  const filteredData = data.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {onAdd && (
          <button onClick={onAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
          placeholder={searchPlaceholder}
        />
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Carregando...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhum registro encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase"
                  >
                    {column.label}
                  </th>
                ))}
                {(onEdit || onDelete || customActions) && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </td>
                  ))}
                  {(onEdit || onDelete || customActions) && (
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        {customActions && customActions(row)}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {!loading && filteredData.length > 0 && (
        <div className="text-sm text-gray-600">
          Mostrando {filteredData.length} de {data.length} registro(s)
        </div>
      )}
    </div>
  )
}
