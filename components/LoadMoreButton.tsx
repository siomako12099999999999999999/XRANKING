import LoadingSpinner from './LoadingSpinner';

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ onClick, isLoading }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="w-full mt-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <LoadingSpinner size="h-5 w-5" color="border-white" />
          <span className="ml-2">読み込み中...</span>
        </span>
      ) : (
        'さらに読み込む'
      )}
    </button>
  );
};

export default LoadMoreButton;