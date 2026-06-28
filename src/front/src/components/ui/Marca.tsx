// Marca do FoodLoop · "Hortelã": um loop (comida que volta a circular) verde
// com um broto laranja — fresco, otimista, mercado de bairro.
export function Marca({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="FoodLoop">
      <rect width="32" height="32" rx="9" fill="#0a7d52" />
      <path d="M10 16a6 6 0 1 1 1.8 4.3" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M10 11.5V16h4.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.5" cy="10" r="2.6" fill="#ff7a1a" />
    </svg>
  );
}
