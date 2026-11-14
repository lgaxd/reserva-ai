# ReservaAí

App de **reserva de áreas comuns de condomínio** (salão de festas, churrasqueira, quadra...), feito em **React Native (Expo)** com **Firebase Authentication** e **Cloud Firestore**.

Projeto do **Checkpoint 3** da disciplina *Mobile Application Development*, turma 2TDSPX, Análise e Desenvolvimento de Sistemas, FIAP.

## Integrante

| Nome | RM |
|---|---|
| Lucas Grillo Alcântara | 561413 |

## Contas para teste

Contas de demonstração no projeto Firebase `reservaai-97f09`, que já tem as 3 áreas de exemplo cadastradas:

| Perfil | E-mail | Senha |
|---|---|---|
| Síndico | `sindico@email.com` | `Senha@12345` |
| Morador | `morador@email.com` | `Senha@12345` |

> O app já vem configurado para este projeto: basta `npm install` e `npx expo start`, sem precisar de `.env`. Para usar o seu próprio projeto Firebase, siga a seção 2.

---

## 1. Proposta do app

### O problema

Na maioria dos condomínios, as reservas de áreas comuns ainda são feitas em um caderno na portaria ou em grupos de WhatsApp. Por isso:

- duas famílias reservam o mesmo horário e o conflito só aparece no dia;
- poucos moradores ocupam todos os fins de semana;
- ninguém sabe o que está livre sem ir até a portaria;
- o síndico não tem uma visão clara da agenda e não consegue avisar quando uma área entra em manutenção.

### A solução

O **ReservaAí** mostra a disponibilidade de cada área **em tempo real**. Cada turno só pode ter uma reserva, e as regras do condomínio (limite por mês, antecedência, prazo de cancelamento) são aplicadas automaticamente, inclusive no servidor, pelas regras de segurança do Firestore. O morador recebe um **lembrete no celular** na véspera da reserva.

### Perfis de usuário

| Perfil | Como é criado | O que faz |
|---|---|---|
| **Morador** | Cadastro pelo próprio app (nome, e-mail, senha, bloco e apartamento) | Vê as áreas, reserva turnos, acompanha e cancela as próprias reservas |
| **Síndico** | Um morador promovido manualmente no Console do Firebase (`role: "sindico"`) | Vê a agenda de todas as reservas, cancela qualquer reserva informando o motivo, cria, edita e desativa áreas e seus turnos |

As regras de segurança impedem que alguém se cadastre já como síndico.

### Fluxos

**Autenticação**
1. Login com e-mail e senha, com mensagens de erro em português.
2. Cadastro de morador. A conta é criada no Auth e o perfil em `users/{uid}`. Se o perfil não puder ser gravado, a conta é apagada.
3. Esqueci a senha: o Firebase envia o e-mail de redefinição.
4. A sessão fica salva no aparelho (AsyncStorage). Ao abrir o app, o usuário vai direto para a área do seu perfil.

**Morador**
1. **Áreas**: lista as áreas ativas e mostra quantas reservas do mês já foram usadas.
2. **Detalhe da área**: faixa com as datas de amanhã até 30 dias à frente. Para a data escolhida, os turnos aparecem como *Livre*, *Ocupado* ou *Sua reserva*, atualizados em tempo real.
3. **Reservar**: depois da confirmação, a reserva é gravada em uma transação e o lembrete local é agendado.
4. **Minhas reservas**: próximas reservas (com botão de cancelar até 24 h antes) e histórico (realizadas e canceladas, com o motivo quando foi o síndico quem cancelou).
5. **Perfil**: dados da conta, resumo das regras e botão de sair.

**Síndico**
1. **Agenda**: escolhe uma data (hoje até 30 dias à frente) e vê, em tempo real, todas as reservas daquele dia, com o morador, o bloco e o apartamento.
2. **Cancelar reserva**: informa o motivo, que o morador verá no histórico. A cota do morador é devolvida.
3. **Áreas**: cria e edita áreas (nome, descrição, capacidade e turnos), além de ativar ou desativar. Uma área desativada não aceita reservas novas.
4. **Perfil** e sair.

