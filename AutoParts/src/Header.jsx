import './Header.css'
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

//function to create account menu and provide dropdown functionality
function AccountMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
	const { logout } = useAuth();

    const toggleMenu = () => {
        setIsOpen((open) => !open);
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className='account-menu-container' ref={menuRef}>
            <button
                type='button'
                className='account-button'
                aria-label='Open account menu'
                aria-haspopup='menu'
                aria-expanded={isOpen}
                onClick={toggleMenu}
            />
            {isOpen && (
                <div className='account-menu' role='menu'>
                    <Link to="/account" className='account-menu-option' role='menuitem' onClick={() => setIsOpen(false)}>
                        Account Info
                    </Link>
                    
                    <Link to="/orders" className='account-menu-option' role='menuitem' onClick={() => setIsOpen(false)}>
                        Previous Orders
                    </Link>
                    
                    <Link to="/" className='account-menu-option' role='menuitem' onClick={() => {
                        setIsOpen(false);
                        //TODO: Clear user session
                        logout();
                    }}>
                        Logout
                    </Link>
                </div>
            )}
        </div>
    );
}

const pathsToHideAccount = ["/", "/join", "/employee-login"]; //paths that the account button need not be displayed

function Header({ title }) {
    const { pathname } = useLocation();
    const shouldBeHidden = pathsToHideAccount.includes(pathname);

    return(
        <div className='header-container'>
            {!shouldBeHidden && (
                <div className = "home-button-container">
                    <Link to="/Home">
                        <button className='home-button' aria-label='Go to home page'>
                            Home
                        </button>
                    </Link>
            </div>)}
            <h2 className='title-text'>{title}</h2>
            {!shouldBeHidden && <AccountMenu />}
        </div>
    );
}

export default Header;