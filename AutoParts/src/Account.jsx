import Header from './Header.jsx'
import { useAuth } from './AuthContext.jsx';
import './Account.css'

function UserInfo() {
  const { user } = useAuth();

  if (!user) {
    return <p>Error: No user signed in</p>;
  }

  if (user?.role === 'employee') {
    return (
      <div className="user-info">
        <div className = 'titles'>
          <p><strong>Name:</strong></p>
          <p><strong>Username:</strong></p>
          <p><strong>Email:</strong></p>
          <p><strong>Employee ID:</strong></p>
          <p><strong>Store Number:</strong></p>
          <p><strong>Role:</strong></p>
        </div>
        <div className = 'info'>
          <p>{user.first_name} {user.last_name}</p>
          <p>{user.username}</p>
          <p>{user.work_email}</p>
          <p>{user.employee_id}</p>
          <p>{user.store_number}</p>
          <p>{user.role}</p>
        </div>


        
      </div>
    );
  }

  return (
    <div className="user-info">
      <div className = 'titles'>
        <p><strong>Name:</strong></p>
        <p><strong>Username:</strong></p>
        <p><strong>Email:</strong></p>
        <p><strong>Phone:</strong></p>
        <p><strong>Saved shipping address:</strong></p>
      </div>
      <div className = 'info'>
        <p>{user.first_name} {user.last_name}</p>
        <p>{user.username}</p>
        <p>{user.email}</p>
        <p>{user.phone_number}</p>
        <p>{user.street}, {user.city}, {user.state} {user.zip}</p>
      </div>
    </div>
  );
}

function Account() {
  return (
    <div className="account-container">
      <Header title="Account Info"/>
      <UserInfo />
    </div>
  );
}

export default Account;
