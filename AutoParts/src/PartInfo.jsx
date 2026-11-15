import Header from './Header.jsx'
import { useParams } from 'react-router-dom';

function PartInfo() {
  const { partId } = useParams();
  //TODO: need way to fetch part information from the database using the partId

  return (
    <div className="part-info-container">
      <Header title="Part Information"/>
      <div className="part-info-details">
        <h2>Part ID: {partId}</h2>
        {/* Additional part information can be displayed here */}
      </div>
    </div>
  );
}

export default PartInfo;