# App RCU

App para quem convive com uma doença crônica: tomar os remédios na hora certa, registrar sintomas em menos de 30 segundos e não perder consultas. A primeira versão é feita para **retocolite ulcerativa (RCU)**, e a estrutura já está pronta para receber outras doenças.

Todos os dados ficam no celular. Não há conta, servidor nem nuvem.

> ⚠️ O app só organiza informações. Ele **não dá orientação médica**, não recomenda doses e não faz diagnósticos. Converse sempre com o seu médico.

## Por que existe

O tratamento da RCU combina remédios com esquemas diferentes: diários, semanais, infusões a cada X semanas e desmame de corticoide. Os sintomas mudam de um dia para o outro, e na consulta é difícil lembrar como foi o último mês.

Objetivos:

- resolver uma dor real do dia a dia, com o próprio desenvolvedor como primeiro usuário;
- aprender React Native na prática (navegação, formulários, listas, persistência e notificações);
- publicar o primeiro app, começando pela App Store.

**Critério de sucesso do MVP:** usar o app todos os dias por 30 dias seguidos, sem precisar de outra ferramenta para lembretes ou anotações.

## Funcionalidades do MVP

### Medicações

- **M1. Cadastrar medicação:** nome, dose em texto livre (ex.: "2 comprimidos de 800 mg"), forma (comprimido, supositório, enema, injeção, infusão ou outro) e observações. A frequência pode ser diária (um ou mais horários) ou a cada N dias/semanas. Data de início obrigatória, data de término opcional. Dá para editar, pausar e arquivar sem perder o histórico.
- **M2. Lembrete:** notificação local no horário, com nome e dose. Funciona com o app fechado e sem internet.
- **M3. Registrar dose:** na tela Hoje, cada dose aparece como pendente, tomada ou pulada. Um toque em "Tomei" marca como tomada; marcou sem querer, um toque no selo verde (com o ícone de desfazer) desmarca. Um toque longo na dose permite pular. O histórico mostra a adesão dos últimos 7 e 30 dias.

### Diário de sintomas

- **D1. Registrar o dia:** um registro por dia, editável, com os valores do dia anterior já preenchidos. Na RCU os campos são: evacuações, sangue (nenhum, pouco, muito), urgência (0–3), dor (0–10), escala de Bristol (1–7), cansaço (0–3) e uma nota livre.
- **D2. Marcar crise:** o botão "estou em crise" abre uma crise, e "crise encerrou" fecha.
- **D3. Histórico:** lista do dia mais recente para o mais antigo, com os dias de crise destacados.

### Consultas

- **C1. Agendar:** data e hora, tipo (consulta, exame, infusão), profissional, local e observações. Lembrete 1 dia antes e/ou 2 horas antes.
- **C2. Perguntas para o médico:** lista de dúvidas ligada à próxima consulta, com checkbox de "perguntei" e espaço para anotar a resposta.

## Pensado para várias doenças

Os campos do diário e o nome do episódio (ex.: "crise") não ficam fixos nas telas. Cada doença é uma **definição** em `src/conditions/<doença>/definition.ts` que lista seus campos: tipo, faixa de valores e se é obrigatório. O formulário e a validação são gerados a partir dela. Medicações, consultas, lembretes e adesão são iguais para qualquer doença.

Para adicionar uma doença nova, basta criar a definição e registrá-la, sem mexer no banco. Os detalhes estão no [CLAUDE.md](CLAUDE.md).

## Stack

| Camada | Escolha |
|---|---|
| Framework | Expo (SDK mais recente) + TypeScript |
| Navegação | Expo Router |
| Banco | expo-sqlite (local, offline) |
| Notificações | expo-notifications (locais) |
| Formulários | react-hook-form + zod |
| Datas | date-fns (pt-BR) |
| UI | Componentes próprios com StyleSheet, Reanimated, expo-blur e expo-haptics |
| Fontes | Bricolage Grotesque e Instrument Sans |

## Estrutura

```
app/                 # telas (Expo Router): abas Hoje, Remédios, Diário e Consultas
src/
  db/                # conexão e migrações do SQLite
  repositories/      # única camada que acessa o banco
  conditions/        # definições por doença (rcu/ é a primeira)
  domain/            # regras puras: doses do dia, adesão, schema do diário
  notifications/     # agendamento de lembretes
  components/
  theme/
```

## Como rodar

