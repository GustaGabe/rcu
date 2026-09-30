# CLAUDE.md

Guia para o Claude Code trabalhar neste repositório.

## O projeto

App pessoal para acompanhar uma doença crônica: tomar os remédios na hora, registrar sintomas em menos de 30 segundos e não perder consultas. O MVP é para **retocolite ulcerativa (RCU)**, mas a arquitetura já aceita várias doenças. Funciona **offline e sem servidor**: todos os dados ficam no celular.

Este arquivo é a especificação técnica do projeto. O `README.md` descreve as funcionalidades, o plano de desenvolvimento e o roadmap.

## Stack

- Expo SDK 57 + TypeScript 6 em modo `strict`, Node 24 LTS (`.nvmrc`)
- Expo Router (rotas por arquivo, abas e pilhas)
- expo-sqlite (banco local) e expo-notifications (lembretes locais)
- react-hook-form + zod (formulários com validação tipada)
- date-fns com locale pt-BR
- Ícones: `@expo/vector-icons` (Ionicons; MaterialCommunityIcons para as formas de remédio)
- UI com componentes próprios e `StyleSheet`. Não adicione biblioteca de UI no MVP.
- Movimento e acabamento: react-native-reanimated 4, expo-blur, expo-haptics, react-native-svg
- Fontes: Bricolage Grotesque (títulos e números) e Instrument Sans (texto), via `@expo-google-fonts`, carregadas em `app/_layout.tsx`

## Comandos

```bash
nvm use                                     # Node 24 (o Node 25 padrão da máquina não é LTS)
npm run start:tunnel                        # dev server com túnel, no Expo Go (necessário no WSL2)
npm run start:dev                           # dev server com túnel para o build de desenvolvimento
npm start                                   # dev server na rede local, no Expo Go
npm test                                    # Jest (preset jest-expo)
npm run lint                                # ESLint (eslint-config-expo)
npm run typecheck                           # tsc --noEmit
npx expo-doctor                             # confere dependências e configuração
eas build -p ios --profile development      # build de dev (necessário para testar notificações)
eas build -p ios --profile production
eas submit -p ios
```

Rode `typecheck`, `lint` e `test` antes de dar uma tarefa por concluída.

- Instale pacotes com `npx expo install <pacote>`, que escolhe a versão compatível com o SDK. Para dependências de desenvolvimento, use `npm install -D` com a versão que o Expo indicar.
- O Expo muda muito entre SDKs. Antes de usar uma API do Expo ou do Expo Router, confira a documentação da versão instalada (`https://docs.expo.dev/versions/v57.0.0/` ou `https://docs.expo.dev/llms.txt`), sem confiar na memória.
- O `react-dom` está nas dependências só para satisfazer peers do Expo Router. Mantenha a versão igual à do `react`.

## Estrutura

