-- AutoPass - Script de configuração do banco de dados Supabase
-- Execute este script no SQL Editor do seu projeto Supabase

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de estabelecimentos
CREATE TABLE IF NOT EXISTS estabelecimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    responsavel VARCHAR(255),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    descricao TEXT,
    imagem TEXT,
    status VARCHAR(20) DEFAULT 'ativo',
    data_cadastro TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de serviços oferecidos pelos estabelecimentos
CREATE TABLE IF NOT EXISTS servicos_estabelecimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estabelecimento_id UUID REFERENCES estabelecimentos(id) ON DELETE CASCADE,
    tipo_servico VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estabelecimento_id UUID REFERENCES estabelecimentos(id) ON DELETE CASCADE,
    usuario_id UUID,
    nome_cliente VARCHAR(255),
    telefone_cliente VARCHAR(20),
    servico VARCHAR(100),
    data_agendamento TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pendente',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS avaliacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estabelecimento_id UUID REFERENCES estabelecimentos(id) ON DELETE CASCADE,
    usuario_id UUID,
    nome_cliente VARCHAR(255),
    nota INTEGER CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    data_avaliacao TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_email ON estabelecimentos(email);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_cidade ON estabelecimentos(cidade);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_status ON estabelecimentos(status);
CREATE INDEX IF NOT EXISTS idx_servicos_estabelecimento_id ON servicos_estabelecimento(estabelecimento_id);
CREATE INDEX IF NOT EXISTS idx_servicos_tipo ON servicos_estabelecimento(tipo_servico);
CREATE INDEX IF NOT EXISTS idx_agendamentos_estabelecimento_id ON agendamentos(estabelecimento_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_estabelecimento_id ON avaliacoes(estabelecimento_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_nota ON avaliacoes(nota);

-- Inserir dados de exemplo para demonstração
INSERT INTO estabelecimentos (nome, email, telefone, responsavel, endereco, cidade, estado, descricao, imagem, status) VALUES
('Auto Center Silva', 'contato@autocentrsilva.com', '(11) 98765-4321', 'João Silva', 'Rua das Flores, 123', 'São Paulo', 'SP', 'Oficina mecânica com mais de 20 anos de experiência, especializada em carros nacionais e importados.', 'https://images.unsplash.com/photo-1486754735734-325b5831c3ad?w=400', 'ativo'),
('Lava Rápido Brilhante', 'brilhante@lavarapido.com', '(11) 99888-7777', 'Maria Santos', 'Av. Paulista, 456', 'São Paulo', 'SP', 'Serviço de lavagem premium com produtos ecológicos e atendimento rápido.', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'ativo'),
('Estética Automotiva Premium', 'contato@esteticapremium.com', '(11) 97777-6666', 'Carlos Oliveira', 'Rua do Comércio, 789', 'São Paulo', 'SP', 'Especializada em estética automotiva, enceramento, pintura e restauração.', 'https://images.unsplash.com/photo-1520340356742-a9cf1c9e0e5e?w=400', 'ativo'),
('Borracharia 24h', 'borracharia24h@email.com', '(11) 96666-5555', 'Pedro Costa', 'Rua da Paz, 321', 'São Paulo', 'SP', 'Borracharia com atendimento 24 horas, troca de pneus, alinhamento e balanceamento.', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'ativo');

-- Inserir serviços oferecidos
INSERT INTO servicos_estabelecimento (estabelecimento_id, tipo_servico) VALUES
((SELECT id FROM estabelecimentos WHERE nome = 'Auto Center Silva'), 'Mecânica'),
((SELECT id FROM estabelecimentos WHERE nome = 'Lava Rápido Brilhante'), 'Lavagem'),
((SELECT id FROM estabelecimentos WHERE nome = 'Estética Automotiva Premium'), 'Estética'),
((SELECT id FROM estabelecimentos WHERE nome = 'Borracharia 24h'), 'Borracharia');

-- Inserir algumas avaliações de exemplo
INSERT INTO avaliacoes (estabelecimento_id, nome_cliente, nota, comentario) VALUES
((SELECT id FROM estabelecimentos WHERE nome = 'Auto Center Silva'), 'Ana Maria', 5, 'Excelente atendimento e preço justo. Recomendo!'),
((SELECT id FROM estabelecimentos WHERE nome = 'Auto Center Silva'), 'Roberto Santos', 4, 'Bom serviço, mas demorou um pouco mais que o esperado.'),
((SELECT id FROM estabelecimentos WHERE nome = 'Lava Rápido Brilhante'), 'Fernanda Lima', 5, 'Meu carro ficou brilhando! Atendimento rápido e eficiente.'),
((SELECT id FROM estabelecimentos WHERE nome = 'Estética Automotiva Premium'), 'Lucas Ferreira', 5, 'Trabalho impecável na pintura do meu carro. Parabéns!'),
((SELECT id FROM estabelecimentos WHERE nome = 'Borracharia 24h'), 'Juliana Sousa', 4, 'Resolveram meu problema de madrugada. Muito prestativo!');

-- Configurar Row Level Security (RLS)
ALTER TABLE estabelecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_estabelecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para estabelecimentos
-- Todos podem ver estabelecimentos ativos
CREATE POLICY "Estabelecimentos públicos" ON estabelecimentos
    FOR SELECT USING (status = 'ativo');

-- Estabelecimentos podem editar seus próprios dados
CREATE POLICY "Estabelecimentos próprios" ON estabelecimentos
    FOR ALL USING (auth.uid() = id);

-- Políticas para serviços
CREATE POLICY "Serviços públicos" ON servicos_estabelecimento
    FOR SELECT USING (true);

CREATE POLICY "Estabelecimentos gerenciam serviços" ON servicos_estabelecimento
    FOR ALL USING (auth.uid() = estabelecimento_id);

-- Políticas para agendamentos
CREATE POLICY "Agendamentos por estabelecimento" ON agendamentos
    FOR ALL USING (auth.uid() = estabelecimento_id);

-- Políticas para avaliações
CREATE POLICY "Avaliações públicas" ON avaliacoes
    FOR SELECT USING (true);

CREATE POLICY "Usuários criam avaliações" ON avaliacoes
    FOR INSERT WITH CHECK (auth.uid() = usuario_id OR usuario_id IS NULL);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_estabelecimentos_updated_at
    BEFORE UPDATE ON estabelecimentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários das tabelas
COMMENT ON TABLE estabelecimentos IS 'Tabela que armazena informações dos estabelecimentos cadastrados';
COMMENT ON TABLE servicos_estabelecimento IS 'Tabela que relaciona estabelecimentos com os serviços que oferecem';
COMMENT ON TABLE agendamentos IS 'Tabela que armazena os agendamentos realizados pelos clientes';
COMMENT ON TABLE avaliacoes IS 'Tabela que armazena as avaliações dos estabelecimentos feitas pelos clientes';

-- Resultado esperado
SELECT 'Banco de dados configurado com sucesso!' as status; 