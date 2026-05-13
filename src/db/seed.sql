-- =====================================================================
-- FoodLoop - Dados de teste
-- =====================================================================
-- Popula o banco com um cenário mínimo: um cliente, um comerciante,
-- um estabelecimento, um produto, um anúncio, um pedido concluído com
-- avaliação e um pedido cancelado pelo sistema (timeout de pagamento).
-- Pré-requisito: schema.sql executado.
-- =====================================================================


-- usuario cliente
INSERT INTO usuario (nome, email, senha_hash, telefone, tipo)
VALUES ('Ana Lima', 'ana@email.com', '$2b$12$hashbcrypt', '31999990001', 'cliente');

INSERT INTO cliente (id_usuario, latitude_atual, longitude_atual)
VALUES (1, -19.9167, -43.9345);


-- usuario comerciante
INSERT INTO usuario (nome, email, senha_hash, telefone, tipo)
VALUES ('Carlos Padeiro', 'padaria@email.com', '$2b$12$hashbcrypt', '31988880002', 'comerciante');

INSERT INTO comerciante (id_usuario, cnpj)
VALUES (2, '12.345.678/0001-90');


-- preferencias de notificacao
INSERT INTO preferencia_notificacao (id_usuario) VALUES (1);
INSERT INTO preferencia_notificacao (id_usuario) VALUES (2);


-- device token
INSERT INTO device_token (id_usuario, token, plataforma)
VALUES (1, 'fcm-token-abc123', 'android');


-- endereco e estabelecimento
INSERT INTO endereco (rua, numero, bairro, cidade, estado, cep, latitude, longitude)
VALUES ('Rua das Flores', '100', 'Centro', 'Belo Horizonte', 'MG', '30130-110', -19.9200, -43.9380);

INSERT INTO estabelecimento (id_comerciante, id_endereco, nome_fantasia, descricao, horario_funcionamento)
VALUES (2, 1, 'Padaria Boa Vista', 'Pães artesanais e salgados.', 'Seg-Sáb 06h-20h');


-- produto e anuncio
INSERT INTO produto (id_estabelecimento, nome, descricao, preco_regular, categoria)
VALUES (1, 'Pão de Queijo', 'Pão de queijo mineiro', 3.50, 'salgado');

INSERT INTO anuncio (id_produto, id_estabelecimento, preco_promocional, quantidade_inicial, quantidade_disponivel, prazo_retirada)
VALUES (1, 1, 1.50, 20, 20, NOW() + INTERVAL '4 hours');


-- pedido concluído com comissão de 10%
INSERT INTO pedido (id_cliente, id_estabelecimento, valor_total, taxa_comissao, valor_comissao, codigo_retirada)
VALUES (1, 1, 7.50, 10.00, 0.75, 'RET-001');

INSERT INTO item_pedido (id_pedido, id_anuncio, quantidade, preco_unitario)
VALUES (1, 1, 5, 1.50);

INSERT INTO pagamento (id_pedido, valor, forma_pagamento, codigo_transacao, status_pagamento)
VALUES (1, 7.50, 'PIX', 'MP-TXN-001', 'APROVADO');

UPDATE pedido SET status = 'RETIRADO' WHERE id = 1;

INSERT INTO avaliacao (id_pedido, id_estabelecimento, nota, comentario)
VALUES (1, 1, 5, 'Muito bom e barato!');


-- pedido cancelado pelo sistema (pagamento expirado)
INSERT INTO pedido (id_cliente, id_estabelecimento, valor_total, taxa_comissao, valor_comissao, codigo_retirada)
VALUES (1, 1, 3.00, 10.00, 0.30, 'RET-002');

UPDATE pedido
SET    status = 'CANCELADO',
       cancelado_por = 'SISTEMA',
       motivo_cancelamento = 'Pagamento não confirmado dentro do prazo.',
       data_cancelamento = NOW()
WHERE  codigo_retirada = 'RET-002';
