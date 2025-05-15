'use client';

export default function ProgressIndicator({ progress = 0, size = 40 }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="text-gray-700"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="text-primary"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
        {Math.round(progress)}%
      </span>
    </div>
  );
}