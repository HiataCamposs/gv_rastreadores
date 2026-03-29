import FormNovoAgendamento from "../components/FormNovoAgendamento";

/**
 * Página de cadastro de novo agendamento.
 *
 * Props:
 *  - onVoltar  (fn)  callback para voltar ao Dashboard
 */
export default function NovoAgendamento({ onVoltar }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <FormNovoAgendamento onSalvo={onVoltar} />
    </div>
  );
}
