import { useNavigate } from "react-router-dom";
import FormNovoAgendamento from "../components/FormNovoAgendamento";

/**
 * Página de cadastro de novo agendamento.
 */
export default function NovoAgendamento() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <FormNovoAgendamento onSalvo={() => navigate(-1)} />
    </div>
  );
}
