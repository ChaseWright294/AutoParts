import { Link } from 'react-router-dom';
import Header from './Header.jsx'

function BackButton() {
    return (
        <Link to="/">
            <button>Login as Existing User</button>
        </Link>
    );
}

function Join() {
  return (
    <div className="join-container">
        <Header title="Join"/>

        <p>Already have an account?</p>
        <BackButton />
    </div>
  );
}

export default Join