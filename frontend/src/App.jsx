import React from 'react'
import AppRoutes from './AppRoutes'
import { DDragonProvider } from './context/DDragonContext'
import './App.css'

function App() {
  return (
    <DDragonProvider>
      <div className="App">
        <AppRoutes />
      </div>
    </DDragonProvider>
  )
}

export default App
