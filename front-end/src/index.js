import React from 'react'
import ReactDOM from 'react-dom/client'
import './scss/main.scss'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { Helmet } from 'react-helmet'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <BrowserRouter>
    <React.StrictMode>
      <Helmet>
        <link rel="canonical" href="https://demo.com" />
        { process.env.NODE_ENV === 'development' ? <meta name="robots" content="noindex, nofollow" /> : <meta name="robots" content="all" /> }
      </Helmet>
      <App />
    </React.StrictMode>
  </BrowserRouter>
)

