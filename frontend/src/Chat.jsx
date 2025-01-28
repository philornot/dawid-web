import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Loader2, Heart } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Definicje osobowości chmurek
const PERSONALITY_TRAITS = {
  // Jak bardzo chmurka jest zainteresowana kursorem (0-1)
  CURSOR_INTEREST: 'cursorInterest',
  // Jak bardzo lubi być blisko innych chmurek (0-1)
  SOCIABILITY: 'sociability',
  // Jak szybko się porusza (0.5-2)
  ENERGY: 'energy',
  // Jak bardzo jest nieprzewidywalna (0-1)
  CHAOS: 'chaos',
  // Jak duży ma "personal space" (0.5-2)
  PERSONAL_SPACE: 'personalSpace',
  // Jak bardzo lubi się kręcić (0-1)
  SPIN_AFFINITY: 'spinAffinity',
  // Preferowana wysokość lotu (0-1, gdzie 0 to dół ekranu, 1 to góra)
  HEIGHT_PREFERENCE: 'heightPreference',
  // Jak bardzo reaguje na podwójne kliknięcie (0.5-2)
  SCATTER_SENSITIVITY: 'scatterSensitivity',
};

const generatePersonality = () => ({
  [PERSONALITY_TRAITS.CURSOR_INTEREST]: 0.3 + Math.random() * 0.7,
  [PERSONALITY_TRAITS.SOCIABILITY]: Math.random(),
  [PERSONALITY_TRAITS.ENERGY]: Math.random() * 0.5,
  [PERSONALITY_TRAITS.CHAOS]: Math.random(),
  [PERSONALITY_TRAITS.PERSONAL_SPACE]: 0.5 + Math.random() * 1.5,
  [PERSONALITY_TRAITS.SPIN_AFFINITY]: Math.random(),
  [PERSONALITY_TRAITS.HEIGHT_PREFERENCE]: Math.random(),
  [PERSONALITY_TRAITS.SCATTER_SENSITIVITY]: 0.5 + Math.random() * 1.5,
});

