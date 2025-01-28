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
      console.error('Błąd:', error); // Dodano użycie zmiennej error
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Przepraszam, coś poszło nie tak... 😅' 
      }]);
      setIsLearning(false);
    } finally {
      setLoading(false);
      setInput('');
      // Naprawiony focus z opóźnieniem na potrzeby renderowania
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#301367] via-[#8a64e8] to-[#c293ff] animate-gradient-flow overflow-hidden">
      {/* Animated fog layers */}
      <div className="absolute inset-0 opacity-20 pointer-events-none -z-10">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className={`absolute -top-20 -left-20 w-96 h-96 
              bg-gradient-to-r from-purple-400/30 to-pink-300/30 
              rounded-full blur-3xl animate-fog
              ${i === 0 ? 'animate-delay-1000' : i === 1 ? 'animate-delay-3000' : 'animate-delay-5000'}`}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col relative">
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto space-y-4 pb-4 px-2">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`
                  p-4 rounded-2xl backdrop-blur-lg 
                  transition-all duration-500 ease-out
                  animate-message-entrance
                  ${message.role === 'user' 
                    ? 'ml-auto bg-gradient-to-r from-[#8a64e8] to-[#6d28d9] text-white shadow-xl shadow-purple-500/30 max-w-[80%]' 
                    : 'mr-auto bg-white/90 text-gray-800 shadow-xl shadow-purple-500/10 max-w-[80%]'
                  }
                  hover:scale-[1.02] transform-gpu transition-transform duration-300
                `}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="mr-auto bg-white/90 p-4 rounded-2xl max-w-[80%] shadow-xl shadow-purple-500/10 backdrop-blur-lg">
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
          <div className="relative flex items-center gap-2">
            <div className="relative w-full">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLearning ? "Naucz mnie odpowiedzi... (lub napisz 'skip')" : "Napisz wiadomość..."}
                className="
                  w-full p-4 pr-16 
                  bg-white/90 backdrop-blur-lg
                  border border-purple-200/50
                  rounded-2xl shadow-xl shadow-purple-500/10
                  placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-purple-400/50
                  transition-all duration-300
                  hover:bg-white/95
                  relative overflow-hidden
                "
                disabled={loading}
              />
              {/* Shine effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-20 pointer-events-none animate-shine"/>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="
                absolute right-3 top-1/2 -translate-y-1/2
                p-2.5 w-10 h-10
                bg-gradient-to-r from-[#8a64e8] to-[#6d28d9]
                text-white
                hover:opacity-90
                focus:outline-none focus:ring-2 focus:ring-purple-400/50
                disabled:opacity-50
                transition-all duration-500
                rounded-xl
                flex items-center justify-center
                before:absolute before:inset-0 
                before:bg-[radial-gradient(200px_circle_at_var(--x)_var(--y),#ffffff55,transparent)] 
                before:opacity-0 hover:before:opacity-100
              "
              style={{ '--x': '50%', '--y': '50%' }}
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