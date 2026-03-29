import { Filter, X } from "lucide-react";

/**
 * Filtro por cidade — exibe chips/botões grandes que o usuário toca para filtrar.
 *
 * Props:
 *  - cidades         (string[])    lista de cidades disponíveis
 *  - cidadeSelecionada (string|null)
 *  - onSelecionar    (fn)           callback(cidade | null)
 */
export default function FiltroCidade({
  cidades = [],
  cidadeSelecionada,
  onSelecionar,
}) {
  if (cidades.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
        <Filter size={16} />
        <span>Filtrar por cidade</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Botão "Todas" */}
        <button
          onClick={() => onSelecionar(null)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer
            ${
              cidadeSelecionada === null
                ? "bg-primary-500 text-white shadow"
                : "bg-surface-alt text-text-secondary hover:bg-border-custom"
            }`}
        >
          Todas
        </button>

        {cidades.map((cidade) => (
          <button
            key={cidade}
            onClick={() =>
              onSelecionar(cidade === cidadeSelecionada ? null : cidade)
            }
            className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer
              ${
                cidade === cidadeSelecionada
                  ? "bg-primary-500 text-white shadow"
                  : "bg-surface-alt text-text-secondary hover:bg-border-custom"
              }`}
          >
            {cidade}
            {cidade === cidadeSelecionada && <X size={14} />}
          </button>
        ))}
      </div>
    </div>
  );
}
