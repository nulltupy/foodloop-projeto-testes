import { useEffect, useState } from 'react';

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface EstadoGeo {
  coords: Coords | null;
  erro: boolean;
  carregando: boolean;
  // Permite definir as coordenadas manualmente quando a geolocalização falha.
  definirManual: (c: Coords) => void;
}

// Obtém a posição do usuário via navigator.geolocation, com timeout de 8s.
export function useGeoCoords(): EstadoGeo {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setErro(true);
      setCarregando(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setCarregando(false);
      },
      () => {
        setErro(true);
        setCarregando(false);
      },
      { timeout: 8000 },
    );
  }, []);

  function definirManual(c: Coords) {
    setCoords(c);
    setErro(false);
    setCarregando(false);
  }

  return { coords, erro, carregando, definirManual };
}
