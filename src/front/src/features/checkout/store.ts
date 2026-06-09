import { create } from 'zustand';

export interface ItemCarrinho {
  id_anuncio: number;
  quantidade: number;
  preco: number;
  produto_nome: string;
}

interface CarrinhoState {
  itens: ItemCarrinho[];
  adicionar: (item: ItemCarrinho) => void;
  limpar: () => void;
  total: () => number;
}

// Carrinho do checkout (MVP: um item por pedido).
export const useCarrinho = create<CarrinhoState>((set, get) => ({
  itens: [],
  adicionar: (item) =>
    set((s) => (s.itens.some((i) => i.id_anuncio === item.id_anuncio) ? s : { itens: [...s.itens, item] })),
  limpar: () => set({ itens: [] }),
  total: () => get().itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0),
}));