### Regras de negócio

| Regra | Onde é garantida |
|---|---|
| Um turno (área + data + turno) só pode ter **uma** reserva confirmada | ID determinístico `{areaId}_{AAAA-MM-DD}_{turnoId}` + transação + regras |
| Um turno cancelado pode ser reservado de novo | Transação + regras (`update` só permitido se o status atual é `cancelada`) |
| Cada morador pode ter **no máximo 2 reservas por mês** (mês da data reservada) | Contador `users/{uid}/cotas/{AAAA-MM}` atualizado na mesma transação e validado nas regras com `getAfter()` |
| Reservas só de **amanhã até 30 dias** à frente | App; nas regras: `inicio` no futuro e a menos de 31 dias |
| O morador cancela só até **24 h antes** | App + regras (`request.time < inicio - 24h`) |
| O síndico cancela a qualquer momento, **com motivo** (3 a 200 caracteres) | App + regras |
| Área desativada não aceita reservas novas | Transação + regras (`area.ativa == true`) |
| Os dados do morador na reserva (nome, bloco, apartamento) não podem ser falsificados | Regras comparam com `users/{uid}` |
| Turnos de uma área: de 1 a 6, horário `HH:mm`, início antes do fim, sem sobreposição | Validação do formulário; quantidade também nas regras |
| Reservas nunca são apagadas: o cancelamento muda o status, para manter o histórico | Regras (`delete: false`) |

### Cenários tratados

- Dois moradores tentando o mesmo turno ao mesmo tempo: a transação de um deles falha com *"Esse turno acabou de ser reservado por outro morador"* e a tela já mostra o turno como ocupado.
- Cota do mês esgotada: o botão de reservar fica desabilitado e aparece um aviso.
- Área desativada enquanto o morador está na tela: a transação recusa a reserva.
- Cancelamento com menos de 24 h: o botão some e aparece uma explicação.
- Permissão de notificação negada: a reserva é feita mesmo assim e o app avisa que o lembrete não será enviado.
- Reserva cancelada pelo síndico: na próxima vez que o morador abrir *Minhas reservas*, o lembrete daquela reserva é removido do aparelho.
- Sem internet, credenciais erradas, e-mail já cadastrado, permissão negada pelas regras: todos os erros do Firebase são traduzidos (`src/utils/errors.ts`).
- Telas de carregando, erro (com "tentar de novo") e lista vazia em todas as listagens, além de pull-to-refresh.
- Configuração do Firebase incompleta: o app mostra uma tela explicando como configurar o `.env`.

### Telas

| Autenticação | Morador | Síndico |
|---|---|---|
| Login | Áreas | Agenda |
| Cadastro | Detalhe da área / reservar | Áreas (lista) |
| Esqueci a senha | Minhas reservas | Nova / editar área |
| | Perfil | Perfil |

---

## 2. Como rodar

### Pré-requisitos

- Node.js 20 ou superior
- App **Expo Go** no celular (SDK 58), ou um emulador Android / simulador iOS
- Uma conta Google para criar o projeto no Firebase

> **Atalho:** para só testar com as contas acima, rode `npm install` e `npx expo start` e pule para a seção 2.4. As seções 2.1 a 2.3 e 2.5 servem para usar o seu próprio projeto Firebase.

### 2.1 Criar o projeto Firebase

1. Em <https://console.firebase.google.com>, crie um projeto.
2. **Authentication > Método de login**: ative **E-mail/senha**.
3. **Firestore Database**: crie o banco (modo produção, região `southamerica-east1` por exemplo).
4. **Configurações do projeto > Seus apps**: adicione um app **Web** e copie o objeto `firebaseConfig`.

### 2.2 Configurar e instalar

```bash
npm install
cp .env.example .env    # no Windows: copy .env.example .env
```

Preencha o `.env` com os valores do `firebaseConfig`, nas variáveis `EXPO_PUBLIC_FIREBASE_*`.

