import React from "react";
import type { CSSProperties, ReactNode } from "react";

export interface SignatureEntry {
  label: string;
  signerName: string;
  signerRole: string;
  signedAt?: string | Date | null;
  isPending?: boolean;
  footer?: ReactNode;
}

export function SignatureBlock({ signatures }: { signatures: SignatureEntry[] }) {
  const wrapperStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginTop: "28px",
  };

  const cardStyle: CSSProperties = {
    border: "1px solid #d9d9d9",
    borderRadius: "8px",
    padding: "12px",
  };

  return (
    <div style={wrapperStyle}>
      {signatures.map((signature) => {
        const isPending = signature.isPending || !signature.signedAt;
        return (
          <div key={signature.label} style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>{signature.label}</div>
            <div style={{ borderBottom: "1px solid #333", height: "36px", marginBottom: "8px" }} />
            <div style={{ fontSize: "13px", color: "#222" }}>
              {isPending ? "Pending signature" : signature.signerName}
            </div>
            <div style={{ fontSize: "12px", color: "#555" }}>{signature.signerRole}</div>
            <div style={{ fontSize: "12px", color: "#555" }}>
              {isPending ? "" : `Signed: ${formatSignedAt(signature.signedAt)}`}
            </div>
            {signature.footer ? (
              <div style={{ marginTop: "6px", fontSize: "13px", fontWeight: 600 }}>{signature.footer}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function formatSignedAt(value: string | Date | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
