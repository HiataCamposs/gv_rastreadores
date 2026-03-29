/**
 * Distâncias rodoviárias aproximadas (em km) de Governador Valadares
 * até as cidades mais comuns da região de atuação.
 *
 * Fonte: Google Maps (rota mais rápida por estrada).
 * Atualize conforme necessário.
 */
const DISTANCIAS_DE_GV = {
  "governador valadares": 0,
  ipatinga: 100,
  "coronel fabriciano": 108,
  timóteo: 112,
  caratinga: 103,
  manhuaçu: 128,
  "teófilo otoni": 138,
  valadares: 0,
  uberlândia: 780,
  uberaba: 840,
  "belo horizonte": 320,
  contagem: 330,
  betim: 340,
  "juiz de fora": 490,
  divinópolis: 450,
  "montes claros": 440,
  "sete lagoas": 370,
  "pouso alegre": 620,
  varginha: 580,
  lavras: 530,
  "patos de minas": 640,
  araguari: 750,
  ituiutaba: 830,
  viçosa: 270,
  muriaé: 230,
  "além paraíba": 310,
  cataguases: 280,
  leopoldina: 300,
  "ponte nova": 240,
  itabira: 190,
  "nova lima": 310,
  "lagoa santa": 340,
  curvelo: 330,
  diamantina: 350,
  araçuaí: 250,
  nanuque: 220,
  "carlos chagas": 175,
  aimorés: 95,
  resplendor: 60,
  "conselheiro pena": 75,
  mantena: 120,
  inhapim: 60,
  "dom cavati": 55,
  "engenheiro caldas": 30,
  alpercata: 12,
  periquito: 50,
  "fernandes tourinho": 25,
  "são paulo": 820,
  vitória: 440,
  "rio de janeiro": 580,
  "cachoeiro de itapemirim": 350,
  colatina: 270,
  linhares: 320,
};

/**
 * Retorna a distância (em km) de GV até a cidade informada.
 * Faz busca case-insensitive com normalização de acentos.
 * Se não encontrar, retorna Infinity (vai pro final da lista).
 */
export function getDistanciaDeGV(cidade) {
  if (!cidade) return Infinity;

  const normalizar = (str) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const cidadeNorm = normalizar(cidade);

  for (const [key, km] of Object.entries(DISTANCIAS_DE_GV)) {
    if (normalizar(key) === cidadeNorm) return km;
  }

  return Infinity; // cidade não mapeada
}

/**
 * Retorna o texto de distância formatado.
 */
export function formatarDistancia(km) {
  if (km === Infinity || km === null || km === undefined) return "—";
  return `${km} km`;
}
