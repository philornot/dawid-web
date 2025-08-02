import PropTypes from 'prop-types';

const ChatHeader = ({ currentMessage, messageKey }) => {
  return (
    <div className="text-center mb-4 sm:mb-6 px-2">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-800 mb-2 sm:mb-3">
        Dawid
      </h1>
      <p
        key={messageKey}
        className="text-sm sm:text-base md:text-lg text-purple-600 transition-opacity duration-500 ease-in-out animate-fade-in leading-tight"
      >
        {currentMessage}
      </p>
    </div>
  );
};

ChatHeader.propTypes = {
  currentMessage: PropTypes.string.isRequired,
  messageKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default ChatHeader;