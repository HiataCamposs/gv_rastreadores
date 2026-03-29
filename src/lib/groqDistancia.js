/**
 * Consulta a API da Groq (LLM) para estimar a distância rodoviária
 * entre Governador Valadares - MG e a cidade informada.
 *
 * Primeiro tenta usar o mapa local de distâncias conhecidas;
 * se a cidade não estiver mapeada, faz a chamada à IA.
 *
 * Retorna um número (km) ou null se não conseguir.
 */
import { getDistanciaDeGV } from "./distancias";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Cache em memória para evitar chamadas repetidas à API durante a mesma sessão.
 * Chave: cidade normalizada → valor: km (number) ou null
 */
const cache = new Map();

/**
 * Estima a distância rodoviária (km) de Governador Valadares até a cidade.
 *
 * Fluxo:
 *  1. Verifica mapa local (distancias.js)
 *  2. Verifica cache em memória
 *  3. Chama a Groq API
 *
 * @param {string} cidade  - Nome da cidade (ex: "Ipatinga", "Belo Horizonte")
 * @returns {Promise<number|null>}  km ou null se falhar
 */
export async function estimarDistanciaViaGroq(cidade) {
  if (!cidade || !cidade.trim()) return null;

  const cidadeTrim = cidade.trim();

  // 1) Mapa local
  const kmLocal = getDistanciaDeGV(cidadeTrim);
  if (kmLocal !== Infinity) return kmLocal;

  // 2) Cache em memória
  const cidadeKey = cidadeTrim.toLowerCase();
  if (cache.has(cidadeKey)) return cache.get(cidadeKey);

  // 3) Chamar Groq
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[groqDistancia] VITE_GROQ_API_KEY não configurada.");
    return null;
  }

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "Responda APENAS o número inteiro em km. Nada mais.",
          },
          {
            role: "user",
            content: `Distância rodoviária de Governador Valadares-MG até ${cidadeTrim}?`,
          },
        ],
        temperature: 0,
        max_completion_tokens: 10,
      }),
    });

    if (!res.ok) {
      console.error("[groqDistancia] Erro HTTP:", res.status);
      return null;
    }

    const json = await res.json();
    const texto = json.choices?.[0]?.message?.content?.trim() ?? "";

    // Extrair o primeiro número inteiro da resposta
    const match = texto.match(/\d+/);
    if (!match) {
      console.warn("[groqDistancia] Resposta inesperada:", texto);
      cache.set(cidadeKey, null);
      return null;
    }

    const km = parseInt(match[0], 10);
    if (km <= 0 || km > 15000) {
      // Sanity check
      cache.set(cidadeKey, null);
      return null;
    }

    cache.set(cidadeKey, km);
    return km;
  } catch (err) {
    console.error("[groqDistancia] Erro na chamada:", err);
    return null;
  }
}
