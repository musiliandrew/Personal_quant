import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0b0b0b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="28" stroke="white" strokeWidth="12" />
          <path d="M68 68 L85 85" stroke="white" strokeWidth="12" strokeLinecap="round" />
          
          <rect x="38" y="44" width="6" height="22" fill="white" rx="2" />
          <rect x="48" y="36" width="6" height="30" fill="white" rx="2" />
          <rect x="58" y="28" width="6" height="38" fill="white" rx="2" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
