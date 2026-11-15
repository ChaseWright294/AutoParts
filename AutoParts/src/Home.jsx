import { Link } from 'react-router-dom';
import './Home.css'
import Header from './Header.jsx'

//TODO: need function that pulls all of these from the database and populates this list
const products = [
    {part_id: 1, name: "Spark Plug", description: "It plugs the sparks", price: 13.49, part_condition: "new"},
    {part_id: 2, name: "American Tire", description: "", price: 204.99, part_condition: "new"},
    {part_id: 3, name: "Bus wheel", description: "Goes round and round", price: 399.95, part_condition: "new"}
];

function CreateProductCard({ product }) {
    return (
        <button className="product-card">
            <h3>{product.name}</h3>
            <div className='product-card-details'>
                <p>{product.description}</p>
                <p>Price: ${product.price.toFixed(2)}</p>
                <p>Condition: {product.part_condition}</p>
            </div>
        </button>
    );
}

function LoadStoreItems() {}

function Home() {
  return (
    <div className="home-container">
        <Header title="Auto Parts Store"/>
        <div className="product-grid">
            {products.map((product) => (
                <CreateProductCard key={product.part_id} product={product} />
            ))}
        </div>
    </div>
  );
}

export default Home