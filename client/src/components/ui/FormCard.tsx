import React from "react";

interface FormCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function FormCard({ children, className = "", style }: FormCardProps) {
  return (
    <div
      className={className}
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "10px",
        border: "1px solid #e6e6e6",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
