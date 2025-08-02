const ChatInput = ({
  input,
  loading,
  isLearning,
  inputRef,
  onInputChange,
  onKeyDown,
  onSubmit,
}) => {
  return (
    <div className="mt-auto bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-purple-200">
      <form onSubmit={onSubmit}>
        <div className="flex gap-2 sm:gap-3 items-end">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              placeholder={
                isLearning
                  ? "Naucz mnie odpowiedzi... (lub napisz 'skip')"
                  : "Napisz wiadomość do Dawida..."
              }
              className="w-full p-3 sm:p-4 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50 transition-all duration-200 text-sm sm:text-base resize-none min-h-[44px] max-h-32 no-zoom touch-manipulation"
              disabled={loading}
              maxLength={500}
              rows={1}
              style={{
                resize: 'none',
                overflow: 'hidden',
                minHeight: '44px'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 sm:px-6 py-3 sm:py-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm sm:text-base whitespace-nowrap active:scale-95 min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Wyślij"
            )}
          </button>
        </div>

        {/* Character counter */}
        <div className="text-xs text-purple-500 mt-2 text-right">
          {input.length}/500 znaków
        </div>
      </form>
    </div>
  );
};

export default ChatInput;