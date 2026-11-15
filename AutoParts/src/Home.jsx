import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react'
import './Home.css'
import Header from './Header.jsx'

//TODO: need function that pulls all partIDs, names, and prices from the database and populates this list
const products = [
    {part_id: 1, name: "Spark Plug",  price: 13.49},
    {part_id: 2, name: "American Tire", price: 204.99},
    {part_id: 3, name: "Bus wheel", price: 399.95},
    {part_id: 4, name: "Car battery", price: 89.99},
    {part_id: 5, name: "Brake pads", price: 49.99},
    {part_id: 6, name: "Oil filter", price: 15.99},
    {part_id: 7, name: "Windshield wipers", price: 29.99},
    {part_id: 8, name: "Headlights", price: 79.99},
    {part_id: 9, name: "Tail lights", price: 59.99},
    {part_id: 10, name: "Radiator", price: 199.99},
    {part_id: 11, name: "Alternator", price: 149.99},
    {part_id: 12, name: "Starter motor", price: 129.99},
    {part_id: 13, name: "Fuel pump", price: 179.99}
];

function CreateProductCard({ product }) {
const navigate = useNavigate();

    return (
        <button className="product-card" onClick={() => navigate(`/part-info/${product.part_id}`)}>
            <h3>{product.name}</h3>
            <div className='product-card-details'>
                <p>Price: ${product.price.toFixed(2)}</p>
            </div>
        </button>
    );
}

function LoadStoreItems() {}

function Home() {
    const [searchTerm, setSearchTerm] = useState('');

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
    </div>
  );
}

export default Home