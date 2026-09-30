# Ficha da App Store (rascunho)

Textos e respostas para preencher no App Store Connect. Revise antes de enviar: valores e regras da Apple mudam.

## Identificação

| Campo | Valor |
|---|---|
| Nome | App RCU |
| Subtítulo (até 30 caracteres) | Remédios, sintomas e consultas |
| Bundle ID | `com.gustagabe.rcu` (definido em `app.json`; confirme antes do primeiro build) |
| Categoria principal | Medicina |
| Categoria secundária | Saúde e fitness |
| Idioma principal | Português (Brasil) |
| Preço | Gratuito |

## Texto promocional (até 170 caracteres)

Lembretes de remédios, diário de sintomas em 30 segundos e consultas organizadas. Tudo no seu celular, sem conta e sem enviar seus dados.

## Descrição

O App RCU ajuda quem convive com retocolite ulcerativa a manter o tratamento em dia.

REMÉDIOS NA HORA CERTA
Cadastre seus remédios com a dose da receita e os horários: todo dia, ou a cada tantos dias ou semanas, como nas infusões. O app avisa na hora de cada dose, mesmo fechado e sem internet. Marque "Tomei" com um toque e acompanhe a adesão dos últimos 7 e 30 dias.

DIÁRIO EM MENOS DE 30 SEGUNDOS
Registre evacuações, sangue, urgência, dor, escala de Bristol e cansaço. O app já traz os valores do dia anterior: é só ajustar o que mudou. Marque o início e o fim das crises e veja os dias destacados no histórico.

CONSULTAS SEM ESQUECER NADA
Guarde consultas, exames e infusões, com lembretes um dia e duas horas antes. Anote as dúvidas ao longo do mês, marque o que perguntou e registre o que o médico respondeu.

SEUS DADOS SÃO SEUS
Sem conta, sem servidor, sem anúncios e sem rastreamento. Tudo fica guardado no seu aparelho.

IMPORTANTE
O App RCU registra e organiza informações. Ele não recomenda doses, não faz diagnósticos e não substitui a orientação do seu médico.

## Palavras-chave (até 100 caracteres, separadas por vírgula)

retocolite,colite,DII,crohn,remédio,lembrete,diário,sintomas,consulta,adesão

## URLs

| Campo | Valor |
|---|---|
| Política de privacidade | Publicar `docs/privacidade.md` numa página pública (ver README) e colar o link aqui |
| Suporte | Mesma página, ou um e-mail de contato |

## Privacidade do app (rótulo de privacidade)

- **Pergunta: "Você ou seus parceiros coletam dados deste app?"** Resposta: **Não, não coletamos dados deste app.**
- Motivo: nada é enviado para fora do aparelho. Dados que ficam só no dispositivo não contam como coletados para a Apple.

## Classificação etária

Responda "Nenhum" a todos os itens do questionário. O app contém informações médicas de referência organizadas pelo próprio usuário, sem conteúdo médico gerado pelo app.

## Criptografia (export compliance)

`ios.config.usesNonExemptEncryption` está `false` no `app.json`: o app não usa criptografia além da do sistema. O App Store Connect não deve perguntar sobre isso a cada build.

## Notas para a revisão da Apple

O App RCU é um app pessoal de organização de saúde, 100% offline, sem login. Para ver as telas com dados, cadastre um remédio pela aba Remédios (botão +) e registre o dia pela tela Hoje. O app não dá orientação médica; o aviso aparece na introdução e na tela Sobre (ícone (i) no topo da tela Hoje).

## Capturas de tela

A Apple exige capturas do iPhone de 6,9" (1320 × 2868 ou 2868 × 1320) e aceita as de 6,5". Sugestão de sequência, com dados de exemplo (Sobre, Desenvolvimento, "Carregar dados de exemplo", num build de desenvolvimento):

1. Tela Hoje com doses marcadas e o anel de progresso
2. Registro do dia
3. Diário com adesão e dias de crise
4. Detalhe de consulta com perguntas
5. Introdução, página "Tudo fica no seu celular"
