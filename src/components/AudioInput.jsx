import React, { useState } from 'react';

const AudioInput = ({ onStart, onStop, status }) => {
  const [keywords, setKeywords] = useState('');

  const handleStart = () => {
    onStart(keywords.split(',').map(kw => kw.trim()).filter(Boolean));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Real-time Audio Processor</h1>
      <div>
        <label htmlFor="keywords">Keywords (comma-separated): </label>
        <input
          id="keywords"
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g., hello, world, test"
          style={{ width: '300px', padding: '8px', marginRight: '10px' }}
        />
      </div>
      <div style={{ marginTop: '15px' }}>
        <button
          onClick={handleStart}
          disabled={status === 'Listening'}
          style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Start
        </button>
        <button
          onClick={onStop}
          disabled={status === 'Idle'}
          style={{ padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Stop
        </button>
      </div>
      <p style={{ marginTop: '15px', fontSize: '1.2em' }}>Status: <strong>{status}</strong></p>
    </div>
  );
};

export default AudioInput;