### 2.3 Publicar as regras de segurança e o índice

Usando a CLI do Firebase:

```bash
npx firebase-tools login
npx firebase-tools use --add          # escolha o projeto criado
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

Outra opção é colar o conteúdo de `firestore.rules` em **Firestore > Regras** e criar o índice composto da coleção `reservas` com `moradorId` (crescente) e `inicio` (decrescente) em **Firestore > Índices**.

### 2.4 Rodar o app

```bash
npx expo start
```

Leia o QR code com o Expo Go (Android) ou com a câmera (iOS).

### 2.5 Criar o primeiro síndico e as áreas de exemplo

1. No app, cadastre uma conta normalmente (ela será criada como morador).
2. No Console, abra **Firestore > users > {uid da conta}** e mude o campo `role` de `morador` para `sindico`.
3. Opcional: preencha `SEED_SINDICO_EMAIL` e `SEED_SINDICO_SENHA` no `.env` com essa conta e rode:

   ```bash
   npm run seed
   ```

   O script cadastra *Salão de Festas*, *Churrasqueira* e *Quadra Poliesportiva* com seus turnos. Também é possível criar áreas pela aba **Áreas** do síndico.
4. Cadastre outra conta para usar como morador.

### 2.6 Testes e verificação

```bash
npm test            # Jest: datas, validações, erros e regras de reserva
npm run typecheck   # TypeScript
```

---

## 3. Conceitos utilizados

### Estrutura do projeto

```
src/
├── app/                      # rotas (expo-router: cada arquivo é uma tela)
│   ├── _layout.tsx           # providers: SafeArea, TanStack Query, AuthContext
│   ├── index.tsx             # ponto de entrada: decide login / morador / síndico
│   ├── (auth)/               # login, cadastro, esqueci-senha
│   ├── (morador)/            # abas: areas/ (index, [id]), minhas-reservas, perfil
│   └── (sindico)/            # abas: agenda, gerenciar-areas/ (index, [id]), conta
├── components/               # Button, Input, Card, Screen, DateStrip, ReservaCard, MotivoModal...
├── config/                   # firebase.ts, queryClient.ts, constants.ts
├── contexts/AuthContext.tsx  # usuário logado + perfil em tempo real
├── hooks/                    # queries.ts (TanStack Query) e useRealtime.ts (onSnapshot)
├── services/                 # ÚNICA camada que fala com Firebase e notificações
├── theme/colors.ts
├── types/
└── utils/                    # dates, validation, errors (funções puras, testadas)
firestore.rules               # regras de segurança
firestore.indexes.json        # índice composto
scripts/seed.mjs              # dados iniciais
__tests__/                    # testes Jest
```

As telas não importam o Firebase diretamente: elas usam **hooks**, os hooks chamam os **services** e os services usam o SDK. Assim, a regra de negócio fica testável sem interface e as telas cuidam só da apresentação.

### Firebase Authentication

- `initializeAuth` com `getReactNativePersistence(AsyncStorage)` mantém o usuário logado entre aberturas do app (`src/config/firebase.ts`).
- `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `sendPasswordResetEmail`, `signOut` e `deleteUser` (desfaz o cadastro se o perfil falhar) estão em `src/services/authService.ts`.
- `onAuthStateChanged` no `AuthContext` avisa o app inteiro sobre login e logout. Ao sair, o cache do TanStack Query é limpo para não vazar dados para o próximo usuário.
- Credenciais vêm do `.env` por meio de variáveis `EXPO_PUBLIC_*`, que o Expo embute no bundle.

### Navegação protegida (expo-router)

- Rotas baseadas em arquivos, com **grupos** `(auth)`, `(morador)` e `(sindico)` que não aparecem na URL.
- `src/app/index.tsx` redireciona com `<Redirect>` conforme o estado: deslogado vai para `/login`, morador para `/areas` e síndico para `/agenda`.
- O layout de `(auth)` manda quem já está logado de volta para o início. Os layouts dos perfis usam o componente `RoleTabs`, que só monta as abas se o `role` bater e impede um morador de abrir telas do síndico (e vice-versa).
- **Tabs** (`expo-router/js-tabs`) para as abas e **Stack** aninhado para lista → detalhe, com rotas dinâmicas `[id]` e `useLocalSearchParams`.

