import { useState, useEffect, useCallback } from "react";

interface UseQuestionTimerOptions {
  duration: number; // in seconds
  onTimeUp: () => void;
  questionId: string;
  enabled?: boolean;
}

export const useQuestionTimer = ({
  duration,
  onTimeUp,
  questionId,
  enabled = true,
}: UseQuestionTimerOptions) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(enabled);

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(duration);
    setIsRunning(enabled);
  }, [questionId, duration, enabled]);

  // Countdown logic
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Handle time up
  useEffect(() => {
    if (timeLeft === 0 && !isRunning) {
      onTimeUp();
    }
  }, [timeLeft, isRunning, onTimeUp]);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);
  const reset = useCallback(() => {
    setTimeLeft(duration);
    setIsRunning(enabled);
  }, [duration, enabled]);

  const progress = (timeLeft / duration) * 100;

  return {
    timeLeft,
    progress,
    isRunning,
    pause,
    resume,
    reset,
  };
};
