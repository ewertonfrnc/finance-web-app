# Folga Desktop — Plano de implementação (Trilho + Foco)

> **Escopo deste plano:** levar o `finance-web-app` atual até o design **Folga
> Desktop** dos mockups anexados, implementando **apenas os layouts Trilho e
> Foco**. O layout **Ano fica fora de escopo** (o botão "Ano" pode aparecer no
> segmented como desabilitado / "em breve", mas não será implementado aqui).
>
> Baseado nos 14 mockups de referência (TopBar+Toolbar, Trilho claro/escuro,
> drawer do dia, editor de lançamento, layout Foco claro/escuro). Reconciliado com
> o código real em `src/features/balance/**` **e com o backend `finance-api`**
> (ver discovery em `docs/finance-api-discovery.html` e a nova **§1.A** + **Fase
> 0** sobre integração). Atualizado em 2026-06-20.
>
> Legenda de status: ✅ pronto · 🟡 parcial · ⬜ a fazer.

---

## 0. O que os mockups definem (leitura do design)

**Cromado (todas as telas):**
- **TopBar:** ● **Folga · diário** (esq.) · navegação de ano `‹ 📅 2026 ›` (centro)
  · à direita: **+ Novo** (botão verde sólido), **segmented Trilho / Ano / Foco**,
  **toggle de tema** (lua/sol), **engrenagem de Ajustes**.
- **Toolbar:** pílulas de filtro **Todas · Entradas · Saídas · Diários ·
  Economias** (esq.); à direita **SALDO · HOJE** `R$ 2.339,07` + badge
  **`≈ 44 dias`**, **sparkline "trajetória 2026"** (linha tracejada + ponto no
  hoje) e **PICO / VALE** `R$ 5,4k / −R$ 1,4k`.

**Cor do saldo = modo runway/gradiente** (confirmado pelos números):
`2.339,07 ÷ 44 ≈ 53,33` · `5.208,18 ÷ 98 ≈ 53,33` · `5.014,28 ÷ 94 ≈ 53,33`.
→ **runway = saldo ÷ R$ 53,33/dia**, coluna de saldo com gradiente contínuo
verde→amarelo→vermelho. **Dias futuros** aparecem **em itálico/dessaturados**
(ex.: `R$ 53,33` projetado do diário em cinza-itálico; fill do saldo mais leve).

**Trilho (mockups 1, 2, 8):** meses lado a lado em scroll horizontal; cada mês é
um card com header `● Junho /26` + resumo **ENTROU R$ 4,6k · SAIU R$ 4,8k ·
SALDO FIM R$ 592**; colunas **DIA · Entradas · Saídas · Diários · Economias ·
SALDO**; cada `DayRow` mostra **número + dia-da-semana** (`01 / SEG`); mês atual
com **outline verde**; **setas ‹ › flutuantes** fora da área de scroll.

**Drawer do dia (mockups 3, 4, 10, 11):** clique na linha → **drawer à direita
(~400px)** sobre overlay com blur. Header `‹ 05/06 ›` + `SEX-FEIRA` + ✕;
**SALDO · FIM DO DIA** grande + badge `≈ 98 dias`; três stats **ENTRADAS ·
SAÍDAS · LÍQUIDO** (líquido colorido +/−); **abas** Todas/Entradas/Saídas/
Diários/Economias; **lista de lançamentos** (ícone da categoria + nome + data +
**chip de etiqueta** opcional tipo `ASSINATURA` + valor +/− colorido + rótulo da
categoria); rodapé **+ Adicionar neste dia**.

**Editor de lançamento (mockups 5, 6, 12):** modal central **Novo/Editar
lançamento** + subtítulo `Junho · dia 15, 2026`. **TIPO** (4 botões
Entrada/Saída/Diário/Economia, selecionado com contorno na cor da categoria);
**VALOR** hero `R$ 0,00` **grande na cor da categoria**; **DESCRIÇÃO**
(placeholder "Onde foi parar essa grana?"); **DATA** `15/06/2026` + ícone de
calendário + presets **Hoje/Ontem/Anteontem**; **ETIQUETA** (opcional) input
"Ex.: Assinatura" + chips **Assinatura/Fixo/Bônus/Reembolso**; **RECORRÊNCIA**
**Não repete/Semanal/Mensal/Anual**; rodapé **Cancelar · Lançar** (desabilitado
até valor>0 e descrição) / **Salvar** na edição.

