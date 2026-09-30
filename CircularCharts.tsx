import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  sublabel?: string;
  children?: React.ReactNode;
}

export const CircularProgressRing: React.FC<CircularProgressProps> = ({
  percentage,
  size = 110,
  strokeWidth = 10,
  color = '#10b981',
  backgroundColor = '#1e293b',
  label,
  sublabel,
  children,
}) => {
  const clamped = Math.max(0, Math.min(100, isNaN(percentage) ? 0 : percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Content in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 pointer-events-none">
        {children ? (
          children
        ) : (
          <>
            <span className="text-base font-extrabold text-white leading-none">
              {Math.round(clamped)}%
            </span>
            {sublabel && (
              <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 max-w-[70px] truncate">
                {sublabel}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface DonutSlice {
  label: string;
  value: number;
  color: string;
  formattedValue?: string;
}

interface CircularDonutChartProps {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerTitle?: string;
  centerSubtitle?: string;
}

export const CircularDonutChart: React.FC<CircularDonutChartProps> = ({
  slices,
  size = 200,
  thickness = 24,
  centerTitle,
  centerSubtitle,
}) => {
  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  // Filter non-zero slices
  const validSlices = slices.filter((s) => s.value > 0);

  let accumulatedPercent = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track if empty */}
        {total === 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={thickness}
            fill="transparent"
          />
        ) : (
          validSlices.map((slice, index) => {
            const percent = (slice.value / total) * 100;
            const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += percent;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={slice.color}
                strokeWidth={thickness}
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                className="transition-all duration-700 ease-out hover:opacity-90 cursor-pointer"
              >
                <title>{`${slice.label}: ${slice.formattedValue || slice.value} (${Math.round(percent)}%)`}</title>
              </circle>
            );
          })
        )}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
        {centerTitle && (
          <span className="text-lg font-black text-white leading-tight">
            {centerTitle}
          </span>
        )}
        {centerSubtitle && (
          <span className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
            {centerSubtitle}
          </span>
        )}
      </div>
    </div>
  );
};

interface GaugeMeterProps {
  score: number; // 0 - 100
  size?: number;
  label?: string;
  grade?: string;
}

export const GaugeMeter: React.FC<GaugeMeterProps> = ({
  score,
  size = 150,
  label = 'Health Score',
  grade = 'Good',
}) => {
  const clamped = Math.max(0, Math.min(100, score));
  // Semi-circle gauge (180 degrees)
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // half circle
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  let gaugeColor = '#10b981'; // Green
  if (clamped < 50) gaugeColor = '#f43f5e'; // Red
  else if (clamped < 75) gaugeColor = '#f59e0b'; // Amber

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size * 0.65 }}>
      <svg width={size} height={size * 0.7} className="overflow-visible">
        {/* Background track arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      <div className="absolute bottom-1 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black text-white leading-none">
          {Math.round(clamped)}
        </span>
        <span className="text-[11px] font-bold mt-0.5" style={{ color: gaugeColor }}>
          {grade}
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
          {label}
        </span>
      </div>
    </div>
  );
};
