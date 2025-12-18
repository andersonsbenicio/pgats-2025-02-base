import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { getBaseUrl } from './helpers/getBaseUrl.js';
import { randomEmail } from './helpers/randomEmail.js';
import { login } from './helpers/login.js';
import faker from "k6/x/faker"
import { SharedArray } from 'k6/data';

const checkoutUsers = new SharedArray('checkoutUsers', function () {
  return JSON.parse(open('./data/checkoutUsers.test.data.json'));
})

export let options = {
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% das requests devem ser < 2s
        'checkout_duration': ['p(95)<2000'],
    },
    stages: [
    { duration: '3s', target: 10 }, // Ramp up
    { duration: '15s', target: 10 }, // Average
    { duration: '2s', target: 100 }, // Spike
    { duration: '3s', target: 100 }, // Spike
    { duration: '5s', target: 10 }, // Average
    { duration: '5s', target: 0 }, // Ramp down
  ],
};

const checkoutDuration = new Trend('checkout_duration');

export default function () {
    let email, password, token;
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

    group('Login do usuário', function () {
        token = login(email, password);
    });

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
    sleep(1);
}