**Foco (mockups 13, 14, 15):** **sidebar ~272px** "MESES DE 2026" com os 12 meses
(nome + **saldo-fim em badge colorido** + `+R$ 4,6k −R$ 4,8k` entrou/saiu +
**líquido colorido**), mês atual destacado com **borda verde**; **um mês em
detalhe** à direita (densidade confortável) com **linha TOTAL** no rodapé
(`R$ 4.602,48 · R$ 2.469,13 · R$ 1.508,05 · R$ 800,00 · R$ 592,21`).

---

## 1. Estado atual do código (ponto de partida)

Stack real: **Vite 7 + React 19 + TypeScript + TanStack Router/Query + Tailwind v4
+ shadcn/ui**, Bun, Biome. (O prompt original assumia Babel standalone — ignorar
isso; nada de `desktop/*.js`.)

| Já existe | Onde | Aproveita para |
|---|---|---|
| Razão do mês (header + colunas + dias + footer de totais) | `MonthTable`, `DayRow`, `MonthSummary` | Trilho **e** Foco |
| Scroll horizontal de 12 meses, centraliza mês atual, fade de borda, lazy | `MonthGrid`, `LazyMonth` | Trilho |
| Cor do saldo por **faixas** (tier) | `lib/finance.ts#getSaldoColor` + classes `.finance-saldo-*` | base p/ estender a runway |
| Glyphs de categoria `↙ ↗ D E` + cores nos 2 temas | `CategoryMark`, tokens `--finance-category-*` | tudo |
| Modais criar/editar/listar/excluir + recorrência (none/daily/weekly/monthly) | `AddEntryModal`, `EntryListModal`, `DeleteRecurrenceModal`, `useTransactions` | base p/ editor + drawer |
| Tema claro/escuro/auto | `ThemeToggle`, `styles.css` | absorver na TopBar |
| Nav de ano `‹ ano ›` | `year-navigation/YearNav` | absorver na TopBar |
| Persistência JSON + localStorage, saldo acumulado, projeção futura do diário | `service/*`, `useFinanceYear` | ⚠ **substituir pelo finance-api** (ver §1.A) |

**Lacunas-chave para os mockups:** modo runway + dessaturação de futuro; TopBar e
Toolbar completas (segmented de layout, sparkline, pico/vale, filtros); **drawer
do dia** (hoje é clique-por-célula); editor com tipo/presets/etiqueta/anual;
**layout Foco**; dia-da-semana e outline do mês atual no Trilho.

---

## 1.A — O backend já existe: integração com `finance-api`

> Discovery completo em **`docs/finance-api-discovery.html`**. Resumo: o
> `finance-api` (Go/Postgres) **já computa no servidor quase tudo que o web-app
> recalcula no cliente**. O web-app hoje é *local-only* (`finance.json` +
> `localStorage`); integrar = **apagar essa camada e consumir a API**.

**O backend já entrega (não recalcular no front):**
- `GET /v1/balance?year=&month=` → `[]DayBalance` `{day, income, expense, daily,
  daily_projected, savings, running_balance}` (centavos) — **saldo diário
  acumulado**, **carry-forward entre meses (com cache)** e **projeção de dias
  futuros** (`daily_projected`).
- Recorrência **daily/weekly/monthly/yearly** expandida em SQL + **exceções** +
  **edição/exclusão por escopo** `single|following|all` (`POST/PATCH/DELETE
  /v1/transactions`).
