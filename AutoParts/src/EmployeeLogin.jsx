import { Link } from 'react-router-dom';

function LoginButton() {
    return (
        //later, check database for matching username and password, if match, go to home page, else display error message
        <Link to="/Home">
            <button>Login</button>
        </Link>
    );
}

function BackButton() {
    return (
        <Link to="/">
            <button>Login as Existing User</button>
        </Link>
    );
}

function EmployeeLogin() {
  return (
    <div className="employee-login-container">
        <h2>Employee Login</h2>
        <form>Username: <input type="text" name="username" /></form>
        <form>Password: <input type="password" name="password" /></form>
        <LoginButton />

        <p>Not an employee?</p>
        <BackButton />
    </div>
  );
}

export default EmployeeLogin