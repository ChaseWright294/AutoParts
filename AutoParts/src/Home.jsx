import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react'
import './Home.css'
import Header from './Header.jsx'

function CreateProductCard({ product }) {
    const navigate = useNavigate();    

    return (
        <button className="product-card" onClick={() => navigate(`/part-info/${product.part_id}`)}>
            <h3>{product.name}</h3>
            <div className='product-card-details'>
                <p>Price: ${Number(product.price).toFixed(2)}</p>
            </div>
        </button>
    );
}

function Home() {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadParts() {
            try {
                const response = await fetch('http://localhost:3001/api/parts');
                if (!response.ok) throw new Error('Could not load parts from database')

                    const data = await response.json();
                    if (!cancelled) setProducts(data);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }


        loadParts();
        return () => {
            cancelled = true;
        };
    }, []);

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="home-container">
        <Header title="Auto Parts Store"/>

        <input
            className="part-search-bar"
            type="search"
            placeholder="Search parts"
            aria-label="Search parts"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="product-grid">
            {filteredProducts.map((product) => (
                <CreateProductCard key={product.part_id} product={product} />
            ))}
        </div>
        {loading && <p>Loading parts...</p>}
        {error && <p role="alert">{error}</p>}
    </div>
  );
}

export default Home