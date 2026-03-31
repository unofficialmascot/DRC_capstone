import React from "react";

type ActionButtonVariant = "primary" | "success" | "warning" | "danger" | "secondary";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const variantStyles: Record<ActionButtonVariant, string> = {
  primary: "background: linear-gradient(135deg, #0b6a55 0%, #0a5947 100%); color: white; border: none;",
  success: "background: #27ae60; color: white; border: none;",
  warning: "background: #f39c12; color: white; border: none;",
  danger: "background: #e74c3c; color: white; border: none;",
  secondary: "background: #6c757d; color: white; border: none;",
};

const sizeStyles: Record<string, string> = {
  sm: "padding: 6px 12px; font-size: 13px;",
  md: "padding: 10px 20px; font-size: 14px;",
  lg: "padding: 14px 30px; font-size: 16px;",
};

export default function ActionButton({
  variant = "primary",
  size = "md",
  children,
  disabled = false,
  ...props
}: ActionButtonProps) {
  const baseStyle =
    "border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(11, 106, 85, 0.3);";
  const hoverStyle = disabled
    ? ""
    : "hover:transform: translateY(-2px); hover:box-shadow: 0 6px 15px rgba(11, 106, 85, 0.4);";
  const disabledStyle = disabled ? "opacity: 0.5; cursor: not-allowed;" : "";

  return (
    <button
      type="button"
      style={{
        ...Object.fromEntries(
          variantStyles[variant]
            .split(";")
            .filter(Boolean)
            .map((style) => {
              const [key, value] = style.split(":").map((s) => s.trim());
              return [key.replace(/-./g, (x) => x[1].toUpperCase()), value];
            })
        ),
        ...Object.fromEntries(
          sizeStyles[size]
            .split(";")
            .filter(Boolean)
            .map((style) => {
              const [key, value] = style.split(":").map((s) => s.trim());
              return [key.replace(/-./g, (x) => x[1].toUpperCase()), value];
            })
        ),
        borderRadius: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        transition: "all 0.3s ease",
        boxShadow: "0 4px 10px rgba(11, 106, 85, 0.3)",
        opacity: disabled ? 0.5 : 1,
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
