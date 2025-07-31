import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "./App.css";
import LoginPage from './components/login';
import NotFoundPage from "./components/not-found-page"; 
import FileUpload from "./pages/file-uplader"; 

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} /> 
        <Route path="fileUpload" element={<FileUpload />} /> 
      </Routes>
    </Router>
  );
}

export default App;
