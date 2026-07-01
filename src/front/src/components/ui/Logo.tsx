// Logo do FoodLoop em imagem.
// LogoBig: símbolo + nome "FoodLoop" — usar em destaques (navbar, login, vazios).
// LogoSmall: só o símbolo — usar em pontos pequenos (favicon, placeholders, avatares).
const base = 'object-contain';

export function LogoBig({ className = 'h-12 w-auto' }: { className?: string }) {
  return <img src="/logo_big.jpeg" alt="FoodLoop" className={`${base} ${className}`} />;
}

export function LogoSmall({ className = 'h-9 w-9' }: { className?: string }) {
  return <img src="/logo_small.png" alt="FoodLoop" className={`${base} ${className}`} />;
}
