import React, { useState, useRef, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Chat = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Cześć! Jestem Dawid 😊' }
  ]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', content: data.response }]);
      setIsLearning(data.state === 'learning');
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Przepraszam, coś poszło nie tak... 😅' 
      }]);
      setIsLearning(false);
    } finally {
      setLoading(false);
      setInput('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-500 text-white ml-auto' 
                : 'bg-white text-gray-800 shadow-sm'
            } max-w-[80%] break-words`}
          >
            {message.content}
          </div>
        ))}
        {loading && (
          <div className="bg-white text-gray-800 p-3 rounded-lg max-w-[80%] shadow-sm animate-pulse">
            Dawid pisze...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-auto">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLearning ? "Naucz mnie odpowiedzi... (lub napisz 'skip')" : "Napisz wiadomość..."}
            className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Wyślij
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;