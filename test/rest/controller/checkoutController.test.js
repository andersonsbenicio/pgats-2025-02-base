//Bibliotecas
const request = require('supertest');
const sinon = require('sinon');
const {expect} = require('chai');

//Aplicação
const app = require('../../../rest/app');

//Mock
const checkoutService = require('../../../src/services/checkoutService');

//Testes
describe('CheckoutController', () => {
  
  beforeEach(async () => {
    // Cria usuário e obtém token
    await request(app)
      .post('/api/users/register')
      .send({
         name: 'Anderson',
         email: 'anderson@email.com',
         password: '123456'
        });

    const login = await request(app)
      .post('/api/users/login')
      .send({
        email: 'anderson@email.com',
        password: '123456'
      });
      
    token = login.body.token;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('deve realizar checkout com sucesso', async () => {
    const resposta = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 1, quantity: 2 }],
        freight: 20,
        paymentMethod: 'boleto'
      });
    expect(resposta.status).to.equal(200);    
  });

  it('Usando Mocks: deve realizar checkout com sucesso', async () => {
    sinon.stub(checkoutService, 'checkout').returns({
      total: 100,
      paymentMethod: 'boleto',
      freight: 20,
      items: [{ productId: 1, quantity: 2 }],
      userId: 1
    });

    const resposta = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 1, quantity: 2 }],
        freight: 20,
        paymentMethod: 'boleto'
      });

    expect(resposta.status).to.equal(200);    
  });

  it('deve retornar erro ao tentar checkout sem token', async () => {
    const resposta = await request(app)
      .post('/api/checkout')
      .send({
        items: [{ productId: 1, quantity: 2 }],
        freight: 20,
        paymentMethod: 'boleto'
      });

    expect(resposta.status).to.equal(401);    
    expect(resposta.body).to.have.property('error', 'Token inválido')
  });

  it('Usando Mocks: deve retornar erro de checkout', async () => {
    sinon.stub(checkoutService, 'checkout').throws(new Error('Erro de checkout'));
    const resposta = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 1, quantity: 2 }],
        freight: 20,
        paymentMethod: 'boleto'
      });

    expect(resposta.status).to.equal(400);    
    expect(resposta.body).to.have.property('error', 'Erro de checkout')
  });
});
