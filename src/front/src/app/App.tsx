import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { BottomNav } from '../components/ui/BottomNav';
import { RotaProtegida } from '../features/auth/components/RotaProtegida';
import { Login } from '../features/auth/pages/Login';
import { CadastroCliente } from '../features/auth/pages/CadastroCliente';
import { CadastroComerciante } from '../features/auth/pages/CadastroComerciante';
import { Home } from '../features/ofertas/pages/Home';
import { OfertaDetalhe } from '../features/ofertas/pages/OfertaDetalhe';
import { PerfilEstabelecimento } from '../features/estabelecimentos/pages/PerfilEstabelecimento';
import { Checkout } from '../features/checkout/pages/Checkout';
import { PedidoConfirmacao } from '../features/pedidos/pages/PedidoConfirmacao';
import { MeusPedidos } from '../features/pedidos/pages/MeusPedidos';
import { PainelComerciante } from '../features/comerciante/pages/PainelComerciante';
import { PainelProdutos } from '../features/comerciante/pages/PainelProdutos';
import { PainelPedidos } from '../features/comerciante/pages/PainelPedidos';
import { PainelLoja } from '../features/comerciante/pages/PainelLoja';
import { Perfil } from '../features/perfil/pages/Perfil';

export function App() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <Header />
      <div className="flex-1 pb-24 sm:pb-0">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro/cliente" element={<CadastroCliente />} />
          <Route path="/cadastro/comerciante" element={<CadastroComerciante />} />
          {/* Rotas autenticadas (qualquer tipo de usuário). */}
          <Route element={<RotaProtegida />}>
            <Route path="/" element={<Home />} />
            <Route path="/oferta/:id" element={<OfertaDetalhe />} />
            <Route path="/estabelecimentos/:id" element={<PerfilEstabelecimento />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pedidos" element={<MeusPedidos />} />
            <Route path="/pedidos/:id" element={<PedidoConfirmacao />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>

          {/* Painel do comerciante: um lugar só, com abas. */}
          <Route element={<RotaProtegida tipo="comerciante" />}>
            <Route path="/comerciante" element={<PainelComerciante />}>
              <Route index element={<PainelPedidos />} />
              <Route path="pedidos" element={<Navigate to="/comerciante" replace />} />
              <Route path="cardapio" element={<PainelProdutos />} />
              <Route path="loja" element={<PainelLoja />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}
