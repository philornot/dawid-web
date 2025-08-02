const MessageBubble = ({ message, lastError, copyErrorToClipboard }) => {
  const isUser = message.role === "user";
  const isErrorMessage =
    message.role === "bot" &&
    message.content.includes("Przepraszam, nie mogę się połączyć z serwerem");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex flex-col max-w-[90%] sm:max-w-[85%] md:max-w-[80%]">
        <div
          className={`p-3 sm:p-4 rounded-2xl break-words shadow-sm text-sm sm:text-base leading-relaxed ${
            isUser
              ? "bg-purple-500 text-white rounded-br-sm"
              : "bg-white text-gray-800 rounded-bl-sm border border-purple-200"
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
          <div
            className={`text-xs mt-2 opacity-70 ${
              isUser ? "text-purple-100" : "text-gray-500"
            }`}
          >
            {new Date(message.timestamp).toLocaleTimeString("pl-PL", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {/* Debug button dla błędów serwera */}
        {isErrorMessage && lastError && (
          <button
            onClick={copyErrorToClipboard}
            className="mt-2 self-start text-xs px-3 py-2 bg-red-100 text-red-600 rounded-lg border border-red-200 hover:bg-red-200 transition-colors active:bg-red-300 font-medium"
          >
            {lastError.copied ? "✓ Skopiowano!" : "🐛 Pokaż błąd"}
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
