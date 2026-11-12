import { Link } from 'react-router-dom';

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
        <h2>Join</h2>

        <p>Already have an account?</p>
        <BackButton />
    </div>
  );
}

export default Join