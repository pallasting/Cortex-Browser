import React, { useState } from 'react'
import './App.css'

function App() {
  const [url, setUrl] = useState('https://www.google.com')
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com')

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentUrl(url)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
  }

  return (
    <div className="App">
      <div className="browser-toolbar">
        <div className="navigation-buttons">
          <button onClick={() => window.history.back()} disabled>←</button>
          <button onClick={() => window.history.forward()} disabled>→</button>
          <button onClick={() => window.location.reload()}>↻</button>
        </div>
        <form onSubmit={handleUrlSubmit} className="url-form">
          <input
            type="text"
            value={url}
            onChange={handleUrlChange}
            placeholder="Enter URL..."
            className="url-input"
          />
          <button type="submit" className="go-button">Go</button>
        </form>
      </div>
      <div className="browser-content">
        <iframe
          src={currentUrl}
          title="Web Content"
          className="webview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  )
}

export default App