### Cloud Firestore

**Modelo de dados**

| Coleção | Documento | Campos |
|---|---|---|
| `users` | `{uid}` | nome, email, role, bloco, apto, createdAt |
| `users/{uid}/cotas` | `{AAAA-MM}` | total, ultimaReserva |
| `areas` | id automático (ou fixo no seed) | nome, descricao, capacidade, ativa, turnos `{ [turnoId]: {nome, inicio, fim} }`, atualizadaEm |
| `reservas` | `{areaId}_{AAAA-MM-DD}_{turnoId}` | areaId, areaNome, data, turnoId, turnoNome, turnoInicio, turnoFim, inicio (Timestamp), moradorId, moradorNome, bloco, apto, status, canceladaPor, motivo, createdAt, canceladaEm |

**Recursos usados**

- `setDoc`, `updateDoc`, `getDoc`, `getDocs`, `query`, `where`, `orderBy`, `serverTimestamp`, `Timestamp`.
- **ID determinístico**: como o ID da reserva é formado por área + data + turno, só pode existir um documento por turno. Assim não há como gravar duas reservas no mesmo horário.
- **`runTransaction`** (`src/services/reservaService.ts`): lê a área, a reserva e a cota, valida e grava a reserva e o contador juntos (tudo ou nada). Se dois moradores tentarem ao mesmo tempo, o Firestore repete a transação de um deles, que encontra o turno ocupado e falha.
- **Tempo real com `onSnapshot`**: a disponibilidade dos turnos (`useOcupacao`), a agenda do síndico (`useAgenda`) e o perfil do usuário (`AuthContext`) são atualizados sozinhos. As inscrições são encerradas no *cleanup* do `useEffect`.
- **Subcoleção** `users/{uid}/cotas` para o contador mensal.
- **Turnos como map** (e não array): permite às regras verificar `turnoId in area.turnos`.
- **Índice composto** (`firestore.indexes.json`) para "minhas reservas" (`where moradorId` + `orderBy inicio`). As outras consultas usam só igualdade e dispensam índice.

### Regras de segurança (`firestore.rules`)

As regras são a segunda linha de defesa: mesmo alguém chamando a API sem o app não consegue burlar as regras de negócio.

- **Funções auxiliares** (`isSindico()`, `isMorador()`, `textoEntre()`, `mesDaData()`), que usam `get()` para ler o perfil de quem faz a requisição.
- **Validação de esquema**: `keys().hasOnly()` e `hasAll()`, tipos (`is string`, `is int`, `is timestamp`, `is map`) e tamanhos.
- **Cadastro**: só o próprio usuário cria seu perfil, sempre com `role == 'morador'`, e o e-mail precisa ser o do token.
- **Reserva**: o ID precisa bater com área + data + turno, o turno precisa existir na área ativa, os dados do morador são conferidos com o perfil e o horário é checado contra `request.time` (no futuro e a menos de 31 dias).
- **Cota com `getAfter()`**: a reserva só é aceita se, *ao final da mesma transação*, o contador do mês tiver subido exatamente 1 e não passar de 2. O contador, por sua vez, só pode mudar se a reserva indicada em `ultimaReserva` estiver sendo criada (+1) ou cancelada (−1) naquela transação. Assim nenhum dos dois pode ser alterado sozinho.
- **Cancelamento**: `diff().affectedKeys().hasOnly(...)` garante que só status, motivo e autor mudam. O morador só cancela até 24 h antes (`request.time < inicio - duration.value(24, 'h')`); o síndico, a qualquer momento, com motivo.
- `delete` bloqueado em tudo, para preservar o histórico.

### Notificações locais (expo-notifications)

