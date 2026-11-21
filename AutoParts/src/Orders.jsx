import { useEffect, useState } from 'react';
import Header from './Header.jsx';
import { useAuth } from './AuthContext.jsx';
import './Orders.css';

function Orders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function fetchOrders() {
            if (user?.role !== 'customer' || !user.username) {
                setError('Log in as a customer to view previous orders.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');
            try {
                const response = await fetch(
                    `/api/customers/${encodeURIComponent(user.username)}/orders`
                );
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.error || 'Could not load previous orders.');
                }
                if (!cancelled) setOrders(data);
            } catch (error) {
                if (!cancelled) setError(error.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchOrders();
        return () => {
            cancelled = true;
        };
    }, [user?.role, user?.username]);

    return (
        <div className="orders-container">
            <Header title="Previous Orders" />
            {loading && <p>Loading orders...</p>}
            {error && <p role="alert">{error}</p>}
            {!loading && !error && orders.length === 0 && (
                <p>You don't have any previous orders.</p>
            )}
            {!loading && !error && orders.length > 0 && (
                <div className="orders-scroll">
                    <div className="orders-list">
                        <div className="orders-grid orders-header">
                            <p>Order ID</p>
                            <p>Date</p>
                            <p>Store</p>
                            <p>Items</p>
                            <p>Total</p>
                            <p>Status</p>
                        </div>
                        {orders.map(order => (
                            <div className="orders-grid order-row" key={order.order_id}>
                                <p>{order.order_id}</p>
                                <p>{new Date(order.order_date).toLocaleString()}</p>
                                <p>{order.store_number}</p>
                                <div className="order-items">
                                    {order.items.map(item => (
                                        <span key={item.part_id}>
                                            {item.name} × {item.quantity}
                                        </span>
                                    ))}
                                </div>
                                <p>${Number(order.total).toFixed(2)}</p>
                                <p className="order-status">{order.status}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Orders;