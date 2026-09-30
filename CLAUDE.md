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
- Ícones: `@expo/vector-icons` (Ionicons)
- UI com componentes próprios e `StyleSheet`. Não adicione biblioteca de UI no MVP.

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
  meds/[id].tsx          # id = "new" para criar
  diary/[date].tsx
  appointments/[id].tsx
src/
  db/                    # client.ts (abre o banco), migrations.ts
  repositories/          # medications.ts, diary.ts, appointments.ts, conditions.ts
  conditions/            # definições por doença
    types.ts             # ConditionDefinition, FieldDefinition
    index.ts             # registro das doenças disponíveis
    rcu/definition.ts
  domain/
    types.ts             # tipos do modelo de dados (camelCase)
    labels.ts            # rótulos pt-BR dos enums
    dates.ts             # chaves ISO e formatação pt-BR
    format.ts            # descrição de horários, dias de crise, percentuais
    schedule.ts          # dosesForDate(schedules, date), função pura
    adherence.ts         # % de doses tomadas em 7 e 30 dias
    diarySchema.ts       # buildDiarySchema(def) gera o zod a partir da definição
  notifications/scheduler.ts   # rescheduleAll()
  components/            # Screen, Card, Button, Text, InfoRow, SectionHeader, EmptyState
  mocks/data.ts          # TEMPORÁRIO: dados falsos da etapa 2, removidos na etapa 3
  theme/                 # cores, espaçamentos, fontes
```

`@/` é alias para `src/` (ex.: `import { Card } from '@/components/Card'`). Ainda não existem, e entram nas etapas 3 a 6: `db/`, `repositories/`, `notifications/`, `schedule.ts`, `adherence.ts` e `diarySchema.ts`.

## Regras de arquitetura

- **A UI nunca acessa o banco.** Telas chamam funções de `src/repositories/*`.
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
| `medication_schedules` | `id`, `medication_id`, `frequency` (daily ou interval), `interval_days` (só para interval, ex.: 14 ou 56), `time_of_day` ("08:00"), `notification_id`. |
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
| Remédios | `/meds/[id]` | Cadastro e edição |
| Diário | `/(tabs)/diary` | Lista de dias, crises destacadas, adesão de 7 e 30 dias |
| Consultas | `/(tabs)/appointments` | Consultas próximas e passadas |
| Consultas | `/appointments/[id]` | Dados, lembretes e perguntas para o médico |

A tela Hoje é a prioridade: o usuário abre o app, marca o remédio e registra o dia sem trocar de aba.

## Escopo

**Regra de ouro:** ideia nova vai para o roadmap do README, não para o MVP.

Fora do MVP: estoque, desmame automático, busca na lista da ANVISA, gráficos, alimentos, exames, anexos, relatório em PDF, login, nuvem, Android e integração com o calendário.

## Testes

Jest, começando pelas funções puras: `dosesForDate` (diário, intervalo, datas de início e fim, status pausado), cálculo de adesão e `buildDiarySchema` para cada doença registrada.

## Saúde e privacidade

- O app **registra e organiza** informações. Não recomenda doses nem sugere diagnósticos. Nenhum texto da UI pode sugerir conduta médica.
- Dados de saúde são dados pessoais sensíveis pela LGPD. Não adicione rede, analytics, crash reporting nem nuvem sem uma decisão explícita.

## Convenções

- Código, identificadores e valores no banco em inglês. Textos da UI em pt-BR.
- Commits pequenos, de preferência um por etapa ou história (M1, D1…).