- O **"diário"** versionado: `GET /v1/budget/preview → daily_budget.amount`
  (recalculado quando muda categoria). **O runway dos mockups =
  `running_balance ÷ daily_budget.amount`** — o `R$ 53,33` é só exemplo.
- **Tags como entidade** (id+cor, M:N, `monthly_total`): `GET/POST /v1/tags`,
  `PUT /v1/transactions/{id}/tags`.
- Auth JWT (`/v1/auth/register|login|forgot/reset`); dinheiro **int64 centavos**;
  tipos PT-BR **singular** (`entrada saida diario economia`); envelope
  `{success, data}`.

**Remover/aposentar do front ao integrar (era cálculo duplicado):**
- `lib/finance.ts`: `calcularSaldosMes`, `calcularSaldoInicialMes`,
  `calcularTotaisMes` (totais viram soma de `DayBalance`).
- `service/financeService.ts`, `service/localStorageAdapter.ts`,
  `service/transactionStorage.ts`, `data/normalizeFinance.ts`,
  `data/finance.json` (**a seed deixa de fazer sentido** — o demo passa a ser
  dados semeados no Postgres via `make seed`).
- `useTransactions.buildOccurrences` (expansão local de recorrência) e
  `removeTransactionsFromSeries`.
- `useOnboarding` (cálculo local do diário ÷30) → vira `register`/`budget`.

**Continua no front (apresentação):** `saldoColour` (runway+dessaturação),
sparkline e pico/vale (derivados dos `running_balance` dos 12 meses), `formatBRL`,
weekday, nomes de mês, e toda a UI (layouts/drawer/editor).

**Lacunas/decisões da integração:**
1. **Balance é mensal** (year+month). Trilho/Foco mostram 12 meses → **(a)** 12×
   `GET /balance` em paralelo (TanStack Query, cache por mês) — funciona já; ou
   **(b)** pedir um `GET /balance?year=` no backend. Recomendo (a) agora.
2. **Web-app não tem auth** hoje. Integrar exige **client HTTP + token + telas de
   login/registro/onboarding**. É a maior peça nova.
3. **Tags entidade vs string**: os chips Assinatura/Fixo/Bônus/Reembolso viram
   tags reais (criar/selecionar via `/v1/tags`), não um campo `string`.
4. Alinhar **plural↔singular**, **centavos no fio** (há `toCents/fromCents`),
   desempacotar `.data`, datas `YYYY-MM-DD`.

> **★ Decisão de arquitetura (precisa do seu ok) — ver Fase 0:**
> **(1) Cutover total** API+auth · **(2) Incremental** (camada de serviço com
> flag, troca hook a hook, fallback local) · **(3) Adiar** (segue local-only e
> integra depois). A recomendação é **(2) Incremental**, começando por
> `useFinanceYear → /v1/balance`.

---

## 2. Mudanças de fundação (pré-requisito das fases)

> **Nota:** §2.1 (runway) e §2.3 (preferências) valem em qualquer cenário. §2.2
> (tipos/seed/recorrência local) **só se ficar local-only**; sob integração
> (Fase 0) esses itens são substituídos pelo backend.

Antes dos layouts, preparar dados/tokens/tipos:

### 2.1 `lib/finance.ts` — modo runway ⬜  **(P0)**
- `runwayDias(saldo, diario) = saldo / diario`, onde **`diario` vem do backend**
  (`/v1/budget/preview → daily_budget.amount`); local-only usa o valor do
  onboarding. (`R$ 53,33` é só o exemplo dos mockups, não constante.)
- `saldoColour(saldo, { mode, dark, future }) → { fill, ink }`:
  - `mode: 'runway' | 'tier'`. **`runway` é o padrão** (mockups).
  - `runway`: interpola RGB contínuo por `runwayDias` em 5 stops
    (`≤−10 vermelho-escuro → 0 → 10 amarelo → 22 verde-claro → ≥40 verde-escuro`),
    conjunto espelhado p/ `dark`.
  - `tier`: reusar a lógica de faixas atual (oferecida em Ajustes).
  - `future: true` → dessaturar `fill` ~42% rumo ao fundo do painel e `ink` ~30%.