```
app/
  _layout.tsx            # abre o banco, roda migrações, chama rescheduleAll()
  (tabs)/
    _layout.tsx          # abas num paginador (TopTabs, deslizar troca de aba) + FloatingTabBar
    index.tsx            # Hoje
    meds.tsx
    diary.tsx
    appointments.tsx
  meds/[id].tsx          # detalhe: editar, pausar, reativar, arquivar
  meds/form.tsx          # modal de cadastro (sem id) e edição (?id=)
  diary/[date].tsx
  appointments/[id].tsx  # detalhe: perguntas, respostas, editar, apagar
  appointments/form.tsx  # modal de cadastro (sem id) e edição (?id=)
  onboarding.tsx         # introdução no primeiro uso (Stack.Protected no _layout)
  about.tsx              # Sobre: aviso médico, privacidade, lembretes, dev
src/
  db/                    # client.ts (useDb, initDatabase), migrations.ts, types.ts (Db), devData.ts
  repositories/          # medications, doses, diary, appointments, conditions
  conditions/            # definições por doença
    types.ts             # ConditionDefinition, FieldDefinition
    index.ts             # registro das doenças disponíveis
    rcu/definition.ts
  domain/
    types.ts             # tipos do modelo de dados (camelCase)
    labels.ts            # rótulos pt-BR dos enums
    dates.ts             # chaves ISO e formatação pt-BR
    medicationForm.ts    # schema zod do M1 e conversões formulário ↔ MedicationDraft
    appointmentForm.ts   # schema zod do C1 e conversões
    diarySchema.ts       # buildDiarySchema(def), valores iniciais do dia
    format.ts            # descrição de horários, dias de crise, percentuais
    schedule.ts          # dosesForDate(medications, schedules, date), applyDoseLogs
    adherence.ts         # adherenceRatio: fração das doses previstas que foram tomadas
    diarySchema.ts       # buildDiarySchema(def) gera o zod a partir da definição
  notifications/
    plan.ts              # planNotifications: função pura que decide o que agendar
    scheduler.ts         # rescheduleAll, permissão, handler (expo-notifications)
  components/            # base visual (ver "Design") e FloatingTabBar
    form/                # Field, TextField, OptionGrid, Stepper, DateTimeField, SwitchRow, FieldInput
  hooks/useFocusQuery.ts # carrega dados quando a tela ganha foco
  hooks/useOnboarding.tsx  # complete()/restart() da introdução
  testing/testDb.ts      # Db sobre better-sqlite3 em memória, só para testes
  theme/                 # tokens: cores, tons, espaçamentos, raios, fontes, tipografia
```

`@/` é alias para `src/` (ex.: `import { Surface } from '@/components/Surface'`).

## Design

O visual parte do roxo, cor de conscientização das doenças inflamatórias intestinais. Os tokens ficam em `src/theme/index.ts`, e nenhuma tela usa cor, fonte ou tamanho solto.

- **Paleta:** fundo lilás-acinzentado (`canvas`), superfícies brancas sem borda nem sombra, `plum` escuro para o painel da tela Hoje e a barra de abas, `lavender` como destaque sobre o escuro, `violet` para ações. Tons semânticos (`tones`): `sage` = tomado/ok, `rose` = crise, `amber` = pulado/pausado.
- **Tipografia:** use o componente `Text` com `variant` (`display`, `title`, `numeral`, `heading`, `body`, `bodyStrong`, `caption`, `label`). Com fonte própria não use `fontWeight`; o peso vem da família em `fonts`. Nada de texto todo em maiúsculas.
- **Barra de abas:** `FloatingTabBar`, em vidro escuro flutuante. A aba ativa vira uma pílula lavanda com ícone preenchido e nome, que desliza entre as abas. Telas de aba usam `<Screen tab>`, que reserva espaço para ela e para a área segura, e não têm header nativo (o título vem de `LargeTitle`).
- **Deslizar entre abas:** o layout `(tabs)` usa `TopTabs` (`expo-router/js-top-tabs`: react-native-tab-view sobre o paginador nativo react-native-pager-view) com `tabBarPosition="bottom"` e a nossa barra. Todas as abas ficam montadas (`lazy: false`). Não coloque gestos horizontais (carrossel, arrastar para apagar) direto numa tela de aba: eles disputam o gesto com o paginador.
- **Componentes:** `Surface` (bloco branco) e `ListRow` (linhas agrupadas dentro de `<Surface padded={false}>`), `SegmentedControl`, `Chip`, `DateTile`, `IconBadge`, `ProgressRing`, `FieldInput` (campo do diário editável conforme o tipo: contador, escala em segmentos, chips ou texto), `Button`, `IconButton`, `InfoRow`, `EmptyState`, `SectionHeader`.
- **Movimento:** só em resposta a ações (toque encolhe, dose marcada, troca de aba e de segmento), mais o anel da tela Hoje ao abrir. Use `.get()`/`.set()` nos shared values do Reanimated (a regra do React Compiler no lint proíbe `.value =`).
- **Toque:** `expo-haptics`. Seleção leve em abas e segmentos; sucesso ao marcar dose.
- **Texto na UI:** frases curtas e diretas, verbos no botão ("Registrar o dia", "Tomei"), estado vazio que convida à ação.

