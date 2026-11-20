import Header from './Header.jsx'
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

function PartInfo() {
  const { partId } = useParams();
  const [part, setPart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPart() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`http://localhost:3001/api/parts/${encodeURIComponent(partId)}`);
        if (!response.ok) throw new Error('Could not load this part');

        const data = await response.json();
        if(!cancelled) setPart(data);
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

  return (
    <div className="part-info-container">
      <Header title="Part Information"/>

      {loading && <p>Loading part...</p>}
      {error && <p role="alert">{error}</p>}

      {part && (
        <div className="part-info-details">
          <h2><strong>{part.name}</strong></h2>
          <p>{part.description}</p>
          
          <p><strong>Price:</strong> ${Number(part.price).toFixed(2)}</p>
          <p><strong>Condition:</strong> {part.part_condition}</p>

          {/* Tell the user relative stock amounts */}
          {part.in_stock > 5 && <p><strong>In stock</strong></p>}
          {part.in_stock > 0 && part.in_stock < 5 && <p><strong>Low in stock, order soon!</strong></p>}
          {part.in_stock <= 0 && <p><strong>Out of stock, check back soon!</strong></p>}
        </div>
      )}
    </div>
  );
}

export default PartInfo; 