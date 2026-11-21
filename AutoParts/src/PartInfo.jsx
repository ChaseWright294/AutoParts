
import Header from './Header.jsx'
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useCart } from './CartContext.jsx';

function PartInfo() {
    const { partId } = useParams();
    const { user } = useAuth();
    const { items, addToCart } = useCart();

    const [part, setPart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadPart() {
            setLoading(true);
            setError('');
            setMessage('');
            setPart(null);

            try {
                const response = await fetch(
                    `http://localhost:3001/api/parts/${encodeURIComponent(partId)}`
                );

                if (!response.ok) {
                    throw new Error('Could not load this part');
                }

                const data = await response.json();

                if (!cancelled) setPart(data);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadPart();

        return () => {
            cancelled = true;
        };
    }, [partId]);

    const quantityInCart = items.find(
        item => item.part_id === part?.part_id
    )?.quantity || 0;

    function handleAddToCart() {
        addToCart(part);
        setMessage(`${part.name} added to cart!`);
    }

    return (
        <div className="part-info-container">
            <Header title="Part Information" />

            {loading && <p>Loading part...</p>}
            {error && <p role="alert">{error}</p>}

            {part && (
                <div className="part-info-details">
                    <h2><strong>{part.name}</strong></h2>
                    <p>{part.description}</p>

                    <p>
                        <strong>Price:</strong> ${Number(part.price).toFixed(2)}
                    </p>

                    <p>
                        <strong>Condition:</strong> {part.part_condition}
                    </p>

                    {part.in_stock > 5 &&
                        <p><strong>In stock</strong></p>}

                    {part.in_stock > 0 && part.in_stock <= 5 &&
                        <p><strong>Low in stock, order soon!</strong></p>}

                    {part.in_stock <= 0 &&
                        <p><strong>Out of stock, check back soon!</strong></p>}

                    {user?.role === 'customer' && (
                        <>
                            <button
                                type="button"
                                disabled={quantityInCart >= Number(part.in_stock)}
                                onClick={handleAddToCart}
                            >
                                {part.in_stock <= 0
                                    ? 'Out of Stock'
                                    : quantityInCart >= Number(part.in_stock)
                                        ? 'Maximum Quantity in Cart'
                                        : 'Add to Cart'}
                            </button>

                            {quantityInCart > 0 && (
                                <p>Quantity in cart: {quantityInCart}</p>
                            )}

                            {message && <p role="status">{message}</p>}

                            <p><Link to="/checkout">View Cart</Link></p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default PartInfo;
