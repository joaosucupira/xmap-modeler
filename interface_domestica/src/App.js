import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import './App.css';
import Home from './components/Home.js'
import Login from './components/Login.js'
import SignUp from './components/SignUp.js';
import Recuperar from './components/Recuperar.js';
import { CssVarsProvider } from '@mui/joy/styles';
import { display, flex } from '@mui/system';
import ModeToggle from './components/ModeToggle.js';

function App(props) {
  return (               

    <Router>
      <nav>
        <ul className='page_bar'>
          <li>
            <CssVarsProvider {...props}>
              <ModeToggle />
            </CssVarsProvider>
          </li>
          <li>
            <Link to="/home">Home</Link>
          </li>
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/cadastro">Cadastro</Link>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path='/cadastro' element={<SignUp/>}/>
        <Route path='/recuperar' element={<Recuperar/>}/>

      </Routes>
    </Router>
  );
}

export default App;