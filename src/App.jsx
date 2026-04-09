import React, { useState, useRef } from 'react';
import AudioInput from './components/AudioInput';
import { startListening, stopListening } from './utils/audioProcessor';
import './App.css';

function App() {
  const [status, setStatus] = useState('Idle');
  const [currentKeywords, setCurrentKeywords] = useState([]);
  const socketRef = useRef(null);

  const handleStartListening = async (keywords) => {
    setCurrentKeywords(keywords);
    setStatus('Listening');

    // Connect to WebSocket
    socketRef.current = new WebSocket('ws://localhost:8000/ws/audio');

    socketRef.current.onopen = () => {
      console.log('Connected to audio backend');
      console.log('Sending keywords:', keywords);
      socketRef.current.send(JSON.stringify({ type: 'keywords', keywords }));
    };

    socketRef.current.onmessage = (event) => {
      console.log('Backend message:', event.data);

      try {
        const data = JSON.parse(event.data);
        if (data.text) {
          const utterance = new SpeechSynthesisUtterance(data.text);
          window.speechSynthesis.speak(utterance);
        }
      } catch (e) {
        // Fallback for plain text messages
        const utterance = new SpeechSynthesisUtterance(event.data);
        window.speechSynthesis.speak(utterance);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socketRef.current.onclose = () => {
      console.log('Disconnected from audio backend');
    };

    try {
      // Small delay to ensure backend receives keywords before streaming starts
      await new Promise(resolve => setTimeout(resolve, 300));

      await startListening((audioChunk) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(audioChunk);
        }
      });
    } catch (error) {
      console.error('Failed to start listening:', error);
      setStatus('Idle');
      if (socketRef.current) socketRef.current.close();
    }
  };

  const handleStopListening = () => {
    stopListening();
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus('Idle');
    setCurrentKeywords([]);
  };

  return (
    <div className="App">
      <AudioInput onStart={handleStartListening} onStop={handleStopListening} status={status} />
    </div>
  );
}

export default App;
