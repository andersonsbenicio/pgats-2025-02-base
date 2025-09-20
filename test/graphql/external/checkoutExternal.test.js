//Bibliotecas
const request = require('supertest');
const { expect } = require('chai');

//Aplicação
const app = require('../../../graphql/app');

//Testes
describe('Testes de Checkout', () => {
  let token;

  before(async () => {
    const registerUser = require('../fixture/requisicoes/registerUser.json');
    await request(app)
      .post('/graphql')
      .send(registerUser);
    const loginUser = require('../fixture/requisicoes/loginUser.json');
    const loginRes = await request(app)
      .post('/graphql')
      .send(loginUser);
    token = loginRes.body.data.login.token;
  });

  it('deve realizar checkout com sucesso com pagamento por cartão', async () => {
  const checkoutCreditCard = require('../fixture/regras/checkoutCreditCard.json');
    const resposta = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(checkoutCreditCard);

    expect(resposta.status).to.equal(200);
    expect(resposta.body.data.checkout.paymentMethod).to.equal('credit_card');
  });

  it('deve retornar erro se dados do cartão não forem enviados', async () => {
  const checkoutCreditCardMissingCard = require('../fixture/regras/checkoutCreditCardMissingCard.json');
    const resposta = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(checkoutCreditCardMissingCard);
    
    expect(resposta.status).to.equal(200);
    expect(resposta.body.errors[0].message).to.equal('Dados do cartão obrigatórios para pagamento com cartão');
  });

  it('deve retornar erro se produto não for encontrado', async () => {
  const checkoutInvalidProduct = require('../fixture/regras/checkoutInvalidProduct.json');
    const resposta = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(checkoutInvalidProduct);
   
    expect(resposta.status).to.equal(200);
    expect(resposta.body.errors[0].message).to.equal('Produto não encontrado');
  });

  it('deve retornar erro se não enviar token', async () => {
  const tokenlessCheckout = require('../fixture/regras/tokenlessCheckout.json');
    const resposta = await request(app)
      .post('/graphql')
      .send(tokenlessCheckout);
    
    expect(resposta.status).to.equal(200);
    expect(resposta.body.errors[0].message).to.equal('Token inválido');
  });
});
