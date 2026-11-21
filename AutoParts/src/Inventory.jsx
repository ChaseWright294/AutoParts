import Header from './Header.jsx'
import { useAuth } from './AuthContext.jsx';
import { useEffect, useState } from 'react';
import './Inventory.css'

function CreateInventoryRow({product , onAddStock}) {
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState('');

  async function handleAddStock() {
    const amount = Number(quantity);
    if (!Number.isInteger(amount) || amount <= 0) {
      setRowError('Enter a whole number greater than zero.');
      return;
    }

    setSaving(true);
    setRowError('');
    try {
      await onAddStock(product.part_id, amount);
      setQuantity('');
    } catch (error) {
      setRowError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return(
    <>
      <p>{product.part_id}</p>
      <p>{product.name}</p>
      <p>${Number(product.price).toFixed(2)}</p>
      <p>{product.quantity}</p>
      <div className="inventory-actions">
        <input
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          disabled={saving}
          aria-label={`Quantity to add for ${product.name}`}
        />
        <button type="button" onClick={handleAddStock} disabled={saving}>
          {saving ? 'Adding…' : 'Add stock'}
        </button>
        {rowError && <span role="alert">{rowError}</span>}
      </div>
    </>
  )
}

function CreateInventory({inventory, onAddStock}) {

  return (
    <div className="inventory-list">
        <p className="header">Part ID</p>
        <p className="header">Name</p>
        <p className="header">Price</p>
        <p className="header">Quantity In Store</p>
        <p className='header'>Actions</p>

        {inventory.map((product) => (
          <CreateInventoryRow
            key={product.part_id}
            product={product}
            onAddStock={onAddStock}
            />
        ))}
    </div>
  )
}

function Inventory() {
  const { user } = useAuth();
  const isManager = user?.is_manager === true;
  const [stores, setStores] = useState([]);
  const [selectedStoreNumber, setSelectedStoreNumber] = useState(
    user?.store_number == null ? '' : String(user.store_number)
  );
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storesError, setStoresError] = useState('');
  const storeNumber = isManager ? selectedStoreNumber : user?.store_number;

  useEffect(() => {
    if (!isManager) return;

    let cancelled = false;
    async function fetchStores() {
      try {
        const response = await fetch('http://localhost:3001/api/stores');
        if (!response.ok) throw new Error('Could not load stores');
        const data = await response.json();
        if (!cancelled) {
          setStores(data);
          const managedStore = data.find(
            (store) => Number(store.manager_id) === Number(user?.employee_id)
          );
          const defaultStoreNumber =
            managedStore?.store_number ?? user?.store_number ?? data[0]?.store_number;
          setSelectedStoreNumber(String(defaultStoreNumber ?? ''));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching stores:', error);
          setStoresError('Could not load the store list.');
        }
      }
    }

    fetchStores();
    return () => {
      cancelled = true;
    };
  }, [isManager, user?.employee_id, user?.store_number]);

  useEffect(() => {
    let cancelled = false;

    async function fetchInventory() {
      if (storeNumber === '' || storeNumber == null) {
        setInventory([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await fetch(`http://localhost:3001/api/inventory/${storeNumber}`);
        if (!response.ok) throw new Error('Could not load inventory from database');
        const data = await response.json();
        if (!cancelled) {
          setInventory(data);
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
        if (!cancelled) {
          setError('Error fetching inventory');
        }
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

  async function addStock(partId, amount) {
  const response = await fetch(
    `http://localhost:3001/api/inventory/${storeNumber}/${partId}/receive`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: amount }),
    }
  );

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || 'Could not add stock.');
  }

  setInventory((current) =>
    current.map((item) =>
      item.part_id === partId ? { ...item, quantity: result.quantity } : item
    )
  );
}

  return (
    <div className="inventory-container">
        <Header title="Inventory"/>
        {isManager && (
          <div className="store-selector">
            <label htmlFor="inventory-store">View inventory for: </label>
            <select
              id="inventory-store"
              value={selectedStoreNumber}
              onChange={(event) => setSelectedStoreNumber(event.target.value)}
              disabled={stores.length === 0}
            >
              {stores.map((store) => (
                <option key={store.store_number} value={store.store_number}>
                  Store {store.store_number} - {store.street}, {store.city}, {store.state}
                </option>
              ))}
            </select>
            {storesError && <p role="alert">{storesError}</p>}
          </div>
        )}
        <p>Inventory for Store Number: {storeNumber}</p>
        {loading && <p>Loading inventory...</p>}
        {error && <p>Error: {error}</p>}
        {inventory.length === 0 && !loading && <p>No inventory data available.</p>}
        {inventory.length > 0 && <CreateInventory inventory={inventory} onAddStock={addStock} />}
    </div>
  );
}

export default Inventory;