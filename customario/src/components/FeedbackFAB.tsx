import "./FeedbackFAB.css";

interface FeedbackFABProps {
  onClick: () => void;
  disabled?: boolean;
}

function FeedbackFAB({ onClick, disabled }: FeedbackFABProps) {
  return (
    <button
      className="feedback-fab"
      onClick={onClick}
      disabled={disabled}
      aria-label="Give Feedback"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="fab-text">Feedback</span>
    </button>
  );
}

export default FeedbackFAB;
