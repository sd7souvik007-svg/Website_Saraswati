import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import PortfolioPage from './PortfolioPage.jsx'
import './styles.css'

const isPortfolio = window.location.pathname.replace(/\/+$/, '') === '/portfolio'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>{isPortfolio ? <PortfolioPage /> : <App />}</React.StrictMode>,
)
