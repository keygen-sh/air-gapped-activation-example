import { v4 as uuidv4 } from 'uuid'
import ReactDOM from 'react-dom'
import React from 'react'
import App from './components/App'

// NOTE(ezekg) Simplistic device fingerprinting
if (!localStorage.getItem('guid')) {
  localStorage.setItem('guid', uuidv4())
}

ReactDOM.render(<App />, document.getElementById('root'))