- Manter `getSaldoColor` atual como adaptador do modo `tier` (não quebrar
  `DayRow`). Migrar `DayRow` para `saldoColour` (recebe `mode`/`future`).
- Helpers de agregação (usados na Toolbar e no Foco): `saldoFimMes`,
  `totaisMes` (já há `calcularTotaisMes`), `picoVale(dailySaldo)`,
  `serieSaldoAno(year)` para a sparkline.

### 2.2 Tipos e dados ⬜
- `types/transaction.ts`: adicionar `tag?: string`; `TransactionRecurrence` ganha
  **`yearly`**.
- `useTransactions.ts`: `buildOccurrences` passa a tratar `yearly`; opção
  **"Termina em"** (limite além do default até 2100) — opcional nesta entrega.
- **Seed de demonstração** ⬜: popular `src/data/finance.json` com os recorrentes
  dos mockups (Salário R$ 4.600 dia 5, Aluguel R$ 1.850 dia 10, Academia/
  Mercado/Farmácia, etc.) e `saldo_inicial` coerente, para o gradiente "contar a
  história". Remover o campo órfão **`cartao`** do JSON.

### 2.3 Preferências ⬜
- Persistir em `localStorage` (`finance_pref_layout`, `finance_pref_density`,
  `finance_pref_saldo_mode`). Default: `layout='trilho'`, `saldo_mode='runway'`.
  Densidade: Trilho/Foco controlam a sua (Trilho compacto, Foco confortável).

---

## 3. Fases

### Fase 0 — Integração com `finance-api` ⬜  **(decisão + base)**
> Só se a escolha for **(1) Cutover** ou **(2) Incremental** (ver §1.A). Se for
> **(3) Adiar**, pular para a Fase 1 mantendo a fundação local.
- ⬜ **Decidir** o caminho de integração (1/2/3).
- ⬜ **Client HTTP** (`src/lib/api.ts`): base URL, injeção do JWT, desempacotar
  `{success,data}`, mapear erros; helpers `centavos↔reais` e `tipo plural↔singular`.
- ⬜ **Auth**: storage do token, telas/rota de **login/registro**, guarda de rota;
  onboarding via `register` (saldo inicial + categorias → diário).
- ⬜ **`useFinanceYear` → `/v1/balance`**: 12× `GET ?year=&month=` em paralelo
  (TanStack Query, `queryKey:['balance',year,month]`); montar o ano a partir dos
  `DayBalance`. **Remove** `financeService`/`normalizeFinance`/`finance.json` e os
  cálculos de saldo de `lib/finance.ts` (manter só apresentação).
- ⬜ **Transações → API**: `useTransactions` chama `POST/PATCH/DELETE
  /v1/transactions` (recorrência + scope `single|following|all`); **remove**
  `transactionStorage`/`localStorageAdapter`/`buildOccurrences`. Invalida
  `['balance', …]` no sucesso (o backend já invalida o cache dele).
- ⬜ **Diário/tags**: runway usa `daily_budget.amount` de `/v1/budget/preview`;
  etiquetas usam `/v1/tags`.
- **Aceite:** ano renderiza a partir da API com login real; criar/editar/excluir
  (inclusive recorrente por escopo) reflete no saldo; nenhuma leitura de
  `finance.json`/`localStorage` de dados financeiros permanece.

### Fase 1 — Cromado: TopBar + Toolbar 🟡→✅  **(P0)**
Componentes novos em `src/features/chrome/` (ou `components/`):
- ⬜ **`TopBar`**: marca `● Folga · diário`; nav de ano com ícone de calendário
  (absorver `YearNav`); **+ Novo** (abre editor sem dia → default hoje);
  **`LayoutSegmented`** (Trilho/Foco; Ano desabilitado); **toggle de tema**
  (mover `ThemeToggle` para cá); **botão Ajustes** → **popover**: "Cor do saldo"
  (Gradiente/5 faixas) + nota do runway.
