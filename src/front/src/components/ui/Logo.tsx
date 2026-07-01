// Logo do FoodLoop em imagem.
// LogoBig: símbolo + nome "FoodLoop" — usar em destaques (navbar, login, vazios).
// LogoSmall: só o símbolo — usar em pontos pequenos (favicon, placeholders, avatares).
const base = 'object-contain';

export function LogoBig({ className = 'h-[94px] w-auto' }: { className?: string }) {
  return <img src="/logo_big.png" alt="FoodLoop" className={`${base} ${className}`} />;
}

export function LogoSmall({ className = 'h-[70px] w-[70px]' }: { className?: string }) {
  return <img src="/logo_small.png" alt="FoodLoop" className={`${base} ${className}`} />;
}
