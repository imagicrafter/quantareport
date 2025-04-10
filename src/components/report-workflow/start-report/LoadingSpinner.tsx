
const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-quanta-blue"></div>
      <span className="ml-3 text-gray-600">Loading template data...</span>
    </div>
  );
};

export default LoadingSpinner;