- ⬜ **`Toolbar`**: **`CategoryFilter`** (Todas + 4 pílulas, multi/single — nos
  mockups parece seleção única com "Todas"); **`FocoSaldo`** (`SALDO · HOJE` +
  badge `≈ N dias`); **`Sparkline`** (`serieSaldoAno`, tracejado no hoje, label
  "trajetória 2026"); **`PicoVale`** (`R$ 5,4k / −R$ 1,4k`, abreviado em milhar).
- ⬜ Filtro de categoria **apaga** as colunas/células fora do filtro no razão.
- ⬜ Trocar de ano limpa seleção de dia (drawer fecha).
- **Aceite:** filtros, tema, ano, segmented e Ajustes funcionam e persistem;
  sparkline marca o hoje; pico/vale corretos.

### Fase 2 — Razão do mês: refinos p/ o design 🟡→✅  **(P0/P1)**
Sobre `MonthTable`/`DayRow`/`MonthSummary` (compartilhados por Trilho e Foco):
- ⬜ **Dia + dia-da-semana** (`01` grande + `SEG` pequeno) na coluna DIA.
- ⬜ **Saldo via `saldoColour` (runway)**; **dias futuros itálico + fill/ink
  dessaturados**; valor `R$ 53,33` projetado em cinza-itálico.
- ⬜ **Header do mês** com resumo **ENTROU · SAIU · SALDO FIM** (abreviado em `k`)
  e ● marcador; hoje, só há footer de totais.
- ⬜ **Linha de hoje** com marca (fundo `todayBg` + barra verde à esquerda).
- 🟡 **Densidade** via custom props (`--saldoW`, `--colGap`, `--numFs`,
  `--rowPadY`): Trilho usa compacto, Foco confortável.
- **Aceite:** mês correto nos 2 temas; coluna de saldo conta a história de cor;
  futuro visivelmente mais leve.

### Fase 3 — Layout Trilho ✅🟡→✅  **(P1)**
Sobre `MonthGrid`:
- ✅ scroll horizontal, centraliza mês atual, fade de borda, lazy.
- ⬜ **Setas ‹ › flutuantes** fora da área de scroll, avançam ~2 meses.
- ⬜ **Header de mês sticky** ao rolar verticalmente dentro do card.
- ⬜ **Outline verde no mês atual** (`greenSoft`).
- ⬜ Clique na `DayRow` **abre o drawer** (Fase 4), não os modais por célula.
- **Aceite:** rola suave; mês atual destacado; header gruda; clique abre drawer.

### Fase 4 — Drawer do dia ⬜  **(P0)** — substitui modais por célula
Novo `DayDrawer` (`components/ui/sheet` do shadcn ou drawer custom + overlay com
`backdrop-filter: blur`):
- ⬜ Header `‹ data ›` + dia-da-semana + ✕; `‹ ›` navegam dia anterior/seguinte
  (desabilitam nas bordas do mês); `Esc`/overlay fecham.
- ⬜ **SALDO · FIM DO DIA** grande + badge `≈ N dias` (runway).
- ⬜ Três stats **ENTRADAS · SAÍDAS · LÍQUIDO** (líquido +/− colorido).
- ⬜ **Abas** Todas/Entradas/Saídas/Diários/Economias.
- ⬜ **Lista de lançamentos** do dia: ícone da categoria, nome, data, **chip de
  etiqueta** (`tag`), valor +/− colorido, rótulo da categoria. Editar/excluir
  reaproveitando `useTransactions` + `DeleteRecurrenceModal`. Estado vazio
  "Sem lançamentos…".
- ⬜ Rodapé **+ Adicionar neste dia** → abre o editor (Fase 5) já com o dia.
- ⬜ Totais/saldo do drawer recalculam ao adicionar/editar/excluir.
- **Aceite:** abre/fecha com transição; navegação e abas funcionam; totais
  refletem mudanças; legado de clique-por-célula removido do `DayRow`.