Pré-requisitos: [nvm](https://github.com/nvm-sh/nvm) com Node 24 LTS e o app **Expo Go** no iPhone.

```bash
nvm use                 # usa a versão do .nvmrc
npm install
npm run start:tunnel    # escaneie o QR code com a câmera do iPhone
```

O `start:tunnel` é necessário quando o projeto roda no WSL2, porque o iPhone não enxerga o IP do WSL na rede local. Fora do WSL, `npm start` basta.

Checagens:

```bash
npm test                # Jest
npm run lint            # ESLint
npm run typecheck       # TypeScript
```

Na primeira abertura aparece a introdução, e depois o app começa vazio. Para ver as telas com dados, toque no **(i)** do painel roxo da tela Hoje para abrir a tela Sobre e, em "Desenvolvimento", escolha "Carregar dados de exemplo" (só existe em modo de desenvolvimento, e substitui o que houver no aparelho). Na mesma tela, "Ver a introdução de novo" mostra a introdução outra vez.

### Build de desenvolvimento

No Expo Go, lembretes funcionam, mas aparecem com o nome e a permissão do próprio Expo Go. Para testar o app como ele vai para a loja, com ícone, splash e notificações do App RCU, use um build de desenvolvimento (exige a conta Apple Developer):

```bash
npm install -g eas-cli
eas login
eas init                                   # liga o projeto à sua conta Expo
eas device:create                          # registra o iPhone
eas build -p ios --profile development     # instale pelo link/QR que o EAS mostrar
npm run start:dev                          # dev server para o build de desenvolvimento
```

`npm run start:tunnel` continua abrindo no Expo Go.

## Plano de desenvolvimento

Em ritmo de estudo (cerca de 1 hora por dia), são de 6 a 10 semanas. Cada etapa termina com algo funcionando no celular.

- [x] **1. Setup:** `create-expo-app`, TypeScript, ESLint, Git e GitHub, rodando no Expo Go
- [x] **2. Navegação com telas falsas:** quatro abas e telas empilhadas com dados fixos
- [x] **3. Banco de dados:** cliente, migrações e repositórios; os dados fixos passam a vir do SQLite. Adiantados daqui: `dosesForDate`, o botão "Tomei" gravando no banco e o cálculo de adesão
- [x] **4. Medicações:** cadastro e edição com validação, pausar, reativar e arquivar, pular ou desmarcar doses. **A partir daqui, usar o app de verdade.**
- [x] **5. Diário e crises:** formulário gerado pela definição da doença e botões de crise
- [x] **6. Consultas e notificações:** CRUD, perguntas e respostas, lembretes locais de doses e consultas com `rescheduleAll()`. Falta validar num build de desenvolvimento
- [x] **7. Polimento:** introdução, tela Sobre, ícone, splash, política de privacidade, ficha da loja e configuração do EAS
- [ ] **7b. Publicação:** conta Apple Developer, build de produção, TestFlight e envio para revisão

## Publicação (iOS)

A primeira versão sai só para iOS, pela App Store, com o EAS Build. Não é preciso ter um Mac. O que já está pronto no projeto:

- ícone, splash e nome do app no `app.json`;
- `ios.bundleIdentifier` = `com.gustagabe.rcu` (troque antes do primeiro build se preferir outro: depois de publicado, não muda);
- `ios.config.usesNonExemptEncryption: false`, para pular a pergunta de criptografia;
- `eas.json` com os perfis `development`, `preview` e `production` (versão de build controlada pelo EAS, com incremento automático);
- política de privacidade em [`docs/privacidade.md`](docs/privacidade.md) e rascunho da ficha em [`docs/app-store.md`](docs/app-store.md).

Passos que dependem das suas contas:

1. Criar a conta Apple Developer como pessoa física (cerca de US$ 99 por ano).
2. **Publicar a política de privacidade** numa URL pública. O GitHub Pages de repositório privado exige plano pago, então as opções são: um repositório público só com a política, um Gist público ou qualquer página estática. Cole a URL na ficha.
3. `eas login` e `eas init`.
4. Criar o app no App Store Connect com o bundle identifier `com.gustagabe.rcu`.
5. `eas build -p ios --profile production` e depois `eas submit -p ios`. O build aparece no TestFlight para testar sem revisão.
6. Preencher a ficha com os textos de `docs/app-store.md`, as capturas de tela e o rótulo de privacidade ("não coletamos dados").
7. Enviar para revisão.

Valores e regras da Apple mudam, então confira as páginas oficiais antes de começar.

## Roadmap

| Versão | Funcionalidade | Ferramenta ou API |
|---|---|---|
| v2 | Alimentos que fazem mal e diário alimentar | Open Food Facts, tabela TACO |
| v2 | Exames com gráfico da calprotectina | victory-native (ou similar) |
| v2 | Relatório do mês em PDF | expo-print, expo-sharing |
| v2 | Estoque de remédio e autocomplete de nomes | CSV de medicamentos da ANVISA |
| v2 | Novas doenças além da RCU | Definições em `src/conditions/` |
| v3 | Sono e passos cruzados com sintomas | HealthKit, Health Connect |
| v3 | Backup e sincronização | Supabase |
| v3 | Banheiros próximos | Overpass API (OpenStreetMap) |
| — | Android | Mesmo código, com build EAS |

## Privacidade

Dados de saúde são dados pessoais sensíveis pela LGPD. No MVP o app não envia nada para fora do aparelho (os backups do próprio iPhone podem incluir os dados, como em qualquer app). A política completa está em [`docs/privacidade.md`](docs/privacidade.md). Se um dia houver nuvem, tudo isso precisa ser revisto.

Padrões entre alimentos e sintomas são pistas para conversar com o gastroenterologista, não conclusões.
