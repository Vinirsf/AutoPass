# AutoPass 🚗

Uma plataforma completa para conectar usuários a serviços automotivos de qualidade.

## 🌟 Funcionalidades

- **Busca de Serviços**: Encontre lava-rápidos, mecânicas, estéticas e borracharias próximas
- **Cadastro de Estabelecimentos**: Permite que prestadores de serviços se cadastrem na plataforma
- **Sistema de Autenticação**: Login seguro para usuários e estabelecimentos
- **Painel de Controle**: Interface administrativa para estabelecimentos gerenciarem seus serviços
- **PWA**: Aplicação web progressiva que funciona como um app nativo
- **Responsivo**: Design adaptável para todos os dispositivos

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework CSS**: Bootstrap 5
- **Banco de Dados**: Supabase (PostgreSQL)
- **Deploy**: Netlify
- **Autenticação**: Supabase Auth
- **Mapas**: Google Maps API
- **Animações**: AOS (Animate On Scroll)

## 🚀 Deploy

### Netlify
Este projeto está configurado para deploy automático no Netlify. Basta conectar o repositório:

1. Faça login no [Netlify](https://netlify.com)
2. Clique em "New site from Git"
3. Conecte com o GitHub e selecione este repositório
4. O deploy será automático usando as configurações do `netlify.toml`

### Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o script SQL para criar as tabelas necessárias:

```sql
-- Tabela de estabelecimentos
CREATE TABLE estabelecimentos (
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
CREATE TABLE servicos_estabelecimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estabelecimento_id UUID REFERENCES estabelecimentos(id) ON DELETE CASCADE,
    tipo_servico VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE agendamentos (
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
CREATE TABLE avaliacoes (
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
CREATE INDEX idx_estabelecimentos_email ON estabelecimentos(email);
CREATE INDEX idx_estabelecimentos_cidade ON estabelecimentos(cidade);
CREATE INDEX idx_servicos_estabelecimento_id ON servicos_estabelecimento(estabelecimento_id);
CREATE INDEX idx_agendamentos_estabelecimento_id ON agendamentos(estabelecimento_id);
CREATE INDEX idx_avaliacoes_estabelecimento_id ON avaliacoes(estabelecimento_id);
```

3. Atualize as credenciais do Supabase no arquivo `index.html`:
   - Substitua `supabaseUrl` pela URL do seu projeto
   - Substitua `supabaseKey` pela chave pública do seu projeto

## 📁 Estrutura do Projeto

```
AutoPassV5/
├── images/                 # Imagens e ícones
├── index.html             # Página principal
├── main.js               # JavaScript principal
├── style.css             # Estilos CSS
├── manifest.json         # Manifest PWA
├── service-worker.js     # Service Worker para PWA
├── netlify.toml          # Configuração do Netlify
├── package.json          # Dependências do projeto
├── server.js             # Servidor local para desenvolvimento
└── README.md             # Este arquivo
```

## 🔧 Desenvolvimento Local

1. Clone o repositório:
```bash
git clone https://github.com/SEU_USUARIO/AutoPassV5.git
cd AutoPassV5
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o servidor local:
```bash
npm start
```

4. Acesse `http://localhost:3000` no navegador

## 🌐 Variáveis de Ambiente

Configure as seguintes variáveis no Netlify:

- `SUPABASE_URL`: URL do seu projeto Supabase
- `SUPABASE_ANON_KEY`: Chave pública do Supabase

## 📱 PWA (Progressive Web App)

O projeto está configurado como uma PWA, permitindo:
- Instalação como app nativo
- Funcionamento offline (cache básico)
- Notificações push (futuro)
- Ícones adaptativos para diferentes plataformas

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🐛 Relatório de Bugs

Se encontrar algum bug, por favor:
1. Verifique se o bug já não foi reportado
2. Crie uma nova issue com detalhes do problema
3. Inclua passos para reproduzir o bug
4. Adicione screenshots se necessário

## 🔮 Roadmap

- [ ] Sistema de pagamento online
- [ ] Chat em tempo real
- [ ] Notificações push
- [ ] Geolocalização avançada
- [ ] Sistema de fidelidade
- [ ] API mobile nativa
- [ ] Integração com redes sociais

## 📞 Contato

Para dúvidas e sugestões:
- Email: contato@autopass.com
- GitHub: [Issues](https://github.com/SEU_USUARIO/AutoPassV5/issues)

---

Feito com ❤️ para a comunidade automotiva brasileira

Aplicativo PWA para serviços automotivos inspirado no iFood.

## Correção de problemas

Vários problemas foram corrigidos:

1. Problema com inicialização do Supabase
2. Erros do Service Worker
3. Problemas com CORS
4. Função escolherServico não definida

## Como executar o aplicativo

1. Instale as dependências:
```
npm install
```

2. Inicie o servidor:
```
npm start
```

3. Acesse o aplicativo em seu navegador:
```
http://localhost:3000
```

## Desenvolvimento

Para iniciar o servidor em modo de desenvolvimento (com reinício automático):
```
npm run dev
```

## Importante

- O aplicativo agora funciona através de um servidor para evitar problemas de CORS e Service Worker
- Foi implementado tratamento de erros para o Supabase caso a conexão falhe
- O Service Worker foi otimizado para melhor funcionamento offline

## Funcionalidades
- Visualização de estabelecimentos no mapa
- Filtros e avaliações
- Agendamento de serviços
- Gerenciamento para estabelecimentos
- Autenticação Google
- Funciona offline (PWA)

## Como rodar localmente
1. Baixe ou clone este repositório
2. Abra o arquivo `index.html` em seu navegador
3. Para testar o PWA e Service Worker, utilize um servidor local (ex: Live Server no VSCode)

## Deploy no Netlify
1. Faça login no Netlify
2. Clique em "New site from Git" e conecte seu repositório
3. O Netlify detecta automaticamente projetos estáticos (HTML/CSS/JS)
4. Publique e acesse seu app online!

## Tecnologias
- HTML, CSS, JavaScript puro
- Google Maps API
- Supabase
- Google Auth

## Paleta de cores
- Cinza escuro: #414141
- Amarelo: #D0AF33
- Preto: #11100C
- Cinza claro: #D9D9D9 