## Regras de arquitetura

- **A UI nunca acessa o banco.** Telas não escrevem SQL: chamam funções de `src/repositories/*`, que recebem o `Db` como primeiro argumento e convertem snake_case ↔ camelCase.
- **Carregar dados numa tela:** uma função `load(db)` que junta as consultas (no escopo do módulo, ou em `useCallback` se depender de parâmetro da rota) passada a `useFocusQuery`. Ela roda ao montar (as abas vizinhas aparecem durante o arrasto antes de ganhar foco) e de novo quando a tela ganha foco; depois de gravar, chame `reload()`. `useDb()` dá o banco para as gravações.
- **Editar horários não reescreve o histórico.** `updateMedication` mantém os horários iguais; um horário removido que já tem doses marcadas é encerrado ontem (`ends_on`), e um sem marcações é apagado. Horários novos num remédio já iniciado valem a partir de hoje (`starts_on`). Remédios nunca são apagados: são pausados ou arquivados.
- **Formulários:** react-hook-form + zod, com schema e conversões puras em `src/domain` (ex.: `medicationForm.ts`) e testadas. Use `useWatch`, não `watch` (o lint do React Compiler reclama). Mensagens de erro em pt-BR dizem o que fazer.
- **Diário:** `buildDiarySchema(def)` gera o zod a partir dos campos ativos; `initialDiaryValues` aplica o `carryOver` do registro anterior; `valuesToSave` mantém chaves de campos aposentados. Crises: uma aberta por vez (`startEpisode`/`endEpisode`), e o fim nunca fica antes do início.
- **A doença do diário** vem de `getPrimaryCondition(db)` (primeira de `user_conditions`), nunca de um id fixo.
- **Nada específico de doença fora de `src/conditions/`.** Telas, repositórios e validação leem a `ConditionDefinition`. Se aparecer `bristol` ou `crise` escrito à mão numa tela, está errado.
- **Doses não são gravadas com antecedência.** A tela Hoje calcula as doses do dia com `dosesForDate(schedules, date)` e cruza com `dose_logs`. Só vira linha o que o usuário marcou (`taken` ou `skipped`).
- **O histórico nunca é apagado.** Remédios são pausados ou arquivados, nunca removidos.
- **Datas** ficam em texto ISO 8601 no horário local (`2026-09-30`, `2026-09-30T08:00:00`).
- **Migrações** são versionadas com `PRAGMA user_version` e rodam na abertura do app. Nunca edite uma migração que já foi publicada; crie uma nova.

## Multi-doença

Cada doença é um objeto `ConditionDefinition` em código:

```ts
{
  id: 'rcu',
  name: 'Retocolite ulcerativa',
  episodeLabel: 'crise',
  fields: [
    { key: 'bowel_count', label: 'Evacuações', type: 'count', min: 0, required: true, carryOver: true },
    { key: 'blood', label: 'Sangue', type: 'enum', required: true, carryOver: true,
      options: [{ value: 'none', label: 'Nenhum' }, { value: 'little', label: 'Pouco' }, { value: 'lots', label: 'Muito' }] },
    { key: 'urgency', label: 'Urgência', type: 'scale', min: 0, max: 3, required: true },
    { key: 'pain', label: 'Dor', type: 'scale', min: 0, max: 10, required: true },
    { key: 'bristol', label: 'Escala de Bristol', type: 'scale', min: 1, max: 7 },
    { key: 'fatigue', label: 'Cansaço', type: 'scale', min: 0, max: 3 },
  ],
}
```

- O exemplo acima está resumido; a definição completa fica em `src/conditions/rcu/definition.ts`. Use `getCondition(id)`, `activeFields()` e `formatFieldValue()` de `src/conditions/index.ts`.
- Tipos de campo: `count | scale | enum | text`. Cada tipo tem um componente genérico no formulário.
- `carryOver`: o campo vem preenchido com o valor do registro anterior (requisito D1).
- **A `key` de um campo é permanente.** Nunca renomeie nem reaproveite. Para mudar um campo, crie uma chave nova e marque a antiga com `deprecated: true`. Assim o histórico continua legível.

