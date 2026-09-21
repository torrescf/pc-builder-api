# 🖥️ PC Builder & Compatibility API

> API RESTful desenvolvida em Node.js e TypeScript para simulação, cálculo dinâmico e montagem de PC Gamers personalizados, com verificação de compatibilidade entre componentes de hardware.

---

##  Funcionalidades Principais

- ** Validador de Compatibilidade de Hardware**
  - **Socket CPU vs. Placa-Mãe:** impede combinações incompatíveis, como AM5 vs. LGA1700.
  - **RAM vs. Placa-Mãe:** verifica compatibilidade entre DDR4/DDR5 e a placa-mãe.
  - **Consumo de Energia vs. Fonte:** calcula o consumo estimado dos componentes e aplica margem de segurança de 20%.

- ** Gestão Dinâmica de Orçamentos**
  - Soma dos componentes + taxa de montagem.
  - Atualização e exclusão de orçamentos.
  - Cada cliente acessa apenas os próprios orçamentos.

- ** Controle de Estoque Transacional**
  - Verifica disponibilidade antes da aprovação.
  - Realiza baixa de estoque dentro de uma transação Prisma.
  - Restaura o estoque quando um orçamento aprovado/concluído é cancelado.

- ** Autenticação e Autorização**
  - JWT.
  - Roles `CUSTOMER` e `ADMIN`.
  - Gerenciamento de componentes restrito a administradores.

- ** Validação de Dados**
  - Schemas Zod para validação e tipagem dos dados recebidos.

- ** Tratamento Global de Erros**
  - Classes de erro personalizadas.
  - Middleware global de erros.
  - `express-async-errors` para tratamento assíncrono sem excesso de `try/catch`.

---

##  Tecnologias Utilizadas

| Tecnologia | Utilização |
|---|---|
| **TypeScript** | Tipagem estática e segurança durante o desenvolvimento |
| **Node.js** | Runtime do backend |
| **Express** | Criação da API REST |
| **PostgreSQL** | Banco de dados relacional |
| **Prisma ORM** | Acesso ao banco, migrations e transações |
| **Zod** | Validação dos dados de entrada |
| **JWT** | Autenticação baseada em tokens |
| **bcrypt** | Hash de senhas |
| **Docker** | Containerização do banco |
| **Docker Compose** | Orquestração do ambiente |
| **tsx** | Execução em desenvolvimento |
| **tsup** | Build para produção |

### Por que essas tecnologias?

- **TypeScript:** escolhido para reduzir erros em desenvolvimento e manter contratos claros entre as camadas.
- **Node.js + Express:** permitem construir uma API REST leve e modular.
- **PostgreSQL:** adequado para os relacionamentos entre usuários, orçamentos, itens e componentes.
- **Prisma:** fornece acesso tipado ao banco, migrations e transações.
- **Zod:** centraliza a validação dos payloads recebidos pela API.
- **JWT:** permite autenticação stateless por tokens.
- **bcrypt:** utilizado para armazenar senhas através de hash.
- **Docker:** facilita a criação de um ambiente PostgreSQL reproduzível.
- **tsx + tsup:** `tsx` simplifica o desenvolvimento e `tsup` gera o build para produção.

---

##  Arquitetura do Projeto

O projeto utiliza uma **arquitetura em camadas**, separando HTTP, regras de negócio, validação e persistência.

```text
src/
├── controllers/    # Interface HTTP (Request / Response)
├── services/       # Regras de negócio, cálculos e compatibilidade
├── middlewares/    # Autenticação JWT, roles e tratamento de erros
├── schemas/        # Schemas Zod para validação
├── helpers/        # Classes de erros customizados
└── lib/            # Instância do Prisma Client
```

### Fluxo de uma requisição

```text
Cliente
   │
   ▼
Route
   │
   ▼
Middleware
   │
   ├── Autenticação JWT
   └── Autorização por Role
   │
   ▼
Controller
   │
   ▼
Schema Zod
   │
   ▼
Service
   │
   ├── Regras de negócio
   ├── Compatibilidade
   ├── Cálculos
   └── Transações
   │
   ▼
Prisma ORM
   │
   ▼
PostgreSQL
```

---

