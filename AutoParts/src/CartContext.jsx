
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const { user } = useAuth();

    const customer = user?.role === 'customer'
        ? user.username
        : null;

    return (
        <CustomerCart key={customer || 'guest'} customer={customer}>
            {children}
        </CustomerCart>
    );
}

function CustomerCart({ children, customer }) {
    const storageKey = customer
        ? `autoparts-cart-${customer}`
        : null;

    const [items, setItems] = useState(() => {
        try {
            const saved = storageKey
                ? JSON.parse(localStorage.getItem(storageKey))
                : [];

            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        if (storageKey) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(items));
            } catch {
                // Keep the cart available in memory.
            }
        }
    }, [items, storageKey]);

    function addToCart(part) {
        if (!customer || Number(part.in_stock) <= 0) return;

        setItems(current => {
            const existing = current.find(
                item => item.part_id === part.part_id
            );

            if (existing) {
                return current.map(item =>
                    item.part_id === part.part_id
                        ? {
                            ...item,
                            in_stock: Number(part.in_stock),
                            quantity: Math.min(
                                item.quantity + 1,
                                Number(part.in_stock)
                            )
                        }
                        : item
                );
            }

            return [...current, {
                part_id: part.part_id,
                name: part.name,
                price: Number(part.price),
                in_stock: Number(part.in_stock),
                quantity: 1
            }];
        });
    }

    function updateQuantity(partId, quantity) {
        const qty = Number(quantity);

        if (!Number.isInteger(qty) || qty < 1) return;

        setItems(current =>
            current.map(item =>
                item.part_id === partId
                    ? { ...item, quantity: Math.min(qty, item.in_stock) }
                    : item
            )
        );
    }

    function removeItem(partId) {
        setItems(current =>
            current.filter(item => item.part_id !== partId)
        );
    }

    function clearCart() {
        setItems([]);
    }

    const cartCount = items.reduce(
        (sum, item) => sum + item.quantity, 0
    );

    const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity, 0
    );

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            updateQuantity,
            removeItem,
            clearCart,
            cartCount,
            total
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart must be used inside CartProvider');
    }

    return context;
}
