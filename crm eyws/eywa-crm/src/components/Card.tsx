import { PropsWithChildren, CSSProperties, HTMLAttributes } from "react";

type CardProps = PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
}> & HTMLAttributes<HTMLDivElement>;

export default function Card({ children, className, style }: CardProps) {
  return (
    <div
      className={["p-4", className].filter(Boolean).join(" ")}
      style={{
        borderRadius: 30,
        background: "var(--panel)",
        border: "1px solid var(--card-border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}


