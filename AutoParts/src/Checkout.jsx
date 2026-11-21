
import Header from './Header.jsx';
import { useCart } from './CartContext.jsx';
import { useAuth } from './AuthContext.jsx';
import { getInventory, createOrder } from './api.js';
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import './Checkout.css';

function Checkout() {
    const { user } = useAuth();

    const {
        items,
        updateQuantity,
        removeItem,
        clearCart,
        total
    } = useCart();

    const [inventory, setInventory] = useState([]);
    const [store, setStore] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [inventoryError, setInventoryError] = useState('');
    const [error, setError] = useState('');
    const [order, setOrder] = useState(null);

    

    useEffect(() => {
        let active = true;

        async function loadInventory() {
            try {
                const data = await getInventory();
                if (active) setInventory(data);
            } catch (err) {
                if (active) setInventoryError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        }

        if (user?.role === 'customer') {
            loadInventory();
        }

        return () => {
            active = false;
        };
    }, [user]);

    if (!user) return <Navigate to="/" replace />;

    if (user.role !== 'customer') {
        return <Navigate to="/inventory" replace />;
    }

    const stores = [...new Set(
        inventory.map(item => Number(item.store_number))
    )].sort((a, b) => a - b);

    function availableStock(partId, storeNumber) {
        const row = inventory.find(item =>
            Number(item.part_id) === Number(partId) &&
            Number(item.store_number) === Number(storeNumber)
        );

        return Number(row?.quantity || 0);
    }

    const insufficientStock = items.some(item =>
        item.quantity > availableStock(item.part_id, store)
    );

    async function handleCheckout(event) {
        event.preventDefault();

        if (submitting) return;

        setError('');

        if (!items.length || !store) {
            setError('Select a store and add items to your cart.');
            return;
        }

        if (insufficientStock) {
            setError('The selected store has insufficient stock.');
            return;
        }

        

        setSubmitting(true);

        try {
            const result = await createOrder({
                customer_username: user.username,
                store_number: Number(store),
                is_online: true,
                payment_method: paymentMethod,
                items: items.map(item => ({
                    part_id: item.part_id,
                    quantity: item.quantity
                }))
            });

            setOrder(result);
            clearCart();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="checkout-container">
            <Header title="Checkout" />

            <main className="checkout-content">
                {order ? (
                    <section className="checkout-success">
                        <h2>Order Created Successfully!</h2>
                        <p>Order ID: {order.order_id}</p>
                        <p>Total: ${Number(order.total).toFixed(2)}</p>
                        <p>Status: {order.status}</p>
                        <p>Your order is awaiting processing.</p>

                        <Link to="/home">Continue Shopping</Link>
                    </section>
                ) : items.length === 0 ? (
                    <section className="empty-cart">
                        <h2>Your cart is empty</h2>
                        <Link to="/home">Continue Shopping</Link>
                    </section>
                ) : (
                    <div className="checkout-layout">

                        <section className="checkout-items">
                            <h2>Shopping Cart</h2>

                            {items.map(item => (
                                <div
                                    className="checkout-item"
                                    key={item.part_id}
                                >
                                    <div>
                                        <Link to={`/part-info/${item.part_id}`}>
                                            <strong>{item.name}</strong>
                                        </Link>

                                        <p>${item.price.toFixed(2)} each</p>

                                        {store && (
                                            <p>
                                                Store stock: {
                                                    availableStock(
                                                        item.part_id,
                                                        store
                                                    )
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="quantity-controls">
                                        <button
                                            type="button"
                                            aria-label={`Decrease ${item.name} quantity`}
                                            disabled={submitting || item.quantity <= 1}
                                            onClick={() =>
                                                updateQuantity(
                                                    item.part_id,
                                                    item.quantity - 1
                                                )
                                            }
                                        >
                                            -
                                        </button>

                                        <span>{item.quantity}</span>

                                        <button
                                            type="button"
                                            aria-label={`Increase ${item.name} quantity`}
                                            disabled={
                                                submitting ||
                                                item.quantity >= item.in_stock ||
                                                (store && item.quantity >=
                                                    availableStock(item.part_id, store))
                                            }
                                            onClick={() =>
                                                updateQuantity(
                                                    item.part_id,
                                                    item.quantity + 1
                                                )
                                            }
                                        >
                                            +
                                        </button>
                                    </div>

                                    <strong>
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </strong>

                                    <button
                                        type="button"
                                        className="remove-item"
                                        disabled={submitting}
                                        onClick={() => removeItem(item.part_id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}

                            <Link to="/home">Continue Shopping</Link>
                        </section>

                        <form
                            className="checkout-summary"
                            onSubmit={handleCheckout}
                        >
                            <h2>Order Summary</h2>

                            <p>
                                Customer: {user.first_name} {user.last_name}
                            </p>

                            <label htmlFor="checkout-store">
                                Select Store
                            </label>

                            <select
                                id="checkout-store"
                                value={store}
                                required
                                disabled={loading || submitting || !!inventoryError}
                                onChange={event => {
                                    setStore(event.target.value);
                                    setError('');
                                }}
                            >
                                <option value="">
                                    {loading ? 'Loading stores...' : 'Choose a store'}
                                </option>

                                {stores.map(number => (
                                    <option key={number} value={number}>
                                        Store {number}
                                    </option>
                                ))}
                            </select>

                            {inventoryError && (
                                <p className="checkout-error" role="alert">
                                    {inventoryError}
                                </p>
                            )}

                            {store && insufficientStock && (
                                <p className="checkout-error">
                                    This store cannot fulfill all items.
                                    Select another store or reduce quantities.
                                </p>
                            )}

                            <label htmlFor="payment-method">
                                Payment Method
                            </label>

                            <select
                                id="payment-method"
                                value={paymentMethod}
                                disabled={submitting}
                                onChange={event =>
                                    setPaymentMethod(event.target.value)
                                }
                            >
                                <option value="card">Card</option>
                                <option value="cash">Cash</option>
                            </select>

                            <p className="checkout-note">
                                Demo checkout. No real payment is processed.
                            </p>

                            <div className="checkout-total">
                                <strong>Total</strong>
                                <strong>${total.toFixed(2)}</strong>
                            </div>

                            {error && (
                                <p className="checkout-error" role="alert">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="place-order-button"
                                disabled={
                                    submitting ||
                                    loading ||
                                    !!inventoryError ||
                                    !store ||
                                    insufficientStock
                                }
                            >
                                {submitting ? 'Placing Order...' : 'Place Order'}
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Checkout;
