import { Link } from 'react-router-dom';

function LoginButton() {
    return (
        //later, check database for matching username and password, if match, go to home page, else display error message
        <Link to="/Home">
            <button>Login</button>
        </Link>
    );
}

function JoinButton() {
    return (
        <Link to="/join">
            <button>Create Account</button>
        </Link>
    );
}

function EmployeeLoginButton() {
    return (
        <Link to="/employee-login">
            <button>Employee Login</button>
        </Link>
    );
}

function Login() {
  return (
    <div className="login-container">
        <h2>Login</h2>
        <form>Username: <input type="text" name="username" /></form>
        <form>Password: <input type="password" name="password" /></form>
        <LoginButton />

        <p>Don't have an account?</p>
        <JoinButton />

        <p>For Staff Members</p>
        <EmployeeLoginButton />
    </div>
  );
}

export default Login