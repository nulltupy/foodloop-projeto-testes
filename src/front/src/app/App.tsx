import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { RotaProtegida } from '../features/auth/components/RotaProtegida';
import { Login } from '../features/auth/pages/Login';
import { CadastroCliente } from '../features/auth/pages/CadastroCliente';
import { CadastroComerciante } from '../features/auth/pages/CadastroComerciante';
import { Home } from '../features/ofertas/pages/Home';
import { OfertaDetalhe } from '../features/ofertas/pages/OfertaDetalhe';
import { Checkout } from '../features/checkout/pages/Checkout';
import { PedidoConfirmacao } from '../features/pedidos/pages/PedidoConfirmacao';
import { PainelProdutos } from '../features/comerciante/pages/PainelProdutos';

export function App() {
  return (
    <div className="min-h-screen bg-surface-50 text-ink-900">
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro/cliente" element={<CadastroCliente />} />
        <Route path="/cadastro/comerciante" element={<CadastroComerciante />} />
        {/* Rotas do cliente autenticado. */}
        <Route element={<RotaProtegida />}>
          <Route path="/" element={<Home />} />
          <Route path="/oferta/:id" element={<OfertaDetalhe />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedidos/:id" element={<PedidoConfirmacao />} />
        </Route>

        {/* Rotas exclusivas do comerciante. */}
        <Route element={<RotaProtegida tipo="comerciante" />}>
          <Route path="/comerciante" element={<PainelProdutos />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
