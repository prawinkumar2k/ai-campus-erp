import React, { useState } from 'react';
import AIChat from './AIChat';
import './AIFloatingButton.css';

const AIFloatingButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="ai-floating-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Open AI Assistant"
        aria-label="Open AI Assistant"
      >
        <span className="ai-btn-icon">🤖</span>
        {!isOpen && <span className="ai-btn-label">Ask AI</span>}
      </button>
      <AIChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default AIFloatingButton;