const Chat = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Cześć! Jestem Dawid 😊' }
  ]);
  const [secretMode, setSecretMode] = useState(false);
  const [scatterMode, setScatterMode] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const clickCounter = useRef(0);
  const cloudsRef = useRef([]);
  const mousePositionRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const cloudPersonalities = useRef([]);
  const cloudStates = useRef([]);
  const frameRef = useRef();
  const lastUpdateRef = useRef(Date.now());

  // Inicjalizacja stanów chmurek
  useEffect(() => {
    cloudPersonalities.current = Array(8).fill(null).map(generatePersonality);
    cloudStates.current = Array(8).fill(null).map(() => ({
      velocity: { x: 0, y: 0 },
      rotation: 0,
      rotationVelocity: 0,
      mood: Math.random(), // Aktualny nastrój (wpływa na kolor)
      phase: 0, // Faza ruchu sinusoidalnego
      lastInteractionTime: 0,
    }));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const calculateCloudBehavior = (cloudElement, index, deltaTime) => {
    if (!cloudElement) return null;
  
    const personality = cloudPersonalities.current[index];
    const state = cloudStates.current[index];
    const rect = cloudElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
  
    // Bazowe wektory ruchu
    let desiredVelocityX = 0;
    let desiredVelocityY = 0;
  
    // 1. Przyciąganie do kursora
    const cursorDX = mousePositionRef.current.x - centerX;
    const cursorDY = mousePositionRef.current.y - centerY;
    const cursorDistance = Math.sqrt(cursorDX * cursorDX + cursorDY * cursorDY);
    
    if (cursorDistance > 10) {
      const cursorInfluence = personality.cursorInterest * (1 / (1 + cursorDistance * 0.001));
      desiredVelocityX += (cursorDX / cursorDistance) * cursorInfluence;
      desiredVelocityY += (cursorDY / cursorDistance) * cursorInfluence;
    }
  
    // 2. Interakcje społeczne z innymi chmurkami
    cloudsRef.current.forEach((otherCloud, otherIndex) => {
      if (index === otherIndex) return;
      const otherElement = otherCloud.current;
      if (!otherElement) return;
  
      const otherRect = otherElement.getBoundingClientRect();
      const otherCenterX = otherRect.left + otherRect.width / 2;
      const otherCenterY = otherRect.top + otherRect.height / 2;
      
      const dx = centerX - otherCenterX;
      const dy = centerY - otherCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
  
      const otherPersonality = cloudPersonalities.current[otherIndex];
      const personalSpaceThreshold = 100 * (personality.personalSpace + otherPersonality.personalSpace) / 2;
  
      if (distance < personalSpaceThreshold) {
        // Odpychanie gdy za blisko
        const repulsionForce = (1 - (distance / personalSpaceThreshold)) * 2;
        desiredVelocityX += (dx / distance) * repulsionForce;
        desiredVelocityY += (dy / distance) * repulsionForce;
      } else if (distance < personalSpaceThreshold * 2 && personality.sociability > 0.5) {
        // Przyciąganie do innych jeśli chmurka jest towarzyska
        const attractionForce = personality.sociability * 0.5;
        desiredVelocityX -= (dx / distance) * attractionForce;
        desiredVelocityY -= (dy / distance) * attractionForce;
      }
    });
  
    // 3. Preferencje wysokości
    const idealHeight = window.innerHeight * (1 - personality.heightPreference);
    const heightDiff = centerY - idealHeight;
    desiredVelocityY -= heightDiff * 0.01;
  
    // 4. Chaos i nieprzewidywalność
    const chaosAngle = state.phase + deltaTime * 0.001;
    state.phase = chaosAngle;
    desiredVelocityX += Math.sin(chaosAngle) * personality.chaos;
    desiredVelocityY += Math.cos(chaosAngle) * personality.chaos;
  
    // Zachowanie podczas rozproszenia
    if (scatterMode) {
      const scatterAngle = Math.atan2(centerY - window.innerHeight / 2, centerX - window.innerWidth / 2);
      const scatterForce = 15 * personality.scatterSensitivity;
      desiredVelocityX = Math.cos(scatterAngle) * scatterForce;
      desiredVelocityY = Math.sin(scatterAngle) * scatterForce;
    }
  
    // Aplikowanie energii chmurki
    desiredVelocityX *= personality.energy;
    desiredVelocityY *= personality.energy;
  
    // Ograniczenie maksymalnej prędkości
    const maxSpeed = scatterMode ? 20 : 5 * personality.energy;
    const currentSpeed = Math.sqrt(desiredVelocityX * desiredVelocityX + desiredVelocityY * desiredVelocityY);
    if (currentSpeed > maxSpeed) {
      desiredVelocityX = (desiredVelocityX / currentSpeed) * maxSpeed;
      desiredVelocityY = (desiredVelocityY / currentSpeed) * maxSpeed;
    }
  
    // Płynne przejście do docelowej prędkości
    state.velocity.x += (desiredVelocityX - state.velocity.x) * 0.1;
    state.velocity.y += (desiredVelocityY - state.velocity.y) * 0.1;
  
    // Rotacja
    const targetRotationVelocity = personality.spinAffinity * 
      (Math.atan2(state.velocity.y, state.velocity.x) * 20 + Math.sin(state.phase) * 10);
    state.rotationVelocity += (targetRotationVelocity - state.rotationVelocity) * 0.1;
    state.rotation += state.rotationVelocity * deltaTime * 0.1;
  
    // Aktualizacja nastroju
    state.mood += (Math.random() - 0.5) * 0.1;
    state.mood = Math.max(0, Math.min(1, state.mood));
  
    // Nowa pozycja chmurki
    let newX = rect.left + state.velocity.x;
    let newY = rect.top + state.velocity.y;
  
    // Teleportacja przez krawędzie ekranu
    if (newX + rect.width < 0) {
      newX = window.innerWidth;
    } else if (newX > window.innerWidth) {
      newX = -rect.width;
    }
  
    if (newY + rect.height < 0) {
      newY = window.innerHeight;
    } else if (newY > window.innerHeight) {
      newY = -rect.height;
    }
  
    return {
      x: newX,
      y: newY,
      rotation: state.rotation,
      mood: state.mood
    };
  };

  useEffect(() => {
    const animateClouds = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastUpdateRef.current;
      lastUpdateRef.current = currentTime;

      cloudsRef.current.forEach((cloud, index) => {
        const cloudElement = cloud.current;
        if (!cloudElement) return;

        const newState = calculateCloudBehavior(cloudElement, index, deltaTime);
        if (!newState) return;

        // Odbijanie od granic ekranu
        const rect = cloudElement.getBoundingClientRect();
        if (newState.x < 0 || newState.x > window.innerWidth - rect.width) {
          cloudStates.current[index].velocity.x *= -0.8;
        }
        if (newState.y < 0 || newState.y > window.innerHeight - rect.height) {
          cloudStates.current[index].velocity.y *= -0.8;
        }

        // Aplikowanie nowej pozycji i rotacji
        cloudElement.style.left = `${newState.x}px`;
        cloudElement.style.top = `${newState.y}px`;
        cloudElement.style.transform = `rotate(${newState.rotation}deg) scale(${scatterMode ? 0.8 : 1})`;

        // Kolor bazujący na osobowości i nastroju
        const personality = cloudPersonalities.current[index];
        const hue = 260 + personality.cursorInterest * 40 + newState.mood * 20;
        const saturation = 70 + personality.energy * 20;
        const lightness = 60 + personality.chaos * 20;
        cloudElement.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        cloudElement.style.opacity = 0.7 + personality.energy * 0.2;
      });

      frameRef.current = requestAnimationFrame(animateClouds);
    };

    frameRef.current = requestAnimationFrame(animateClouds);
    return () => cancelAnimationFrame(frameRef.current);
  }, [scatterMode]);

  const handleBackgroundDoubleClick = () => {
    setScatterMode(true);
    setTimeout(() => setScatterMode(false), 2000);
  };

  const staticClouds = useMemo(
    () =>
      [...Array(8)].map((_, i) => {
        const size = 50 + Math.random() * 30;
        const cloudRef = React.createRef();
        cloudsRef.current[i] = cloudRef;

        return (
          <div
            key={i}
            ref={cloudRef}
            className="absolute rounded-full blur-[20px] transition-colors duration-300"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: 'hsl(260, 80%, 70%)',
              opacity: 0.7,
              mixBlendMode: 'soft-light',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              transition: 'transform 0.3s ease-out, background-color 0.3s ease-out',
            }}
          />
        );
      }),
    []
  );

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
    <div className="min-h-screen overflow-hidden relative" onDoubleClick={handleBackgroundDoubleClick}>
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