# API Checkout Rest e GraphQL

Projeto de Conclusão da Disciplina Automação de Testes na Camada Serviço(API) da Pós-Graduação em Automação de Testes de Software (Turma 2), realizando o fork do repositório [https://github.com/juliodelimas/pgats-2025-02-base](https://github.com/juliodelimas/pgats-2025-02-base) para realizar a automação dos testes.

## Instalação

Execute o comando abaixo para instalar as dependências:

```bash
npm install
```

## Como rodar

### REST
```bash
node rest/server.js
```
Acesse a documentação Swagger em: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### GraphQL
```bash
node graphql/server.js
```
Acesse o playground GraphQL em: [http://localhost:4000/graphql](http://localhost:4000/graphql)

## Endpoints REST
- POST `/api/users/register` — Registro de usuário
- POST `/api/users/login` — Login (retorna token JWT)
- POST `/api/checkout` — Checkout (requer token JWT)

## Regras de Checkout
- Só pode fazer checkout com token JWT válido
- Informe lista de produtos, quantidades, valor do frete, método de pagamento e dados do cartão se necessário
- 5% de desconto no valor total se pagar com cartão de crédito
- Resposta do checkout contém valor final

## Banco de dados
- Usuários e produtos são mantidos em memória (veja arquivos em `src/models`)

## Testes
- Para testes automatizados, importe o `app` de `rest/app.js` ou `graphql/app.js` sem o método `listen()`
- Os testes estão localizados na pasta `test/`

# Conceitos de Teste de Performance K6 Aplicados
Os conceitos abaixo foram aplicados no arquivo `checkout.test.js`, no arquivo json, na pasta `data` e em helpers localizados na pasta `helpers`.

## Thresholds
O conceito de thresholds foi aplicado para garantir que o tempo de resposta das requisições esteja dentro do esperado, no trecho de código abaixo, é esperado que o tempo de resposta seja inferior a 02 segundos:

```js
export let options = {
	thresholds: {
		http_req_duration: ['p(95)<2000'],
		'checkout_duration': ['p(95)<2000'],
	},
};
```

## Checks
Checks são usados para validar o status code das respostas das requisições, no trecho de código abaixo, estamos validando que a resposta no status code tem que ser igual a 201:

```js
check(res, {
	'register status is 201': (r) => r.status === 201,
});
```

## Helpers
Helpers são funções utilitárias importadas de outros arquivos para reaproveitamento de código,no trecho de código abaixo, dentro do arquivo randomEmail.js, temos a função randomEmail que gera e retorna um e-mail aleatório. Além do randomEmail, também são utilizados helpers para obter a base URL e realizar login:

```js
export function randomEmail() {
    const timestamp = Date.now();
    return `user_${timestamp}_${Math.floor(Math.random() * 10000)}@test.com`;
}
```

## Trends
O conceito de trends foi aplicado para monitorar o tempo de duração das requisições de checkout, no trecho de código abaixo, foi criado uma métrica customizada para registrar o tempo de cada requisição de checkout. 

```js
const checkoutDuration = new Trend('checkout_duration');

checkoutDuration.add(res.timings.duration);
```

## Faker
O conceito do Faker foi utilizado para gerar dados dinâmicos e aleatórios para os testes, ajudando a evitar conflitos de dados repetidos em execuções concorrentes, no trecho de código abaixo, foi gerado dados dinâmicos para as variáveis password e name:

```js
group('Registrar usuário', function () {
        email = randomEmail();
        password = faker.internet.password();
        const payload = JSON.stringify({
            name: faker.person.firstName(),
            email: email,
            password: password
        });
        });
```

## Variável de Ambiente
O conceito da variável de ambiente foi implementado através de um arquivo Helper(getBaseUrl.js), no trecho de código abaixo, utilizamos um Helper, onde a função getBaseUrl retorna a variável de ambiente ou o endereço informado:

```js
export function getBaseUrl() {
    return __ENV.BASE_URL || 'http://localhost:3000';
}
```

## Stages
O conceito de stages foi aplicado para simular diferentes cargas de usuários durante o teste, no trecho de código abaixo, simulamos as cargas de Ramp Up, Average, Spike e Ramp Down, cada objeto no array representa uma fase do teste, controlando o número de usuários virtuais (VUs) e a duração de cada fase:

```js
export let options = {
	stages: [
		{ duration: '3s', target: 10 },
		{ duration: '15s', target: 10 },
		{ duration: '2s', target: 100 },
		{ duration: '3s', target: 100 },
		{ duration: '5s', target: 10 },
		{ duration: '5s', target: 0 },
	],
};
```

## Reaproveitamento de Resposta
O conceito de reaproveitamento de resposta foi aplicado para capturar a resposta de um dado, no trecho de código abaixo, o token obtido na resposta do login é armazenado e utilizado posteriormente para autenticar a requisição de checkout, caracterizando o reaproveitamento de resposta:

```js
group('Login do usuário', function () {
	token = login(email, password);
});

group('Realizar checkout', function () {
	const params = {
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		}
	};
	
});
```

## Uso de Token de Autenticação
O conceito do uso do token de autenticação foi aplicado ao realizar o checkout, no trecho de código abaixo o token JWT obtido no login é passado no header Authorization, conforme o padrão JWT, dentro do grupo Realizar checkout:

```js
group('Realizar checkout', function () {
        const checkoutUserData = checkoutUsers[(__VU - 1) % checkoutUsers.length];
        const params = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        const res = http.post(`${getBaseUrl()}/api/checkout`, JSON.stringify(checkoutUserData), params);
        checkoutDuration.add(res.timings.duration);
        check(res, {
            'checkout status is 200': (r) => r.status === 200,
        });
    });
```

## Data-Driven Testing
O conceito de data-driven testing foi aplicado utilizando o SharedArray para carregar dados de um arquivo externo e permite simular diferentes cenários de checkout de forma automatizada e escalável, no trecho de código abaixo, a função lê o arquivo json, onde estão os dados de teste:

Trecho do arquivo JSON

```json
  {
    "items": [
      {
        "productId": 1,
        "quantity": 1
      }
    ],
    "freight": 10.0,
    "paymentMethod": "credit_card",
    "cardData": {
      "number": "4111111111111111",
      "name": "Test User 1",
      "expiry": "12/30",
      "cvv": "123"
    }
  }
```

```js
const checkoutUsers = new SharedArray('checkoutUsers', function () {
  return JSON.parse(open('./data/checkoutUsers.test.data.json'));
})

const checkoutUserData = checkoutUsers[(__VU - 1) % checkoutUsers.length];
const res = http.post(`${getBaseUrl()}/api/checkout`, JSON.stringify(checkoutUserData), params);
```

## Groups
O conceito de groups foi aplicado para organizar o teste em etapas lógicas, facilitando a leitura e análise dos resultados no relatório do K6. No trecho de código abaixo, temos o conceito sendo aplicado no grupo Registrar usuário:

```js
    group('Registrar usuário', function () {
        email = randomEmail();
        password = faker.internet.password();
        const payload = JSON.stringify({
            name: faker.person.firstName(),
            email: email,
            password: password
        });
        const res = http.post(`${getBaseUrl()}/api/users/register`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        check(res, {
            'register status is 201': (r) => r.status === 201,
        });
    });
```