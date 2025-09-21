//Bibliotecas
const request = require('supertest');
const { expect } = require('chai');

require("dotenv").config();

//Testes
describe('Testes de Checkout GraphQL External', () => {
  let token;

  before(async () => {
    const registerUser = require('../fixture/requisicoes/registerUser.json');
    await request(process.env.BASE_URL_GRAPHQL)
      .post('/graphql')
      .send(registerUser);
    const loginUser = require('../fixture/requisicoes/loginUser.json');
    const loginRes = await request(process.env.BASE_URL_GRAPHQL)
      .post('/graphql')
      .send(loginUser);
    token = loginRes.body.data.login.token;
  });

  it('deve realizar checkout com sucesso com pagamento por cartão', async () => {
  const creditCardWithData = require('../fixture/regras/creditCardWithData.json');
    const resposta = await request(process.env.BASE_URL_GRAPHQL)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(creditCardWithData);

    expect(resposta.status).to.equal(200);
    expect(resposta.body.data.checkout.paymentMethod).to.equal('credit_card');
  });

  it('deve retornar erro se dados do cartão não forem enviados', async () => {
  const creditCardWithoutData = require('../fixture/regras/creditCardWithoutData.json');
    const resposta = await request(process.env.BASE_URL_GRAPHQL)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(creditCardWithoutData);
    
    expect(resposta.status).to.equal(200);
    expect(resposta.body.errors[0].message).to.equal('Dados do cartão obrigatórios para pagamento com cartão');
  });

  it('deve retornar erro se produto não for encontrado', async () => {
  const invalidProduct = require('../fixture/regras/invalidProduct.json');
    const resposta = await request(process.env.BASE_URL_GRAPHQL)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidProduct);
   
    expect(resposta.status).to.equal(200);
    expect(resposta.body.errors[0].message).to.equal('Produto não encontrado');
  });

  it('deve retornar erro se não enviar token', async () => {
  const tokenlessCheckout = require('../fixture/regras/tokenlessCheckout.json');
    const resposta = await request(process.env.BASE_URL_GRAPHQL)
      .post('/graphql')
      .send(tokenlessCheckout);
    
    expect(resposta.status).to.equal(200);
    expect(resposta.body.errors[0].message).to.equal('Token inválido');
  });
});
