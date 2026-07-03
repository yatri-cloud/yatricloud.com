import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer = ({ targetDate, className = "" }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPast, setIsPast] = useState(() => targetDate.getTime() <= Date.now());

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();

      if (difference > 0) {
        setIsPast(false);
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setIsPast(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // Nothing to count down to — render nothing instead of frozen zeros.
  if (isPast || Number.isNaN(targetDate.getTime())) return null;

  return (
    <div aria-live="polite" className={`flex items-center gap-1 ${className}`}>
      <TimeUnit value={timeLeft.days} label="Days" />
      <span className="text-primary text-xl font-bold">:</span>
      <TimeUnit value={timeLeft.hours} label="Hrs" />
      <span className="text-primary text-xl font-bold">:</span>
      <TimeUnit value={timeLeft.minutes} label="Min" />
      <span className="text-primary text-xl font-bold">:</span>
      <TimeUnit value={timeLeft.seconds} label="Sec" />
    </div>
  );
};

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
      {value.toString().padStart(2, "0")}
    </span>
    <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
  </div>
);

export default CountdownTimer;