### Fase 5 — Editor de lançamento ⬜🟡  **(P1)**
Evoluir `AddEntryModal` → `TransactionEditor` (criar/editar):
- ⬜ **TIPO**: 4 botões (Entrada/Saída/Diário/Economia), selecionado com contorno
  na cor da categoria (hoje a categoria vinha fixa da célula).
- ⬜ **VALOR** hero grande **na cor da categoria** (reusa `currency-input`).
- 🟡 **DESCRIÇÃO** (placeholder "Onde foi parar essa grana?").
- ⬜ **DATA** `DD/MM/AAAA` + ícone calendário + **presets Hoje/Ontem/Anteontem**
  (hoje só dígito do dia).
- ⬜ **ETIQUETA** opcional: input + chips **Assinatura/Fixo/Bônus/Reembolso**
  (grava `tag`).
- ⬜ **RECORRÊNCIA** Não repete/Semanal/Mensal/**Anual**.
- ⬜ **Validação**: Lançar/Salvar habilita só com **valor>0 e descrição**.
- ⬜ Foco inicial no valor (✅ `autoFocus`); animação fade+slide-up; `Esc` fecha;
  **Excluir** visível só em edição de item do usuário.
- **Aceite:** criar/editar/excluir reflete no drawer e nas somas do dia;
  validação do botão funciona.

### Fase 6 — Layout Foco ⬜  **(P1)**
Novo `FocoLayout`:
- ⬜ **`MonthSidebar` ~272px**: "MESES DE 2026" + 12 itens (nome + **saldo-fim em
  badge colorido** + `+R$ 4,6k −R$ 4,8k` + **líquido colorido**); mês atual com
  **borda verde + ●**; clique troca o mês em detalhe; scroll próprio.
- ⬜ **Detalhe**: `MonthTable` do mês selecionado em **densidade confortável**,
  com **linha TOTAL** no rodapé (estender `MonthSummary` para incluir
  **SALDO FIM**).
- ⬜ Clique na `DayRow` abre o mesmo **drawer** (Fase 4).
- **Aceite:** sidebar lista os 12 meses com resumo correto; clicar troca o painel;
  mês atual destacado; drawer abre.

### Fase 7 — Polimento ⬜🟡  **(P2)**
- ⬜ `prefers-reduced-motion`; scrollbars estilizadas; transições de tema ~0,2s;
  foco de teclado visível; revisão de contraste **fill × ink** (runway) nos 2
  temas.
- ⬜ Testes Vitest: `lib/finance.ts` (runway, dessaturação, pico/vale,
  `serieSaldoAno`) e `useTransactions` (ocorrências `yearly`, exclusão de série).
- **Aceite:** sem regressões; teclado utilizável; nada "pisca" ao trocar
  tema/ano/layout/mês.

---

## 4. Ordem de execução sugerida

0. **Decidir a integração** (§1.A) e, se (1)/(2), fazer a **Fase 0** — ela troca a
   fonte de dados antes de investir na UI sobre dados que vão mudar de forma.
1. **Fundação** (§2): runway em `saldoColour` (+ preferências). Tipos/seed locais
   (§2.2) só se ficar local-only.
2. **Fase 2** (razão refinado) — destrava o visual de Trilho e Foco juntos.
3. **Fase 4** (drawer) + **Fase 5** (editor) — o modelo de interação novo.
4. **Fase 1** (TopBar/Toolbar) — cromado e segmented que liga os layouts.
5. **Fase 3** (Trilho) e **Fase 6** (Foco).
6. **Fase 7** (polimento + testes).

> Por que a Fase 0 primeiro: o saldo, a projeção e a recorrência mudam de
> "calculado no front" para "vindo da API". Construir drawer/editor sobre o
> `localStorage` e refazer depois seria retrabalho.

> Parar e mostrar ao fim de cada fase. `bun run check` limpo antes de fechar.
> Respeitar a arquitetura real (`features/**`, alias `#/*`, tokens em
> `styles.css`, shadcn/ui). **Ano fora de escopo.**