##  Autenticação e Autorização

A API utiliza **JWT** para autenticar os usuários.

Após o login, o token deve ser enviado nas rotas protegidas:

```http
Authorization: Bearer SEU_TOKEN
```

### CUSTOMER

Pode:

- criar orçamentos;
- visualizar seus próprios orçamentos;
- atualizar seus próprios orçamentos;
- excluir seus próprios orçamentos;
- consultar componentes.

### ADMIN

Além das operações de cliente, pode:

- criar componentes;
- atualizar componentes;
- excluir componentes.

A autorização é realizada por middleware baseado em roles.

---

##  Regras de Negócio

### Compatibilidade de CPU e Placa-Mãe

A API compara o socket do processador com o socket da placa-mãe.

```text
CPU: AM5
Placa-Mãe: AM4

→ Incompatível
```

### Compatibilidade de RAM

A geração da memória é comparada com a suportada pela placa-mãe.

```text
RAM: DDR5
Placa-Mãe: DDR4

→ Incompatível
```

### Potência da Fonte

A API soma o consumo estimado dos componentes e aplica margem de segurança de 20%.

```text
Consumo = 500W

Necessidade mínima:
500 × 1,20 = 600W
```

---

##  Controle de Estoque

A aprovação de um orçamento pode alterar o estoque dos componentes.

```text
Orçamento PENDING
       │
       ▼
Solicitação de aprovação
       │
       ▼
Verificação do estoque
       │
       ├── Estoque insuficiente → Erro
       │
       └── Estoque disponível
                │
                ▼
        Baixa no estoque
                │
                ▼
        Orçamento APPROVED
```

O uso de `$transaction` garante que as operações relacionadas sejam tratadas de forma atômica.

---

##  Modelagem do Banco

```text
User
 │
 └──< Budget
          │
          └──< BudgetItem >── Component
```

### User

Representa os usuários da aplicação.

- nome;
- email;
- senha com hash;
- role;
- relacionamento com orçamentos.

### Component

Representa as peças disponíveis.

- nome;
- tipo;
- preço;
- quantidade em estoque;
- socket;
- tipo de RAM;
- consumo em watts;
- potência fornecida pela fonte.

### Budget

Representa um orçamento.

- cliente;
- taxa de montagem;
- valor total;
- status;
- itens;
- usuário responsável.

### BudgetItem

Tabela intermediária entre `Budget` e `Component`.

- orçamento;
- componente;
- quantidade.

---

##  Como Executar o Projeto Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/)
- Docker Compose
- Git

### 1. Clone o repositório

```bash
git clone https://github.com/torrescf/pc-builder-api.git
cd pc-builder-api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
PORT=3000

JWT_SECRET="sua_chave_secreta"

POSTGRES_USER="Seu_User"

POSTGRES_PASSWORD="Sua_Senha"

POSTGRES_PORT=5432

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/pcgamerdb?schema=public"
```

> Não versione o `.env`. Utilize um `.env.example` para documentar as variáveis necessárias.

### 4. Suba o PostgreSQL

```bash
docker compose up -d
```

### 5. Execute as migrations

```bash
npx prisma migrate dev
```

### 6. Popule o banco

```bash
npx prisma db seed
```

### 7. Inicie a aplicação

```bash
npm run start:dev
```

A API estará disponível em:

```text
http://localhost:3000
```

---

##  Scripts

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Produção
npm run start:prod

# Prisma
npx prisma migrate dev
npx prisma db seed
npx prisma studio
```

---

##  Testes e Ferramentas

Durante o desenvolvimento, a API pode ser testada utilizando:

- Postman
- Insomnia
- Prisma Studio

Fluxo básico:

```text
1. Criar usuário
2. Fazer login
3. Obter JWT
4. Consultar componentes
5. Criar orçamento
6. Validar compatibilidade
7. Aprovar orçamento
8. Verificar alteração no estoque
```

---

##  Status do Projeto

**Em desenvolvimento.**

O projeto está sendo utilizado como estudo prático de desenvolvimento backend, arquitetura em camadas, autenticação, autorização, validação de dados, regras de negócio, banco de dados relacional e controle transacional.

---

## Licença

Este projeto está sob a licença MIT.