**Para adicionar uma doença:** crie `src/conditions/<id>/definition.ts`, registre em `src/conditions/index.ts` e adicione testes do schema gerado. Não precisa de migração.

## Modelo de dados

| Tabela | Colunas |
|---|---|
| `user_conditions` | `condition_id` TEXT PK, `active`, `added_at`. A `rcu` é inserida na primeira migração. |
| `medications` | `id`, `condition_id` (opcional), `name`, `dose` (texto livre), `form` (tablet, suppository, enema, injection, infusion, other), `notes`, `status` (active, paused, archived), `start_date`, `end_date` (opcional), `created_at`. |
| `medication_schedules` | `id`, `medication_id`, `frequency` (daily ou interval), `interval_days` (só para interval, ex.: 14 ou 56), `time_of_day` ("08:00"), `notification_id` (não usado: os ids de notificação são calculados), `starts_on` e `ends_on` (validade do horário, migração 2). |
| `dose_logs` | `id`, `schedule_id`, `scheduled_for`, `status` (taken ou skipped), `taken_at`. `UNIQUE(schedule_id, scheduled_for)`. |
| `diary_entries` | `id`, `condition_id`, `date`, `values_json` (validado pelo zod da definição), `notes`. `UNIQUE(condition_id, date)`: um registro por dia, e salvar de novo atualiza o mesmo. Consultas usam `json_extract`. |
| `episodes` | `id`, `condition_id`, `start_date`, `end_date` (NULL = em andamento), `notes`. |
| `appointments` | `id`, `condition_id` (opcional), `datetime`, `type` (consultation, exam, infusion), `professional`, `location`, `notes`, `remind_1d`, `remind_2h` (padrão 1). |
| `doctor_questions` | `id`, `appointment_id` (NULL = ainda sem consulta), `question`, `answer`, `asked` (padrão 0). |

No banco as colunas são snake_case; os tipos em `src/domain/types.ts` são camelCase. Os repositórios fazem a conversão.

## Notificações

Todas são locais (expo-notifications), sem servidor de push. O banco é a única fonte de verdade.

- **Só gatilhos de data única (`DATE`)**, nunca `DAILY`: um gatilho que se repete não sabe de pausa, término, horário encerrado nem de dose já marcada, e não permite cancelar uma ocorrência só.
- **`planNotifications` (`src/notifications/plan.ts`) é pura e testada:** percorre os próximos 30 dias com `dosesForDate` (a mesma fonte da tela Hoje), pula doses já marcadas e passadas, soma os avisos de consulta (1 dia e 2 horas antes) e ordena por data.
- **Orçamento:** o iOS guarda até 64 notificações pendentes; agendamos no máximo 60. Se estourar, as mais próximas ficam e a última vaga vira "Seus lembretes estão acabando, abra o app".
- **Identificadores calculados:** `dose:<scheduleId>@<scheduledFor>`, `appt:<id>:1d`, `appt:<id>:2h`, `renew`. Não guarde ids no banco.
- **`rescheduleAll(db)`** cancela tudo e agenda o plano, numa fila para chamadas seguidas não se atropelarem. Chame depois de **qualquer** gravação em remédios, doses ou consultas, e ele também roda ao abrir o app e ao voltar ao primeiro plano (`NotificationsBridge` em `app/_layout.tsx`), o que avança a janela.
- **Permissão:** `askForRemindersIfNeeded()` explica o motivo antes do pedido do sistema, ao salvar remédio ou consulta com lembrete. Negada, a tela Hoje mostra um aviso com botão para `Linking.openSettings()`.
- **Toque na notificação** abre `data.url` (Hoje ou a consulta).
- **Onde testar:** notificações locais funcionam no Expo Go (a restrição do Expo Go é push no Android), mas lá a permissão e o nome exibido são os do Expo Go. Valide o comportamento final num build de desenvolvimento. Na web, o módulo não faz nada.

