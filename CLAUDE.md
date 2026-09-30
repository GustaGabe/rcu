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
npm run start:tunnel                        # dev server com túnel (necessário no WSL2 para o iPhone achar o PC)
npm start                                   # dev server na rede local
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
    _layout.tsx          # barra de abas
    index.tsx            # Hoje
    meds.tsx
    diary.tsx
    appointments.tsx
  meds/[id].tsx          # detalhe: editar, pausar, reativar, arquivar
  meds/form.tsx          # modal de cadastro (sem id) e edição (?id=)
  diary/[date].tsx
  appointments/[id].tsx
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
    format.ts            # descrição de horários, dias de crise, percentuais
    schedule.ts          # dosesForDate(medications, schedules, date), applyDoseLogs
    adherence.ts         # adherenceRatio: fração das doses previstas que foram tomadas
    diarySchema.ts       # buildDiarySchema(def) gera o zod a partir da definição
  notifications/scheduler.ts   # rescheduleAll()
  components/            # base visual (ver "Design") e FloatingTabBar
    form/                # Field, TextField, OptionGrid, Stepper, DateTimeField, SwitchRow, FieldInput
  hooks/useFocusQuery.ts # carrega dados quando a tela ganha foco
  testing/testDb.ts      # Db sobre better-sqlite3 em memória, só para testes
  theme/                 # tokens: cores, tons, espaçamentos, raios, fontes, tipografia
```

`@/` é alias para `src/` (ex.: `import { Surface } from '@/components/Surface'`). Ainda não existe, e entra na etapa 6: `notifications/`.

## Design

O visual parte do roxo, cor de conscientização das doenças inflamatórias intestinais. Os tokens ficam em `src/theme/index.ts`, e nenhuma tela usa cor, fonte ou tamanho solto.

- **Paleta:** fundo lilás-acinzentado (`canvas`), superfícies brancas sem borda nem sombra, `plum` escuro para o painel da tela Hoje e a barra de abas, `lavender` como destaque sobre o escuro, `violet` para ações. Tons semânticos (`tones`): `sage` = tomado/ok, `rose` = crise, `amber` = pulado/pausado.
- **Tipografia:** use o componente `Text` com `variant` (`display`, `title`, `numeral`, `heading`, `body`, `bodyStrong`, `caption`, `label`). Com fonte própria não use `fontWeight`; o peso vem da família em `fonts`. Nada de texto todo em maiúsculas.
- **Barra de abas:** `FloatingTabBar`, em vidro escuro flutuante. A aba ativa vira uma pílula lavanda com ícone preenchido e nome, que desliza entre as abas. Telas de aba usam `<Screen tab>`, que reserva espaço para ela e para a área segura, e não têm header nativo (o título vem de `LargeTitle`).
- **Componentes:** `Surface` (bloco branco) e `ListRow` (linhas agrupadas dentro de `<Surface padded={false}>`), `SegmentedControl`, `Chip`, `DateTile`, `IconBadge`, `ProgressRing`, `FieldInput` (campo do diário editável conforme o tipo: contador, escala em segmentos, chips ou texto), `Button`, `IconButton`, `InfoRow`, `EmptyState`, `SectionHeader`.
- **Movimento:** só em resposta a ações (toque encolhe, dose marcada, troca de aba e de segmento), mais o anel da tela Hoje ao abrir. Use `.get()`/`.set()` nos shared values do Reanimated (a regra do React Compiler no lint proíbe `.value =`).
- **Toque:** `expo-haptics`. Seleção leve em abas e segmentos; sucesso ao marcar dose.
- **Texto na UI:** frases curtas e diretas, verbos no botão ("Registrar o dia", "Tomei"), estado vazio que convida à ação.

## Regras de arquitetura

- **A UI nunca acessa o banco.** Telas não escrevem SQL: chamam funções de `src/repositories/*`, que recebem o `Db` como primeiro argumento e convertem snake_case ↔ camelCase.
- **Carregar dados numa tela:** uma função `load(db)` que junta as consultas (no escopo do módulo, ou em `useCallback` se depender de parâmetro da rota) passada a `useFocusQuery`. Ela roda de novo quando a tela ganha foco; depois de gravar, chame `reload()`. `useDb()` dá o banco para as gravações.
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
| `medication_schedules` | `id`, `medication_id`, `frequency` (daily ou interval), `interval_days` (só para interval, ex.: 14 ou 56), `time_of_day` ("08:00"), `notification_id`, `starts_on` e `ends_on` (validade do horário, migração 2). |
| `dose_logs` | `id`, `schedule_id`, `scheduled_for`, `status` (taken ou skipped), `taken_at`. `UNIQUE(schedule_id, scheduled_for)`. |
| `diary_entries` | `id`, `condition_id`, `date`, `values_json` (validado pelo zod da definição), `notes`. `UNIQUE(condition_id, date)`: um registro por dia, e salvar de novo atualiza o mesmo. Consultas usam `json_extract`. |
| `episodes` | `id`, `condition_id`, `start_date`, `end_date` (NULL = em andamento), `notes`. |
| `appointments` | `id`, `condition_id` (opcional), `datetime`, `type` (consultation, exam, infusion), `professional`, `location`, `notes`, `remind_1d`, `remind_2h` (padrão 1). |
| `doctor_questions` | `id`, `appointment_id` (NULL = ainda sem consulta), `question`, `answer`, `asked` (padrão 0). |

No banco as colunas são snake_case; os tipos em `src/domain/types.ts` são camelCase. Os repositórios fazem a conversão.

## Notificações

- Todas são locais. Não existe servidor de push.
- `rescheduleAll()` cancela tudo e agenda de novo a partir do banco. Chame na abertura do app e depois de qualquer mudança.
- Remédio diário: gatilho `daily` (hora e minuto). Guarde o id em `medication_schedules.notification_id`.
- Remédio a cada N dias: agende só as ocorrências dos próximos 30 dias (o iOS aceita no máximo 64 notificações pendentes por app).
- Consultas: dois gatilhos de data, 1 dia antes e 2 horas antes.
- Peça a permissão ao cadastrar o primeiro remédio, explicando o motivo. Se ela for negada, mostre um aviso com `Linking.openSettings()`.
- O Expo Go tem limitações com notificações: teste em build de desenvolvimento.

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
| Consultas | `/appointments/[id]` | Dados, lembretes e perguntas para o médico |

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

Em modo de desenvolvimento, um **toque longo no painel roxo da tela Hoje** abre um menu com "Carregar exemplo" (troca tudo por um mês de dados fictícios, com datas relativas a hoje) e "Apagar tudo". O código está em `src/db/devData.ts` e não aparece em builds de produção (`__DEV__`). Atenção: "Carregar exemplo" apaga os registros reais do aparelho.

## Saúde e privacidade

- O app **registra e organiza** informações. Não recomenda doses nem sugere diagnósticos. Nenhum texto da UI pode sugerir conduta médica.
- Dados de saúde são dados pessoais sensíveis pela LGPD. Não adicione rede, analytics, crash reporting nem nuvem sem uma decisão explícita.

## Convenções

- Código, identificadores e valores no banco em inglês. Textos da UI em pt-BR.
- Commits pequenos, de preferência um por etapa ou história (M1, D1…).
