import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col">
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto space-y-4 pb-4 px-2">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`
                  p-4 rounded-2xl backdrop-blur-sm 
                  transition-all duration-300 ease-in-out
                  ${message.role === 'user' 
                    ? 'ml-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white max-w-[80%] shadow-lg shadow-purple-200' 
                    : 'mr-auto bg-white/80 text-gray-800 max-w-[80%] shadow-lg'
                  }
                `}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="mr-auto bg-white/80 p-4 rounded-2xl max-w-[80%] shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-gray-600">Dawid pisze...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 relative">
          <div className="relative flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLearning ? "Naucz mnie odpowiedzi... (lub napisz 'skip')" : "Napisz wiadomość..."}
              className="
                w-full p-4 pr-12 
                bg-white/80 backdrop-blur-sm
                border border-purple-100
                rounded-2xl shadow-lg
                placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-purple-400
                transition-all duration-200
              "
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading}
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                p-2 rounded-xl
                bg-gradient-to-r from-purple-600 to-indigo-600
                text-white
                hover:opacity-90
                focus:outline-none focus:ring-2 focus:ring-purple-400
                disabled:opacity-50
                transition-all duration-200
              "
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;