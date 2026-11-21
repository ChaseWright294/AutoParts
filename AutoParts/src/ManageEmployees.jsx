import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Header from './Header.jsx';
import { useAuth } from './AuthContext.jsx';
import {
    getEmployees,
    addEmployee,
    deleteEmployee
} from './api.js';
import './ManageEmployees.css';

const emptyForm = {
    first_name: '',
    last_name: '',
    username: '',
    password: '',
    work_email: '',
    phone_number: ''
};

const fields = [
    ['first_name', 'First Name', 'text', 32],
    ['last_name', 'Last Name', 'text', 32],
    ['username', 'Username', 'text', 32],
    ['password', 'Temporary Password', 'password', 255],
    ['work_email', 'Work Email', 'email', 255],
    ['phone_number', 'Phone Number', 'tel', 10]
];

export default function ManageEmployees() {
    const { user } = useAuth();

    const isManager =
        user?.role === 'employee' &&
        user?.is_manager === true &&
        user?.store_number != null;

    const storeNumber = user?.store_number;

    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!isManager) return;

        let active = true;

        getEmployees(storeNumber)
            .then(data => {
                if (active) setEmployees(data);
            })
            .catch(err => {
                if (active) setError(err.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [isManager, storeNumber]);

    if (!user) {
        return <Navigate to="/employee-login" replace />;
    }

    if (!isManager) {
        return (
            <Navigate
                to={user.role === 'customer' ? '/home' : '/inventory'}
                replace
            />
        );
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    }

    async function handleAdd(event) {
        event.preventDefault();

        setError('');
        setSuccess('');
        setBusy(true);

        try {
            const employee = await addEmployee({
                ...form,
                store_number: storeNumber
            });

            setEmployees(previous =>
                [...previous, employee]
            );

            setForm(emptyForm);
            setShowForm(false);
            setSuccess('Employee added successfully.');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(employee) {
        if (Number(employee.employee_id) === Number(user.employee_id)) {
            setError('You cannot remove your own account.');
            return;
        }

        const confirmed = window.confirm(
            `Remove ${employee.first_name} ${employee.last_name}?`
        );

        if (!confirmed) return;

        setBusy(true);
        setError('');
        setSuccess('');

        try {
            await deleteEmployee(employee.employee_id);

            setEmployees(previous =>
                previous.filter(
                    item => item.employee_id !== employee.employee_id
                )
            );

            setSuccess('Employee removed successfully.');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    const filteredEmployees = employees.filter(employee => {
        const text = [
            employee.employee_id,
            employee.first_name,
            employee.last_name,
            employee.username,
            employee.work_email
        ].join(' ').toLowerCase();

        return text.includes(search.toLowerCase());
    });

    return (
        <>
            <Header title="Employee Management" />

            <main className="employee-management">

                <div className="employee-toolbar">
                    <div>
                        <h2>Manage Employees</h2>
                        <p>Store {storeNumber}</p>
                    </div>

                    <button
                        className="employee-primary"
                        disabled={busy}
                        onClick={() => {
                            setShowForm(!showForm);
                            setForm(emptyForm);
                        }}
                    >
                        {showForm ? 'Cancel' : '+ Add Employee'}
                    </button>
                </div>

                {error && (
                    <p className="employee-error" role="alert">
                        {error}
                    </p>
                )}

                {success && (
                    <p className="employee-success" role="status">
                        {success}
                    </p>
                )}

                {showForm && (
                    <form
                        className="employee-form"
                        onSubmit={handleAdd}
                    >
                        <h3>Add New Employee</h3>

                        <div className="employee-form-grid">

                            {fields.map(([name, label, type, maxLength]) => (
                                <label key={name}>
                                    {label}

                                    <input
                                        name={name}
                                        type={type}
                                        value={form[name]}
                                        onChange={handleChange}
                                        maxLength={maxLength}
                                        pattern={
                                            name === 'phone_number'
                                                ? '[0-9]{10}'
                                                : undefined
                                        }
                                        placeholder={
                                            name === 'phone_number'
                                                ? '10 digits'
                                                : label
                                        }
                                        autoComplete={
                                            name === 'password'
                                                ? 'new-password'
                                                : 'off'
                                        }
                                        required
                                        disabled={busy}
                                    />
                                </label>
                            ))}

                        </div>

                        <p>Assigned Store: {storeNumber}</p>

                        <button
                            className="employee-primary"
                            type="submit"
                            disabled={busy}
                        >
                            {busy ? 'Saving...' : 'Save Employee'}
                        </button>
                    </form>
                )}

                <input
                    className="employee-search"
                    placeholder="Search employees..."
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                />

                {loading ? (
                    <p>Loading employees...</p>
                ) : (
                    <div className="employee-table-wrapper">
                        <table className="employee-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Store</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredEmployees.map(employee => (
                                    <tr key={employee.employee_id}>
                                        <td>{employee.employee_id}</td>

                                        <td>
                                            {employee.first_name}{' '}
                                            {employee.last_name}
                                        </td>

                                        <td>{employee.username}</td>
                                        <td>{employee.work_email}</td>
                                        <td>{employee.phone_number}</td>
                                        <td>{employee.store_number}</td>

                                        <td>
                                            <button
                                                className="employee-delete"
                                                disabled={
                                                    busy ||
                                                    Number(employee.employee_id) ===
                                                    Number(user.employee_id)
                                                }
                                                onClick={() =>
                                                    handleDelete(employee)
                                                }
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {filteredEmployees.length === 0 && (
                                    <tr>
                                        <td colSpan={7}>
                                            No employees found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <p className="employee-count">
                    {filteredEmployees.length} employee(s)
                </p>
            </main>
        </>
    );
}