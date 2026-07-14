"use client";

import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function Logo({ size = 40, className, ...props }: LogoProps) {
  const uniqueId = React.useId().replace(/:/g, "");
  const maskId = `logo-mask-${uniqueId}`;
  const clipId = `logo-clip-${uniqueId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <mask id={maskId}>
          {/* Mask background */}
          <rect width="200" height="200" fill="black" />
          
          {/* Base Q shape */}
          <circle cx="105" cy="95" r="63" fill="white" />
          <path d="M135 125 L165 155" stroke="white" strokeWidth="18" strokeLinecap="round" />
          <rect x="47" y="95" width="16" height="65" fill="white" />
          <path d="M47 95 H85 V130 H47 Z" fill="white" />
          
          {/* Cutouts (black) */}
          <circle cx="109" cy="95" r="47" fill="black" />
          <path d="M63 103 H71 C76 103 80 107 80 112 C80 117 76 121 71 121 H63 Z" fill="black" />
          
          {/* Add back the bars (white, clipped to inner circle) */}
          <g clipPath={`url(#${clipId})`}>
            <rect x="88" y="82" width="14" height="50" fill="white" rx="7" />
            <rect x="108" y="68" width="14" height="64" fill="white" rx="7" />
            <rect x="128" y="52" width="14" height="80" fill="white" rx="7" />
          </g>
        </mask>
        <clipPath id={clipId}>
          <circle cx="109" cy="95" r="47" />
        </clipPath>
      </defs>
      
      <rect width="200" height="200" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}
