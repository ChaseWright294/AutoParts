import Header from './Header.jsx'
import { useAuth } from './AuthContext.jsx';
import { useEffect, useState } from 'react';
import './Inventory.css'

function CreateInventoryRow({product}) {
  return(
    <>
      <p>{product.part_id}</p>
      <p>{product.name}</p>
      <p>${Number(product.price).toFixed(2)}</p>
      <p>{product.quantity}</p>
    </>
  )
}

function CreateInventory({inventory}) {

  return (
    <div className="inventory-list">
        <p className="header">Part ID</p>
        <p className="header">Name</p>
        <p className="header">Price</p>
        <p className="header">Quantity In Store</p>

        {inventory.map((product) => (
          <CreateInventoryRow key={product.part_id} product={product} />
        ))}
    </div>
  )
}

function Inventory() {
  const { user } = useAuth();
  const storeNumber = user?.store_number;
  const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    // Fetch inventory data for the store number
    async function fetchInventory() {
      try {
        const response = await fetch(`http://localhost:3001/api/inventory/${storeNumber}`);
        if (!response.ok) throw new Error('Could not load inventory from database');
        const data = await response.json();
        if (!cancelled) {
          setInventory(data);
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setError('Error fetching inventory');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchInventory();

    return () => {
      cancelled = true;
    };
  }, [storeNumber]);

  return (
    <div className="inventory-container">
        <Header title="Inventory"/>
        <p>Inventory for Store Number: {storeNumber}</p>
        {loading && <p>Loading inventory...</p>}
        {error && <p>Error: {error}</p>}
        {inventory.length === 0 && !loading && <p>No inventory data available.</p>}
        {inventory.length > 0 && <CreateInventory inventory={inventory} />}
    </div>
  );
}

export default Inventory;