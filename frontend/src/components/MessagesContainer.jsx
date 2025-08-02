import MessageBubble from "./MessageBubble";
import LoadingIndicator from "./LoadingIndicator";

const MessagesContainer = ({ 
  messages, 
  loading, 
  lastError, 
  messagesEndRef, 
  copyErrorToClipboard 
}) => {
  return (
    <div className="flex-1 overflow-y-auto space-y-3 mb-4 px-1 sm:px-2 mobile-scroll custom-scrollbar">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          lastError={lastError}
          copyErrorToClipboard={copyErrorToClipboard}
        />
      ))}

      {loading && <LoadingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesContainer;