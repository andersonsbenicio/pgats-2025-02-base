//Bibliotecas
const request = require('supertest');
const { expect } = require('chai');

//Aplicação
const app = require('../../../rest/app');

//Testes
describe('Testes de Checkout Rest External', () => {
  let token;

  before(async () => {
    const postUser = require('../fixture/requisicoes/postUser.json');
    await request(app)
      .post('/api/users/register')
      .send(postUser);
    const postLogin = require('../fixture/requisicoes/postLogin.json');
    const login = await request(app)
      .post('/api/users/login')
      .send(postLogin);
    token = login.body.token;
  });

  it('deve realizar checkout com sucesso com pagamento por cartão', async () => {
    const validCard = require('../fixture/regras/validCard.json');
    const resposta = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send(validCard);
 
  expect(resposta.status).to.equal(200);  
  expect(resposta.body.paymentMethod).to.equal('credit_card');
  });

  it('deve retornar erro se dados do cartão não forem enviados', async () => {
    const invalidCard = require('../fixture/regras/invalidCard.json');
    const resposta = await request(app)    
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidCard);
  
  expect(resposta.status).to.be.equal(400);
  expect(resposta.body).to.have.property('error', 'Dados do cartão obrigatórios para pagamento com cartão')
  });

  it('deve retornar erro se produto não for encontrado', async () => {
    const nonExistentProduct = require('../fixture/regras/nonExistentProduct.json');
    const resposta = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send(nonExistentProduct);
  
  expect(resposta.status).to.be.equal(400);
  expect(resposta.body).to.have.property('error', 'Produto não encontrado')
  });
});
