import { useState, useRef, useEffect, useCallback } from "react";
import ChatHeader from "./components/ChatHeader";
import MessagesContainer from "./components/MessagesContainer";
import ChatInput from "./components/ChatInput";
import { NORMAL_MESSAGES, LEARNING_MESSAGES } from "./constants/messages";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Chat = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageKey, setMessageKey] = useState(0);
  const [lastError, setLastError] = useState(null);
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
    setMessageKey((prev) => prev + 1);
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
    }, 5 * 60 * 1000);

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

      addMessage("bot", data.response);
      setIsLearning(data.state === "learning");
    } catch (error) {
      console.error("Chat error:", error);

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

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
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-4 min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 flex flex-col">
      <ChatHeader currentMessage={currentMessage} messageKey={messageKey} />
      
      <MessagesContainer
        messages={messages}
        loading={loading}
        lastError={lastError}
        messagesEndRef={messagesEndRef}
        copyErrorToClipboard={copyErrorToClipboard}
      />
      
      <ChatInput
        input={input}
        loading={loading}
        isLearning={isLearning}
        inputRef={inputRef}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default Chat;