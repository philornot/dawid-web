const LoadingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="bg-white text-gray-800 p-3 sm:p-4 rounded-2xl rounded-bl-sm max-w-[90%] sm:max-w-[85%] shadow-sm border border-purple-200">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <span className="text-sm sm:text-base text-gray-600">
            Dawid pisze...
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;