//Bibliotecas
const request = require('supertest');
const { expect } = require('chai');

//Aplicação
const app = require('../../../rest/app');

//Fixtures
const userFixture = require('../fixture/userFixture');
const loginFixture = require('../fixture/loginFixture');
const validCard = require('../fixture/cardFixture');

//Testes
describe('Checkout External API', () => {
  let token;

  before(async () => {
    await request(app)
      .post('/api/users/register')
      .send(userFixture);
    const login = await request(app)
      .post('/api/users/login')
      .send(loginFixture);
    token = login.body.token;
  });

  it('deve realizar checkout com sucesso com pagamento por cartão', async () => {
    const resposta = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 1, quantity: 1 }],
        freight: 10,
        paymentMethod: 'credit_card',
        cardData: validCard
      });
 
  expect(resposta.status).to.equal(200);  
  expect(resposta.body.paymentMethod).to.equal('credit_card');
  });

  it('deve retornar erro se dados do cartão não forem enviados', async () => {
    const resposta = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 1, quantity: 1 }],
        freight: 10,
        paymentMethod: 'credit_card'        
      });
  
  expect(resposta.status).to.be.equal(400);
  expect(resposta.body).to.have.property('error', 'Dados do cartão obrigatórios para pagamento com cartão')
  });

  it('deve retornar erro se produto não for encontrado', async () => {
    const resposta = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 999, quantity: 1 }], // produto inexistente
        freight: 10,
        paymentMethod: 'boleto'
      });
  
  expect(resposta.status).to.be.equal(400);
  expect(resposta.body).to.have.property('error', 'Produto não encontrado')
  });
});
