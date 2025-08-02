import { useState, useRef, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Losowe teksty dla różnych stanów
const NORMAL_MESSAGES = [
  "Porozmawiaj ze mną",
  "Jestem gotowy na rozmowę",
  "Co chcesz wiedzieć?",
  "Możemy pogadać",
  "Słucham cię",
  "Jestem tu dla ciebie",
  "Opowiedz mi coś",
  "Zadaj mi pytanie",
  "Co cię interesuje?",
  "Zacznijmy rozmowę",
];

const LEARNING_MESSAGES = [
  "Tryb uczenia - naucz mnie czegoś nowego",
  "Uczę się - powiedz mi więcej",
  "Chcę się od ciebie nauczyć",
  "Wyjaśnij mi to proszę",
  "Nie wiem tego, pomożesz mi?",
];

const Chat = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageKey, setMessageKey] = useState(0); // Do animacji fade
  const [lastError, setLastError] = useState(null); // Do przechowywania błędu
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      content: "Cześć! Jestem Dawid",
      timestamp: Date.now(),
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const intervalRef = useRef(null);

  // Scroll do dołu po dodaniu nowej wiadomości
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus na input po zakończeniu ładowania
  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  // Focus na input po montowaniu komponentu
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Funkcja do losowania wiadomości
  const getRandomMessage = useCallback((messagesArray) => {
    return messagesArray[Math.floor(Math.random() * messagesArray.length)];
  }, []);

  // Funkcja do ustawiania nowej losowej wiadomości z animacją
  const setRandomMessage = useCallback(() => {
    const messagesArray = isLearning ? LEARNING_MESSAGES : NORMAL_MESSAGES;
    const newMessage = getRandomMessage(messagesArray);
    setCurrentMessage(newMessage);
    setMessageKey((prev) => prev + 1); // Trigger animacji fade
  }, [isLearning, getRandomMessage]);

  // Inicjalizacja wiadomości przy pierwszym ładowaniu
  useEffect(() => {
    setRandomMessage();
  }, []);

  // Zmiana wiadomości przy zmianie trybu
  useEffect(() => {
    setRandomMessage();
  }, [isLearning, setRandomMessage]);

  // Interval na zmianę wiadomości co 5 minut
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRandomMessage();
    }, 5 * 60 * 1000); // 5 minut

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [setRandomMessage]);

  const addMessage = useCallback((role, content) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        role,
        content,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    // Dodaj wiadomość użytkownika
    addMessage("user", trimmedInput);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmedInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Dodaj odpowiedź bota
      addMessage("bot", data.response);
      setIsLearning(data.state === "learning");
    } catch (error) {
      console.error("Chat error:", error);

      // Przechowaj szczegóły błędu
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: `${API_URL}/chat`,
        userMessage: trimmedInput,
      };
      setLastError(errorDetails);

      addMessage(
        "bot",
        "Przepraszam, coś poszło nie tak... Sprawdź połączenie z serwerem."
      );
      setIsLearning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Funkcja do kopiowania błędu do schowka
  const copyErrorToClipboard = async () => {
    if (!lastError) return;

    const errorText = `=== DAWID DEBUG INFO ===
Timestamp: ${lastError.timestamp}
URL: ${lastError.url}
User Message: ${lastError.userMessage}
Error: ${lastError.message}
Stack: ${lastError.stack}
Browser: ${navigator.userAgent}
===========================`;

    try {
      await navigator.clipboard.writeText(errorText);
      // Pokazanie krótkie potwierdzenia
      const originalError = lastError;
      setLastError({ ...lastError, copied: true });
      setTimeout(() => {
        setLastError(originalError);
      }, 2000);
    } catch (err) {
      console.error("Nie można skopiować do schowka:", err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 flex flex-col">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-purple-800 mb-2">
          Dawid
        </h1>
        <p
          key={messageKey}
          className="text-xs sm:text-sm text-purple-600 transition-opacity duration-500 ease-in-out animate-fade-in px-2"
        >
          {currentMessage}
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 mb-3 sm:mb-4 px-1 sm:px-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div className="flex flex-col">
              <div
                className={`p-2 sm:p-3 rounded-2xl max-w-[85%] sm:max-w-[80%] break-words shadow-sm text-sm sm:text-base ${
                  message.role === "user"
                    ? "bg-purple-500 text-white rounded-br-sm"
                    : "bg-white text-gray-800 rounded-bl-sm border border-purple-200"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`text-xs mt-1 opacity-70 ${
                    message.role === "user"
                      ? "text-purple-100"
                      : "text-gray-500"
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString("pl-PL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {/* Debug button dla błędów serwera */}
              {message.role === "bot" &&
                message.content ===
                  "Przepraszam, coś poszło nie tak... Sprawdź połączenie z serwerem." &&
                lastError && (
                  <button
                    onClick={copyErrorToClipboard}
                    className="mt-1 self-start text-xs px-2 py-1 bg-red-100 text-red-600 rounded border border-red-200 hover:bg-red-200 transition-colors"
                  >
                    {lastError.copied ? "✓ Skopiowano!" : "🐛 Pokaż błąd"}
                  </button>
                )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 p-2 sm:p-3 rounded-2xl rounded-bl-sm max-w-[85%] sm:max-w-[80%] shadow-sm border border-purple-200">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-xs sm:text-sm text-gray-600">
                  Dawid pisze...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="mt-auto bg-white rounded-lg shadow-md p-2 sm:p-3 border border-purple-200">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 sm:gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={
                isLearning
                  ? "Naucz mnie odpowiedzi... (lub napisz 'skip')"
                  : "Napisz wiadomość do Dawida..."
              }
              className="flex-1 p-2 sm:p-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50 transition-colors text-sm sm:text-base"
              disabled={loading}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 sm:px-6 py-2 sm:py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
            >
              {loading ? "..." : "Wyślij"}
            </button>
          </div>

          {/* Character counter */}
          <div className="text-xs text-purple-500 mt-1 sm:mt-2 text-right">
            {input.length}/500 znaków
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
