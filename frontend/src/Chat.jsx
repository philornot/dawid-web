import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Loader2, Heart } from 'lucide-react';

// Stała URL API, z domyślną wartością localhost:5000, jeśli zmienna środowiskowa nie jest ustawiona
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Chat = () => {
  // Stan przechowujący wprowadzony przez użytkownika tekst
  const [input, setInput] = useState('');
  // Stan określający, czy trwa ładowanie odpowiedzi od bota
  const [loading, setLoading] = useState(false);
  // Stan określający, czy bot jest w trybie nauki
  const [isLearning, setIsLearning] = useState(false);
  // Stan przechowujący historię wiadomości (użytkownika i bota)
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Cześć! Jestem Dawid 😊' } // Początkowa wiadomość od bota
  ]);
  // Stan określający, czy tryb "sekretny" jest aktywny (easter egg)
  const [secretMode, setSecretMode] = useState(false);

  // Referencja do końca listy wiadomości, używana do automatycznego przewijania
  const messagesEndRef = useRef(null);
  // Referencja do pola input, używana do automatycznego fokusowania
  const inputRef = useRef(null);
  // Licznik kliknięć używany do aktywowania easter egga
  const clickCounter = useRef(0);

  // Automatyczne przewijanie do końca listy wiadomości przy każdej zmianie `messages`
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Automatyczne fokusowanie pola input po zamontowaniu komponentu
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Funkcja do przewijania do końca listy wiadomości
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Easter egg: po 7 kliknięciach w wiadomość bota, aktywowany jest tryb "sekretny"
  const handleSecretClick = () => {
    clickCounter.current += 1;
    if (clickCounter.current === 7) {
      setSecretMode(!secretMode);
      console.log('Secret mode toggled:', !secretMode); // Logowanie dla debugowania
    }
  };

  // Obsługa wysyłania wiadomości przez użytkownika
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return; // Ignoruj puste wiadomości

    try {
      // Dodaj wiadomość użytkownika do historii
      setMessages((prev) => [...prev, { role: 'user', content: input }]);
      setLoading(true); // Ustaw stan ładowania na true

      // Wysyłanie wiadomości do API
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok'); // Obsługa błędów sieciowych
      }

      const data = await response.json();
      // Dodaj odpowiedź bota do historii
      setMessages((prev) => [...prev, { role: 'bot', content: data.response }]);
      setIsLearning(data.state === 'learning'); // Ustaw tryb nauki, jeśli bot jest w trakcie nauki
    } catch (error) {
      console.error('Error sending message:', error); // Logowanie błędów
      // Dodaj komunikat o błędzie do historii
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: 'Przepraszam, coś poszło nie tak... 😅' },
      ]);
    } finally {
      setLoading(false); // Zakończ ładowanie
      setInput(''); // Wyczyść pole input
    }
  };

  // Memoizacja obłoczków: generowanie obłoczków tylko raz, aby uniknąć losowych zmian pozycji
  const staticClouds = useMemo(
    () =>
      [...Array(8)].map((_, i) => {
        const size = 100 + Math.random() * 100;
        return (
          <div
            key={i}
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
    [] // Pusta tablica zależności = generuj tylko raz
  );

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Tło gradientowe, zmieniające się w zależności od trybu "sekretnego" */}
      <div
        className={`absolute inset-0 ${
          secretMode
            ? 'bg-gradient-to-br from-[#ff61d2] via-[#ffb86c] to-[#7bed9f]'
            : 'bg-gradient-to-br from-[#301367] via-[#8a64e8] to-[#c293ff]'
        }`}
      />

      {/* Statyczne obłoczki w tle */}
      <div className="absolute inset-0 pointer-events-none z-10">{staticClouds}</div>

      {/* Główny kontener czatu */}
      <div className="relative z-20 max-w-4xl mx-auto p-4 h-screen flex flex-col">
        {/* Kontener wiadomości */}
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto space-y-4 pb-4 px-2">
            {/* Mapowanie wiadomości */}
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
                {/* Ikona serca w trybie "sekretnym" */}
                {secretMode && message.role === 'bot' && (
                  <Heart className="w-4 h-4 ml-2 inline-block text-pink-500" />
                )}
              </div>
            ))}
            {/* Wskaźnik ładowania */}
            {loading && (
              <div className="mr-auto bg-white/90 p-4 rounded-2xl max-w-[80%] shadow-xl">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-gray-600">Dawid pisze...</span>
                </div>
              </div>
            )}
            {/* Element do automatycznego przewijania */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Formularz do wysyłania wiadomości */}
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
            {/* Przycisk wysyłania */}
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