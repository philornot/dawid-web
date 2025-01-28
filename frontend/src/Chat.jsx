import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Loader2, Heart } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Chat = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Cześć! Jestem Dawid 😊' }
  ]);
  const [secretMode, setSecretMode] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const clickCounter = useRef(0);

  // Referencje do przechowywania pozycji chmurek i kursora
  const cloudsRef = useRef([]);
  const mousePositionRef = useRef({ x: 0, y: 0 });

  // Efekt do śledzenia pozycji kursora myszy
  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Efekt do animowania chmurek
  useEffect(() => {
    const animateClouds = () => {
      cloudsRef.current.forEach((cloud, index) => {
        const cloudElement = cloud.current;
        if (!cloudElement) return;

        const cloudRect = cloudElement.getBoundingClientRect();
        const cloudCenterX = cloudRect.left + cloudRect.width / 2;
        const cloudCenterY = cloudRect.top + cloudRect.height / 2;

        const mouseX = mousePositionRef.current.x;
        const mouseY = mousePositionRef.current.y;

        // Oblicz odległość między chmurką a kursorem
        const distance = Math.sqrt((mouseX - cloudCenterX) ** 2 + (mouseY - cloudCenterY) ** 2);

        // Jeśli kursor jest blisko, chmurka ucieka
        if (distance < 100) {
          const angle = Math.atan2(cloudCenterY - mouseY, cloudCenterX - mouseX);
          const speed = 5; // Szybkość ucieczki
          const newX = cloudRect.left + Math.cos(angle) * speed;
          const newY = cloudRect.top + Math.sin(angle) * speed;

          cloudElement.style.left = `${newX}px`;
          cloudElement.style.top = `${newY}px`;
        } else {
          // W przeciwnym razie chmurka podąża za kursorem
          const speed = 0.5; // Szybkość podążania
          const deltaX = (mouseX - cloudCenterX) * speed;
          const deltaY = (mouseY - cloudCenterY) * speed;

          cloudElement.style.left = `${cloudRect.left + deltaX * 0.01}px`;
          cloudElement.style.top = `${cloudRect.top + deltaY * 0.01}px`;
        }
      });

      requestAnimationFrame(animateClouds);
    };

    animateClouds();
  }, []);

  // Memoizacja chmurek
  const staticClouds = useMemo(
    () =>
      [...Array(8)].map((_, i) => {
        const size = 100 + Math.random() * 100;
        const cloudRef = React.createRef();
        cloudsRef.current[i] = cloudRef;

        return (
          <div
            key={i}
            ref={cloudRef}
            className="absolute rounded-full blur-[40px]"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: `hsl(${270 + Math.random() * 30}, 70%, 70%)`,
              opacity: 0.6,
              mixBlendMode: 'soft-light',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        );
      }),
    []
  );

  // Reszta kodu pozostaje bez zmian
  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => scrollToBottom(), [messages]);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSecretClick = () => {
    clickCounter.current += 1;
    if (clickCounter.current === 7) setSecretMode(!secretMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      setMessages((prev) => [...prev, { role: 'user', content: input }]);
      setLoading(true);

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'bot', content: data.response }]);
      setIsLearning(data.state === 'learning');
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: 'Przepraszam, coś poszło nie tak... 😅' },
      ]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      <div
        className={`absolute inset-0 ${
          secretMode
            ? 'bg-gradient-to-br from-[#ff61d2] via-[#ffb86c] to-[#7bed9f]'
            : 'bg-gradient-to-br from-[#301367] via-[#8a64e8] to-[#c293ff]'
        }`}
      />

      <div className="absolute inset-0 pointer-events-none z-10">{staticClouds}</div>

      <div className="relative z-20 max-w-4xl mx-auto p-4 h-screen flex flex-col">
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto space-y-4 pb-4 px-2">
            {messages.map((message, index) => (
              <div
                key={index}
                onClick={message.role === 'bot' ? handleSecretClick : undefined}
                className={`p-4 rounded-2xl backdrop-blur-lg cursor-pointer ${
                  message.role === 'user'
                    ? 'ml-auto bg-gradient-to-r from-[#8a64e8] to-[#6d28d9] text-white'
                    : 'mr-auto bg-white/90 text-gray-800'
                } ${secretMode && 'shadow-lg animate-pulse'} shadow-xl max-w-[80%] break-words`}
              >
                {message.content}
                {secretMode && message.role === 'bot' && (
                  <Heart className="w-4 h-4 ml-2 inline-block text-pink-500" />
                )}
              </div>
            ))}
            {loading && (
              <div className="mr-auto bg-white/90 p-4 rounded-2xl max-w-[80%] shadow-xl">
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
                placeholder={isLearning ? 'Naucz mnie odpowiedzi...' : 'Napisz wiadomość...'}
                className="w-full p-4 pr-16 bg-white/90 backdrop-blur-lg border border-purple-200/50 rounded-2xl shadow-xl placeholder-gray-500 focus:outline-none"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-[#8a64e8] to-[#6d28d9] text-white rounded-xl"
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