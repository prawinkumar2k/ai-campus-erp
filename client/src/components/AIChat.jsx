import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AIChat.css';

const AIChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const { getAuthHeaders } = useAuth();

  // Load suggestions on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        // Use relative path - Vite proxy will handle routing to backend
        const response = await axios.get('/api/ai/suggestions', {
          headers: getAuthHeaders(),
        });
        setSuggestions(response.data.suggestions || []);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
        // Set default suggestions on error
        setSuggestions([
          'Show my attendance',
          'What are my marks?',
          'List assignments',
          'Show my timetable',
          'Check my fees',
        ]);
      }
    };
    if (isOpen) {
      loadSuggestions();
    }
  }, [isOpen, getAuthHeaders]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message = input) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = { id: Date.now(), role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Use relative path - Vite proxy will forward to http://localhost:5000/api/ai/process-command
      const response = await axios.post(
        '/api/ai/process-command',
        { message },
        { headers: getAuthHeaders() }
      );

      const data = response.data;
      const botMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply,
        data: data.data || null,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('AI request failed:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content:
          error.response?.data?.reply ||
          'Sorry, I encountered an error processing your request.',
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-chat-modal">
      <div className="ai-chat-container">
        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-chat-title">
            <div className="ai-logo">🤖</div>
            <div>
              <h3>AI Assistant</h3>
              <p className="ai-status">Always ready to help</p>
            </div>
          </div>
          <button
            className="ai-close-btn"
            onClick={onClose}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        {/* Messages Area */}
        <div className="ai-chat-messages">
          {messages.length === 0 ? (
            <div className="ai-empty-state">
              <div className="ai-welcome-icon">👋</div>
              <h4>Welcome to AI Assistant</h4>
              <p>Ask me about attendance, marks, assignments, fees, and more!</p>
              <div className="ai-suggestions-grid">
                {suggestions.map((suggestion, idx) => {
                  const text = typeof suggestion === 'string' ? suggestion : suggestion.message || suggestion.text || JSON.stringify(suggestion);
                  return (
                    <button
                      key={idx}
                      className="ai-suggestion-pill"
                      onClick={() => handleSendMessage(typeof suggestion === 'string' ? suggestion : suggestion.message)}
                    >
                      {text}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`ai-message ${msg.role} ${
                    msg.error ? 'error' : ''
                  }`}
                >
                  <div className="ai-message-content">
                    <p>{typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}</p>
                    {msg.data && (
                      <div className="ai-message-data">
                        <pre>{JSON.stringify(msg.data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="ai-message assistant loading">
                  <div className="ai-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="ai-chat-input-area">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="ai-chat-form"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything... (e.g., 'Show my attendance')"
              disabled={loading}
              className="ai-chat-input"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="ai-send-btn"
              aria-label="Send message"
            >
              {loading ? '⏳' : '📤'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
