import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "./App.css";
import LoginPage from './components/login';
import NotFoundPage from "./components/not-found-page"; 
import Product from "./pages/file-uplader"; 

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} /> 
        <Route path="product" element={<Product />} /> 
      </Routes>
    </Router>
  );
}

export default App;
