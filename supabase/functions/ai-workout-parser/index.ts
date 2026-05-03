
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LEGACY_SCHEMA_HINT = `
Formato JSON OBRIGATÓRIO (ParsedWorkout legado — espelhar o parser local):
{
  "blocks": [ /* mesma ordem e contagens que parsedLocal */ ],
  "globalNotes": "string opcional",
  "assistantGuidance": {
    "summary": "string opcional — uma frase sobre o que foi refinado",
    "tips": ["dicas curtas para o treinador, ex.: bi-set com <Ex>+"],
    "suggestedCanonicalText": "string|null — prescrição completa em sintaxe FitBlock (só sugestão, não aplicada automaticamente)"
  }
}

Cada bloco inclui title, category, formatType, rounds, timeCap, notes (refinar só notes), exercises[].
Cada exercício: name e campos sets/reps/load/distance/duration/pace/rounds e isBiSet/isCombined/biSetLabel COPIADOS de parsedLocal; apenas "notes" do exercício podes refinar em português.

NÃO uses objeto "prescription" aninhado — campos diretos no exercício.
assistantGuidance é opcional mas recomendado quando houver texto livre ou ambiguidade.
`

/** Resumo das regras do tokenizer FitBlock (parser determinístico — a IA deve conhecer para orientar o treinador). */
const PARSER_RULES_FOR_MODEL = `
REGRAS DO PARSER FITBLOCK (fonte de verdade estrutural — documentação completa no repositório em docs/workout-parser-FITBLOCK-IA.md):

1) BLOCO: linha *TÍTULO* entre asteriscos, OU linha só em MAIÚSCULAS (ex.: CONDICIONAMENTO), sem começar por dígito ou "-".
2) EXERCÍCIO isolado: -Nome- ou <Nome> (também -Nome sem fechar).
3) BI-SET: primeira parte termina com + → -Nome-+ ou <Nome>+ ; o par é o exercício seguinte com a respetiva prescrição.
4) EXERCÍCIO COMBINADO (não é bi-set): -A + B- ou <A + B> (o + vai DENTRO do nome).
5) PRESCRIÇÃO pura (token DATA): linhas como "4 x 10-12", só "60kg", só tempo, "descanse 90seg", intervalos — sem nome de movimento na mesma linha.
6) TEXTO LIVRE: notas do coach (ex.: "cargas pesadas") — classificadas como TEXT; no resultado estruturado aparecem em notes do exercício/bloco.
7) FORMATO: FOR TIME, AMRAP, EMOM, etc. são FORMAT_INDICATOR.
8) Separador: linha só com -- ou mais hífenes.

A IA NÃO reclassifica linhas: quem decide a árvore é o parser local. Tu apenas explicas e sugeres sintaxe canónica em assistantGuidance.
`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const text = body?.text as string | undefined
    const parsedLocal = body?.parsedLocal as Record<string, unknown> | undefined

    if (!text?.trim()) {
      return new Response(
        JSON.stringify({ error: 'No workout text provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error('OPENAI_API_KEY is not set')
    }

    const openai = new OpenAI({ apiKey: openAiKey })

    const hybridSystem = `
És um assistente de prescrição FitBlock. O treino já foi interpretado por um PARSER DETERMINÍSTICO (regras fixas). A estrutura (blocos, exercícios, bi-sets, prescrições) é OFICIAL e vem em parsedLocal.

${PARSER_RULES_FOR_MODEL}

O TEU PAPEL (híbrido):
1) COPIAR de parsedLocal para o JSON de resposta: title, category, formatType, timeCap, rounds de cada bloco; name, sets, reps, load, distance, duration, pace, rounds, isBiSet, isCombined, biSetLabel de cada exercício — valores idênticos (só normalização de espaços).
2) REFINAR APENAS texto narrativo:
   - globalNotes
   - notes de cada bloco
   - notes de cada exercício (observações do coach, descansos explicados, "cargas pesadas", etc.)
   Gramática e clareza em português (PT-PT ou PT-BR alinhado ao original). Podes levemente melhorar pontuação e artigos; não alteres o sentido técnico.
3) NÃO reescrevas nomes de movimentos (name) — mantém exatamente como em parsedLocal.
4) NÃO inventes exercícios, blocos, bi-sets nem alteres contagens.
5) assistantGuidance (recomendado):
   - tips: lista curta (ex.: "Para marcar bi-set use <Exercício>+ na primeira linha", "Bloco: use *TÍTULO*").
   - suggestedCanonicalText: prescrição completa reescrita em sintaxe FitBlock (ângulos <>, blocos *, bi-set +) SÓ como sugestão para o treinador — o app não a aplica sozinha.
   - summary: uma frase sobre o refinamento feito.

${LEGACY_SCHEMA_HINT}

Responde APENAS com um único objeto JSON válido (inclui blocks + globalNotes; assistantGuidance opcional).
`

    const legacyOnlySystem = `
Preferência FitBlock: o cliente deve usar o parser local primeiro. Se receberes só texto sem parsedLocal, converte para o JSON do schema, seguindo a documentação implícita em:
${PARSER_RULES_FOR_MODEL}

${LEGACY_SCHEMA_HINT}

Preserva ordem. Cargas Rx: "(43/30kg)" ou "#32/24kg" quando existirem.
Responde APENAS com JSON válido.
`

    const userHybrid = parsedLocal
      ? `TEXTO ORIGINAL DO TREINADOR:\n---\n${text}\n---\n\nOUTPUT DO PARSER LOCAL (JSON — mantém estrutura, melhora só textos):\n${JSON.stringify(parsedLocal)}`
      : `Treino em texto livre:\n\n${text}`

    const messages = parsedLocal
      ? [
          { role: "system" as const, content: hybridSystem },
          { role: "user" as const, content: userHybrid },
        ]
      : [
          { role: "system" as const, content: legacyOnlySystem },
          { role: "user" as const, content: userHybrid },
        ]

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" }
    })

    const raw = response.choices[0].message.content || '{}'
    const parsedWorkout = JSON.parse(raw)

    return new Response(
      JSON.stringify(parsedWorkout),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-workout-parser:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
