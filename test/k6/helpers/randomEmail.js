export function randomEmail() {
    const timestamp = Date.now();
    return `user_${timestamp}_${Math.floor(Math.random() * 10000)}@test.com`;
}
