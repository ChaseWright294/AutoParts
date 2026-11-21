
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
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiration, setCardExpiration] = useState('');
    const [cardCvv, setCardCvv] = useState('');
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

    const stores = Array.from(
    new Map(
        inventory.map(item => [
            Number(item.store_number),
            {
                store_number: Number(item.store_number),
                address: `${item.street}, ${item.city}, ${item.state} ${item.zip}`
            }
        ])
    ).values()
    ).sort((a, b) => a.store_number - b.store_number);

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

                                {stores.map(location => (
                                    <option
                                        key={location.store_number}
                                        value={location.store_number}
                                    >
                                        {location.address}
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

                            
                            {paymentMethod === 'card' ? (
                                <div className="checkout-card-fields">

                                    <p className="checkout-note">
                                        Demo payment only. Use fictional card information.
                                        Do not enter real card details.
                                    </p>

                                    <label htmlFor="card-name">Cardholder Name</label>
                                    <input
                                        id="card-name"
                                        type="text"
                                        placeholder="Test Customer"
                                        autoComplete="off"
                                        value={cardName}
                                        required
                                        disabled={submitting}
                                        onChange={event => setCardName(event.target.value)}
                                    />

                                    <label htmlFor="card-number">Card Number</label>
                                    <input
                                        id="card-number"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="4242 4242 4242 4242"
                                        autoComplete="off"
                                        maxLength={19}
                                        pattern="[0-9 ]{16,19}"
                                        value={cardNumber}
                                        required
                                        disabled={submitting}
                                        onChange={event =>
                                            setCardNumber(
                                                event.target.value
                                                    .replace(/\D/g, '')
                                                    .slice(0, 16)
                                                    .replace(/(.{4})/g, '$1 ')
                                                    .trim()
                                            )
                                        }
                                    />

                                    <div className="checkout-card-row">
                                        <div>
                                            <label htmlFor="card-expiration">
                                                Expiration Date
                                            </label>

                                            <input
                                                id="card-expiration"
                                                type="text"
                                                placeholder="MM/YY"
                                                autoComplete="off"
                                                maxLength={5}
                                                pattern="(0[1-9]|1[0-2])/[0-9]{2}"
                                                value={cardExpiration}
                                                required
                                                disabled={submitting}
                                                onChange={event =>
                                                    setCardExpiration(event.target.value)
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="card-cvv">CVV</label>

                                            <input
                                                id="card-cvv"
                                                type="password"
                                                inputMode="numeric"
                                                placeholder="123"
                                                autoComplete="off"
                                                maxLength={4}
                                                pattern="[0-9]{3,4}"
                                                value={cardCvv}
                                                required
                                                disabled={submitting}
                                                onChange={event =>
                                                    setCardCvv(
                                                        event.target.value.replace(/\D/g, '')
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="checkout-note">
                                    Cash payment will be made at the selected store.
                                </p>
                            )}


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
