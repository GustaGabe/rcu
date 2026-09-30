# CLAUDE.md

Guia para o Claude Code trabalhar neste repositório.

## O projeto

App pessoal para acompanhar uma doença crônica: tomar os remédios na hora, registrar sintomas em menos de 30 segundos e não perder consultas. O MVP é para **retocolite ulcerativa (RCU)**, mas a arquitetura já aceita várias doenças. Funciona **offline e sem servidor**: todos os dados ficam no celular.

A especificação original está em `App RCU — Documentação do MVP.pdf`. Quando este arquivo e o PDF divergirem, vale este arquivo: os desvios são intencionais e estão marcados com **[desvio do PDF]**.

## Stack

- Expo (SDK mais recente) + TypeScript em modo `strict`
- Expo Router (rotas por arquivo, abas e pilhas)
- expo-sqlite (banco local) e expo-notifications (lembretes locais)
- react-hook-form + zod (formulários com validação tipada)
- date-fns com locale pt-BR
- UI com componentes próprios e `StyleSheet`. Não adicione biblioteca de UI no MVP.

## Comandos

> O projeto ainda não foi criado (etapa 1 do plano). Estes são os comandos previstos. Atualize esta seção quando os scripts existirem.

```bash
npx expo start                              # dev server (Expo Go no iPhone)
npm test                                    # Jest
npm run lint                                # ESLint
npx tsc --noEmit                            # checagem de tipos
eas build -p ios --profile development      # build de dev (necessário para testar notificações)
eas build -p ios --profile production
eas submit -p ios
```

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
  conditions/            # [desvio do PDF] definições por doença
    types.ts             # ConditionDefinition, FieldDefinition
    index.ts             # registro das doenças disponíveis
    rcu/definition.ts
  domain/
    types.ts
    schedule.ts          # dosesForDate(schedules, date), função pura
    adherence.ts         # % de doses tomadas em 7 e 30 dias
    diarySchema.ts       # buildDiarySchema(def) gera o zod a partir da definição
  notifications/scheduler.ts   # rescheduleAll()
  components/            # botões, cards, campos genéricos (contador, escala, chips)
  theme/                 # cores, espaçamentos, fontes
```

## Regras de arquitetura

- **A UI nunca acessa o banco.** Telas chamam funções de `src/repositories/*`.
- **Nada específico de doença fora de `src/conditions/`.** Telas, repositórios e validação leem a `ConditionDefinition`. Se aparecer `bristol` ou `crise` escrito à mão numa tela, está errado.
- **Doses não são gravadas com antecedência.** A tela Hoje calcula as doses do dia com `dosesForDate(schedules, date)` e cruza com `dose_logs`. Só vira linha o que o usuário marcou (`taken` ou `skipped`).
- **O histórico nunca é apagado.** Remédios são pausados ou arquivados, nunca removidos.
- **Datas** ficam em texto ISO 8601 no horário local (`2026-09-30`, `2026-09-30T08:00:00`).
- **Migrações** são versionadas com `PRAGMA user_version` e rodam na abertura do app. Nunca edite uma migração que já foi publicada; crie uma nova.

## Multi-doença [desvio do PDF]

Cada doença é um objeto `ConditionDefinition` em código:

```ts
{
  id: 'rcu',
  name: 'Retocolite ulcerativa',
  episodeLabel: 'crise',
  fields: [
    { key: 'bowel_count', label: 'Evacuações', type: 'count', min: 0, required: true, carryOver: true },
    { key: 'blood', label: 'Sangue', type: 'enum', options: ['none', 'little', 'lots'], required: true },
    { key: 'urgency', label: 'Urgência', type: 'scale', min: 0, max: 3, required: true },
    { key: 'pain', label: 'Dor', type: 'scale', min: 0, max: 10, required: true },
    { key: 'bristol', label: 'Escala de Bristol', type: 'scale', min: 1, max: 7 },
    { key: 'fatigue', label: 'Cansaço', type: 'scale', min: 0, max: 3 },
  ],
}
```

- Tipos de campo: `count | scale | enum | text`. Cada tipo tem um componente genérico no formulário.
- `carryOver`: o campo vem preenchido com o valor do registro anterior (requisito D1).
- **A `key` de um campo é permanente.** Nunca renomeie nem reaproveite. Para mudar um campo, crie uma chave nova e marque a antiga com `deprecated: true`. Assim o histórico continua legível.

**Para adicionar uma doença:** crie `src/conditions/<id>/definition.ts`, registre em `src/conditions/index.ts` e adicione testes do schema gerado. Não precisa de migração.

## Modelo de dados

| Tabela | Observação |
|---|---|
| `user_conditions` | [desvio] `condition_id` TEXT PK, `active`, `added_at`. A `rcu` é inserida na primeira migração. |
| `medications` | Igual ao PDF, mais `condition_id` opcional. `form`: tablet, suppository, enema, injection, infusion, other. `status`: active, paused, archived. |
| `medication_schedules` | Igual ao PDF. `frequency`: daily ou interval (com `interval_days`). `time_of_day` "08:00". `notification_id`. |
| `dose_logs` | Igual ao PDF. `UNIQUE(schedule_id, scheduled_for)`, `status` taken ou skipped, `taken_at`. |
| `diary_entries` | [desvio] `condition_id`, `date`, `values_json` (validado pelo zod da definição), `notes`. `UNIQUE(condition_id, date)`: um registro por dia, e salvar de novo atualiza o mesmo. Consultas usam `json_extract`. |
| `episodes` | [desvio] Substitui `flares`: `condition_id`, `start_date`, `end_date` (NULL = em andamento), `notes`. |
| `appointments` | Igual ao PDF, mais `condition_id` opcional. `type`: consultation, exam, infusion. Colunas `remind_1d` e `remind_2h`. |
| `doctor_questions` | Igual ao PDF. `appointment_id` NULL = ainda sem consulta. `asked`, `answer`. |

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
