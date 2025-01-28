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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }); // Śledzenie pozycji myszy
  const [isScattered, setIsScattered] = useState(false); // Stan rozproszenia mgły
  
  const messagesEndRef = useRef(null); // Ref do przewijania na dół
  const inputRef = useRef(null); // Ref do inputu
  const fogContainerRef = useRef(null); // Ref do kontenera mgły

  useEffect(() => {
    inputRef.current?.focus(); // Automatyczne ustawienie focusu na input po załadowaniu komponentu
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); // Przewijanie na dół po nowej wiadomości
  };

  useEffect(() => {
    scrollToBottom(); // Przewijanie na dół przy każdej zmianie wiadomości
  }, [messages]);

  // Obsługa ruchu myszy
  const handleMouseMove = (e) => {
    if (!fogContainerRef.current) return;
    const rect = fogContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // Obliczenie pozycji X myszy w procentach
    const y = ((e.clientY - rect.top) / rect.height) * 100; // Obliczenie pozycji Y myszy w procentach
    setMousePosition({ x, y }); // Aktualizacja pozycji myszy
  };

  // Obsługa wysłania wiadomości
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: input }]); // Dodanie wiadomości użytkownika
    setLoading(true); // Ustawienie stanu ładowania

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', content: data.response }]); // Dodanie odpowiedzi bota
      setIsLearning(data.state === 'learning'); // Ustawienie stanu nauki
    } catch (error) {
      console.error('Błąd:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Przepraszam, coś poszło nie tak... 😅' 
      }]);
      setIsLearning(false);
    } finally {
      setLoading(false);
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 0); // Powrót focusu do inputu po wysłaniu wiadomości
    }
  };

  // Nowa funkcja do generowania losowych parametrów obłoczków
  const generateCloudParams = (i) => ({
    size: 100 + Math.random() * 100,
    x: Math.random() * 100,
    y: Math.random() * 100,
    hue: 270 + Math.sin(Date.now() / 5000 + i) * 30, // Płynna zmiana odcienia
    speed: 0.2 + Math.random() * 0.3
  });

  const handleFogClick = () => {
    setIsScattered(true);
    setTimeout(() => setIsScattered(false), 500 + Math.random() * 1500);
  };

  return (
    <div className="min-h-screen overflow-hidden relative" onClick={handleFogClick}>
      {/* Gradientowe tło */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#301367] via-[#8a64e8] to-[#c293ff] animate-gradient-flow" />

      {/* Kontener obłoczków */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        ref={fogContainerRef}
        onMouseMove={handleMouseMove}
      >
        {[...Array(8)].map((_, i) => {
          const params = generateCloudParams(i);
          const scatter = isScattered ? {
            x: (Math.random() - 0.5) * 50,
            y: (Math.random() - 0.5) * 50,
            scale: 1 + Math.random() * 0.5
          } : { x: 0, y: 0, scale: 1 };

          return (
            <div
              key={i}
              className={`absolute rounded-full blur-[40px]
                transition-all duration-[3000ms] ease-out`}
              style={{
                width: `${params.size}px`,
                height: `${params.size}px`,
                backgroundColor: `hsl(${params.hue}, 70%, 70%)`,
                opacity: 0.6,
                mixBlendMode: 'soft-light',
                transform: `translate(
                  ${mousePosition.x * params.speed + scatter.x}%,
                  ${mousePosition.y * params.speed + scatter.y}%
                ) scale(${scatter.scale})`,
                top: `${params.y}%`,
                left: `${params.x}%`,
                animation: `fogPulse ${5 + i}s ease-in-out infinite`
              }}
            />
          );
        })}
      </div>

      {/* Główny kontener czatu */}
      <div className="relative z-20 max-w-4xl mx-auto p-4 h-screen flex flex-col">
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
                    ? 'ml-auto bg-gradient-to-r from-[#8a64e8] to-[#6d28d9] text-white shadow-xl shadow-purple-500/30 max-w-[80%] break-words' 
                    : 'mr-auto bg-white/90 text-gray-800 shadow-xl shadow-purple-500/10 max-w-[80%] break-words'
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
            <div ref={messagesEndRef} /> {/* Ref do przewijania na dół */}
          </div>
        </div>

        {/* Formularz wysyłania wiadomości */}
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
              {/* Efekt błysku na input */}
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