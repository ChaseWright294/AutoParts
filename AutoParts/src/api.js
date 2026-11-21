async function request(path, options = {}) {
    const res = await fetch(`/api${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
    return body;
}

const post = (path, data) => request(path, {
    method: 'POST',
    body: JSON.stringify(data)
});

export const loginCustomer = (username, password) =>
    post('/auth/customer/login', { username, password });

export const loginEmployee = (username, password) =>
    post('/auth/employee/login', { username, password });

export const registerCustomer = (customer) =>
    post('/auth/customer/register', customer);

export const getInventory = () => request('/inventory');

export const createOrder = (data) => post('/orders', data);

export const getEmployees = (storeNumber) =>
    request(`/employees?store_number=${encodeURIComponent(storeNumber)}`);

export const addEmployee = (data) =>
    post('/employees', data);

export const deleteEmployee = (employeeId) =>
    request(`/employees/${employeeId}`, {
        method: 'DELETE'
    });