## Telas

| Aba | Rota | Conteúdo |
|---|---|---|
| Hoje | `/(tabs)/index` | Doses do dia com botão "tomei", atalho para o registro do dia, próxima consulta |
| Hoje | `/diary/[date]` | Formulário do dia (gerado pela definição) e botão de crise |
| Remédios | `/(tabs)/meds` | Remédios ativos, pausados e arquivados |
| Remédios | `/meds/[id]` | Detalhe com editar, pausar, reativar e arquivar |
| Remédios | `/meds/form` | Modal de cadastro; com `?id=` edita |
| Diário | `/(tabs)/diary` | Lista de dias, crises destacadas, adesão de 7 e 30 dias |
| Consultas | `/(tabs)/appointments` | Consultas próximas e passadas |
| Consultas | `/appointments/[id]` | Dados, lembretes, perguntas e respostas, editar e apagar |
| Consultas | `/appointments/form` | Modal de cadastro; com `?id=` edita |
| — | `/onboarding` | Introdução em 4 páginas, só enquanto não foi vista |
| — | `/about` | Sobre: aviso médico, privacidade, lembretes, rever introdução, dados de exemplo (dev) |

A tela Hoje é a prioridade: o usuário abre o app, marca o remédio e registra o dia sem trocar de aba.

## Escopo

**Regra de ouro:** ideia nova vai para o roadmap do README, não para o MVP.

Fora do MVP: estoque, desmame automático, busca na lista da ANVISA, gráficos, alimentos, exames, anexos, relatório em PDF, login, nuvem, Android e integração com o calendário.

## Testes

Jest, em três camadas:

- **Funções puras** (`src/domain`, `src/conditions`): `dosesForDate`, `applyDoseLogs`, `adherenceRatio`, formatação de datas, definições de doença e, na etapa 5, `buildDiarySchema`.
- **Migrações e repositórios** rodam contra SQLite de verdade em memória: `createMigratedDb()` de `src/testing/testDb.ts` (better-sqlite3). Todo repositório novo ganha teste aí.
- As telas não têm teste automatizado; confira no aparelho.

## Dados de desenvolvimento

Em modo de desenvolvimento, a tela **Sobre** (ícone (i) no painel da tela Hoje) tem a seção "Desenvolvimento" com "Carregar dados de exemplo" (troca tudo por um mês de dados fictícios, com datas relativas a hoje) e "Apagar todos os dados". O código está em `src/db/devData.ts` e não aparece em builds de produção (`__DEV__`). Atenção: "Carregar" apaga os registros reais do aparelho.

## Introdução e publicação

- **Introdução:** `app_settings.onboarding_completed_at` (migração 3) decide, no `AppNavigator` de `app/_layout.tsx`, entre a introdução e o app via `Stack.Protected`. Toda tela nova do app entra no grupo `guard={onboarded}`.
- **Marca:** `src/components/AppMark.tsx` desenha em vetor o mesmo símbolo de `assets/icon.png`. Os PNGs de ícone e splash foram gerados a partir desse SVG; se o desenho mudar, gere os dois de novo.
- **Loja:** `eas.json` (perfis development, preview, production), `ios.bundleIdentifier` `com.gustagabe.rcu`, `docs/privacidade.md` e `docs/app-store.md`. Textos de privacidade dizem que o app **não envia** dados; não prometa que eles "nunca saem do aparelho" (backups do iPhone podem incluí-los).

## Saúde e privacidade

- O app **registra e organiza** informações. Não recomenda doses nem sugere diagnósticos. Nenhum texto da UI pode sugerir conduta médica.
- Dados de saúde são dados pessoais sensíveis pela LGPD. Não adicione rede, analytics, crash reporting nem nuvem sem uma decisão explícita.

## Convenções

- Código, identificadores e valores no banco em inglês. Textos da UI em pt-BR.
- Commits pequenos, de preferência um por etapa ou história (M1, D1…).
