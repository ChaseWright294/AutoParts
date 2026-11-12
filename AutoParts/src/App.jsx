import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Link } from 'react-router-dom';
import './App.css'

import Login from './Login.jsx'
import Join from './Join.jsx'
import EmployeeLogin from './EmployeeLogin.jsx'
import Home from './Home.jsx'
import Checkout from './Checkout.jsx'
import Inventory from './Inventory.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/join" element={<Join />} />
          <Route path="/employee-login" element={<EmployeeLogin />} />
          <Route path="/home" element={<Home />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/inventory" element={<Inventory />} />

        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