- Recurso nativo do celular, sem servidor: a notificação é agendada no próprio aparelho com gatilho de data (`SchedulableTriggerInputTypes.DATE`) para a véspera às 18h. Se esse horário já passou, ela é agendada para 2 h antes do início.
- Permissão pedida só no momento da primeira reserva. No Android, um canal é criado antes, porque o Android 13+ exige isso.
- O vínculo reserva → notificação fica no AsyncStorage para permitir cancelar o lembrete junto com a reserva. A função `sincronizarLembretes` remove lembretes de reservas canceladas pelo síndico e agenda os que faltam, por exemplo ao entrar em outro celular.
- Notificação **push** de verdade (avisar o morador na hora em que o síndico cancela) exigiria um servidor ou Cloud Functions, e ficou fora do escopo.

### TanStack Query

- `useQuery` para áreas, área, minhas reservas e cota, com cache, `isLoading`, `isError`, `refetch` e pull-to-refresh.
- `useMutation` para reservar, cancelar, salvar e ativar áreas, seguido de `invalidateQueries`, para que as telas relacionadas se atualizem.
- Chaves de cache centralizadas em `keys` (`src/hooks/queries.ts`).
- Divisão de responsabilidades: o **TanStack Query** cuida dos dados lidos sob demanda e o **`onSnapshot`** dos dados que precisam ser vistos ao vivo.

### Hooks do React e componentes

- `useState`, `useEffect` (inscrições e cleanup), `useMemo` (listas derivadas), `useCallback`, `useRef` (foco do campo de senha), `useContext` (via `useAuth`) e `useFocusEffect` do expo-router (recarregar ao voltar para a aba).
- **Hooks customizados**: `useAuth`, `usePerfil`, `useOcupacao`, `useAgenda` e os hooks de query e mutation.
- **Context API** para o estado global de autenticação.
- **Componentes reutilizáveis** com props tipadas (TypeScript): `Button` (variantes e loading), `Input` (label e erro; `ref` como prop, no estilo do React 19), `Card`, `Badge`, `Screen` (SafeArea, KeyboardAvoidingView, ScrollView, RefreshControl), `StateViews`, `DateStrip` (FlatList horizontal), `ReservaCard`, `MotivoModal` (Modal), `ProfileView` e `RoleTabs`.
- `StyleSheet` e um tema central (`src/theme/colors.ts`), `Alert` para confirmações e `Switch`.
- Acessibilidade básica: `accessibilityRole`, `accessibilityLabel` e `accessibilityState` nos elementos interativos.

### Tratamento de erros

- `AppError` com códigos de regra de negócio (`turno-ocupado`, `cota-esgotada`, `prazo-cancelamento`...) lançado pelos services.
- `mensagemDeErro()` converte erros do Firebase Auth, do Firestore e do app em mensagens em português.
- Validação de formulários antes de chamar o Firebase (`src/utils/validation.ts`), com o erro exibido embaixo de cada campo.

### Testes (Jest + jest-expo)

- `__tests__/dates.test.ts`: janela de 30 dias, virada de ano, prazo de 24 h e horário do lembrete.
- `__tests__/validation.test.ts`: login, cadastro, sobreposição de turnos e motivo.
- `__tests__/errors.test.ts`: tradução de erros.
- `__tests__/reservaService.test.ts`: o Firestore é substituído por um banco em memória com `jest.mock`. Cobre turno ocupado, reservar de novo um turno cancelado, cota mensal, área desativada, janela de datas, prazo de cancelamento do morador e cancelamento pelo síndico.

### Limitações conhecidas

- Qualquer usuário logado pode ler as reservas, porque o morador precisa saber quais turnos estão ocupados. O app mostra só "Ocupado" para o morador, mas os campos ficam acessíveis pela API. Uma melhoria seria separar a ocupação em uma coleção pública sem dados pessoais.
- As regras validam que `inicio` está no futuro e dentro de 31 dias, mas não conferem se ele corresponde exatamente à data e ao horário do turno (as regras não têm fuso horário). O app sempre calcula esse valor corretamente.
- As regras de segurança não têm testes automatizados com o Firebase Emulator, que exigiria Java instalado.
