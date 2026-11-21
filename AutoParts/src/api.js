// Calls the backend and returns the parsed JSON.
// Throws an Error carrying the server's message (e.g. "Invalid username or password").
async function request(path, options = {}) {
    const res = await fetch(`/api${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
    return body;
}

const post = (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) });

export const loginCustomer = (username, password) => post('/auth/customer/login', { username, password });
export const loginEmployee = (username, password) => post('/auth/employee/login', { username, password });
export const registerCustomer = (customer) => post('/auth/customer/register', customer);

export const getInventory = () => request('/inventory');
export const createOrder = (data) => post('/orders', data);

