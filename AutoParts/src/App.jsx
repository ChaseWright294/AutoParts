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
import Account from './Account.jsx'
import Orders from './Orders.jsx'
import PartInfo from './PartInfo.jsx'
import ManageEmployees from './ManageEmployees.jsx'


function App() {
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
          <Route path="/account" element={<Account />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/part-info/:partId" element={<PartInfo />} />
          <Route path="/manage-employees" element={<ManageEmployees />} />

        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
