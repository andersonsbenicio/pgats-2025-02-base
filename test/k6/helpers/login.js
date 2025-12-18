import http from 'k6/http';
import { check } from 'k6';
import { getBaseUrl } from './getBaseUrl.js';

export function login(email, password) {
    const url = `${getBaseUrl()}/api/users/login`;
    const payload = JSON.stringify({ email, password });
    const params = { headers: { 'Content-Type': 'application/json' } };
    const res = http.post(url, payload, params);
    check(res, {
        'login status is 200': (r) => r.status === 200,
        'login has token': (r) => r.json('token') !== undefined,
    });
    return res.json('token');
}
