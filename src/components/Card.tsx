export default function Card({ children, style }: any) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: "14px",
        padding: "20px",
        boxShadow: "0 0 25px rgba(46,242,208,0.15)",
        backdropFilter: "blur(4px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
