// Registro do Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registrado:', reg.scope))
      .catch(err => console.error('Erro ao registrar Service Worker:', err));
  });
}

// Configurações e dados
const SUPABASE_URL = 'https://pgjcbjnlcmsjzabehthy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamNiam5sY21zanphYmVodGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4Nzc4NjMsImV4cCI6MjA2MTQ1Mzg2M30.g8_Xm_r2dbUZlO4haMwDOgXO-e2JsVGncnWltP1diC4';
const GOOGLE_MAPS_API_KEY = 'AIzaSyANeF6vSvBSzjbFJsJHDLEWa8IJvuRRD8E';
const GOOGLE_AUTH_SECRET = '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';

// Inicialização do Supabase (corrigir para evitar o erro de inicialização)
let supabase;
try {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
  console.error('Erro ao inicializar o Supabase:', error);
  // Criar um cliente mock para evitar erros
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: null, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase não inicializado' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase não inicializado' } }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: { message: 'Supabase não inicializado' } }),
      signOut: () => Promise.resolve()
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      insert: () => Promise.resolve({ data: null, error: null })
    })
  };
}

// Variáveis da aplicação
let usuario = null;
let tipoPainel = null; // 'usuario' ou 'estabelecimento'
let loginModal = null;
let toastElement = null;
let mapInstance = null;
let marcadores = [];
let posicaoUsuario = null;
let estabelecimentosFavoritos = [];

// Estruturas de dados simuladas (funcionam como tabelas do banco)
let perfisUsuarios = [
  {
    id: 'user-1',
    nome: 'João Silva',
    email: 'joao@exemplo.com',
    telefone: '(11) 99999-1234',
    carro: 'Honda Civic 2019',
    placa: 'ABC-1234',
    dataCadastro: '2023-05-10',
    foto: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: 'user-2',
    nome: 'Maria Santos',
    email: 'maria@exemplo.com',
    telefone: '(11) 98888-5678',
    carro: 'Fiat Argo 2020',
    placa: 'DEF-5678',
    dataCadastro: '2023-06-15',
    foto: 'https://randomuser.me/api/portraits/women/44.jpg'
  }
];

let dadosEstabelecimentos = [
  {
    id: 'estab-1',
    nome: 'Oficina Brasil',
    email: 'contato@oficinabrasil.com',
    telefone: '(11) 3333-4444',
    descricao: 'Especializada em manutenção automotiva.',
    endereco: 'Av. Paulista, 1000, São Paulo - SP',
    lat: -23.55052,
    lng: -46.633308,
    horarios: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    servicos: ['Mecânica', 'Elétrica', 'Troca de óleo'],
    precos: {
      'Mecânica': 'A partir de R$ 80,00',
      'Elétrica': 'A partir de R$ 100,00',
      'Troca de óleo': 'R$ 120,00'
    },
    responsavel: 'Carlos Mendes',
    cnpj: '12.345.678/0001-90',
    dataCadastro: '2023-01-15',
    status: 'ativo',
    plano: 'premium',
    imagem: 'https://source.unsplash.com/random/300x200/?garage'
  },
  {
    id: 'estab-2',
    nome: 'Auto Center Gold',
    email: 'contato@autocenter.com',
    telefone: '(21) 3333-5555',
    descricao: 'Serviços rápidos e de qualidade.',
    endereco: 'Rua das Laranjeiras, 200, Rio de Janeiro - RJ',
    lat: -22.906847,
    lng: -43.172896,
    horarios: ['08:00', '09:30', '13:00', '16:00'],
    servicos: ['Borracharia', 'Alinhamento', 'Balanceamento'],
    precos: {
      'Borracharia': 'A partir de R$ 50,00',
      'Alinhamento': 'R$ 80,00',
      'Balanceamento': 'R$ 70,00'
    },
    responsavel: 'Ana Pereira',
    cnpj: '98.765.432/0001-10',
    dataCadastro: '2023-02-20',
    status: 'ativo',
    plano: 'básico',
    imagem: 'https://source.unsplash.com/random/300x200/?tire'
  },
  {
    id: 'estab-3',
    nome: 'Lava Rápido LimpaCar',
    email: 'contato@limpacar.com',
    telefone: '(31) 3333-6666',
    descricao: 'Seu carro limpo e cheiroso!',
    endereco: 'Av. Afonso Pena, 500, Belo Horizonte - MG',
    lat: -19.916681,
    lng: -43.934493,
    horarios: ['10:00', '11:00', '15:00', '17:00'],
    servicos: ['Lavagem', 'Estética'],
    precos: {
      'Lavagem': 'A partir de R$ 40,00',
      'Estética': 'A partir de R$ 120,00'
    },
    responsavel: 'Roberto Alves',
    cnpj: '45.678.901/0001-23',
    dataCadastro: '2023-03-05',
    status: 'ativo',
    plano: 'premium',
    imagem: 'https://source.unsplash.com/random/300x200/?carwash'
  }
];

let historicoPagamentos = [
  {
    id: 'pag-1',
    estabelecimentoId: 'estab-1',
    valor: 299.90,
    data: '2024-04-01',
    status: 'aprovado',
    plano: 'premium',
    metodo: 'cartão'
  },
  {
    id: 'pag-2',
    estabelecimentoId: 'estab-2',
    valor: 149.90,
    data: '2024-04-02',
    status: 'aprovado',
    plano: 'básico',
    metodo: 'pix'
  },
  {
    id: 'pag-3',
    estabelecimentoId: 'estab-3',
    valor: 299.90,
    data: '2024-04-03',
    status: 'aprovado',
    plano: 'premium',
    metodo: 'boleto'
  }
];

// Dados de agendamentos mais detalhados
let agendamentos = [
  {
    id: 'agend-1',
    usuarioId: 'user-1',
    nomeUsuario: 'João Silva',
    estabelecimentoId: 'estab-1',
    nomeEstabelecimento: 'Oficina Brasil',
    servico: 'Troca de óleo',
    valor: 120.00,
    data: '2024-05-15',
    horario: '09:00',
    observacoes: 'Óleo sintético 5W30',
    status: 'confirmado',
    dataAgendamento: '2024-05-10T14:30:00Z',
    carro: 'Honda Civic 2019',
    placa: 'ABC-1234'
  },
  {
    id: 'agend-2',
    usuarioId: 'user-2',
    nomeUsuario: 'Maria Santos',
    estabelecimentoId: 'estab-2',
    nomeEstabelecimento: 'Auto Center Gold',
    servico: 'Alinhamento',
    valor: 80.00,
    data: '2024-05-16',
    horario: '13:00',
    observacoes: '',
    status: 'pendente',
    dataAgendamento: '2024-05-11T10:15:00Z',
    carro: 'Fiat Argo 2020',
    placa: 'DEF-5678'
  },
  {
    id: 'agend-3',
    usuarioId: 'user-1',
    nomeUsuario: 'João Silva',
    estabelecimentoId: 'estab-3',
    nomeEstabelecimento: 'Lava Rápido LimpaCar',
    servico: 'Lavagem',
    valor: 60.00,
    data: '2024-05-18',
    horario: '10:00',
    observacoes: 'Inclui cera',
    status: 'concluido',
    dataAgendamento: '2024-05-10T09:00:00Z',
    avaliacaoId: 'aval-1',
    carro: 'Honda Civic 2019',
    placa: 'ABC-1234'
  }
];

// Serviços disponíveis e ícones
const servicosDisponiveis = [
  {
    nome: 'Mecânica',
    descricao: 'Manutenção e reparos para seu veículo',
    icone: 'images/mecanica-icon.png'
  },
  {
    nome: 'Borracharia',
    descricao: 'Soluções para pneus e rodas',
    icone: 'images/borracharia-icon.png'
  },
  {
    nome: 'Lavagem',
    descricao: 'Mantenha seu carro limpo e brilhando',
    icone: 'images/lavagem-icon.png'
  },
  {
    nome: 'Estética',
    descricao: 'Personalização e cuidados estéticos',
    icone: 'images/estetica-icon.png'
  }
];

// Dados de informações e conteúdo adicional
const paginasInformativas = {
  sobre: {
    titulo: 'Sobre o AutoPass',
    conteudo: `
      <h2>Nossa História</h2>
      <p>O AutoPass nasceu da necessidade de conectar motoristas a serviços automotivos de qualidade.</p>
      <p>Fundado em 2023, nosso objetivo é simplificar a vida de quem precisa de serviços para seu veículo, oferecendo uma plataforma intuitiva que permite encontrar, comparar e agendar serviços com facilidade.</p>
      
      <h2>Nossa Missão</h2>
      <p>Conectar pessoas a serviços automotivos de qualidade, economizando tempo e proporcionando tranquilidade.</p>
    `
  },
  contato: {
    titulo: 'Entre em Contato',
    conteudo: `
      <form id="form-contato" class="mb-4">
        <div class="mb-3">
          <label for="nome" class="form-label">Nome</label>
          <input type="text" class="form-control" id="nome" required>
        </div>
        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input type="email" class="form-control" id="email" required>
        </div>
        <div class="mb-3">
          <label for="mensagem" class="form-label">Mensagem</label>
          <textarea class="form-control" id="mensagem" rows="4" required></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Enviar Mensagem</button>
      </form>
      
      <div>
        <h3>Outras formas de contato</h3>
        <p><i class="bi bi-envelope"></i> Email: contato@autopass.com</p>
        <p><i class="bi bi-telephone"></i> Telefone: (11) 1234-5678</p>
        <p><i class="bi bi-geo-alt"></i> Endereço: Av. Paulista, 1000, São Paulo - SP</p>
      </div>
    `
  },
  termos: {
    titulo: 'Termos de Uso',
    conteudo: `
      <h2>Termos e Condições de Uso</h2>
      <p>Ao utilizar o AutoPass, você concorda com estes termos.</p>
      
      <h3>1. Cadastro</h3>
      <p>Para utilizar nossos serviços, é necessário realizar cadastro, fornecendo informações precisas e verdadeiras.</p>
      
      <h3>2. Privacidade</h3>
      <p>As informações coletadas são utilizadas conforme nossa Política de Privacidade.</p>
      
      <h3>3. Agendamentos</h3>
      <p>O AutoPass não é responsável diretamente pelos serviços prestados pelos estabelecimentos, atuando como plataforma de conexão.</p>
    `
  },
  privacidade: {
    titulo: 'Política de Privacidade',
    conteudo: `
      <h2>Política de Privacidade</h2>
      <p>Sua privacidade é importante para nós. Esta política descreve como coletamos e utilizamos seus dados.</p>
      
      <h3>Dados coletados</h3>
      <p>Coletamos informações de cadastro, localização e preferências para melhorar sua experiência.</p>
      
      <h3>Uso dos dados</h3>
      <p>Utilizamos seus dados para personalizar sua experiência, conectar você a estabelecimentos e melhorar nossos serviços.</p>
      
      <h3>Compartilhamento</h3>
      <p>Compartilhamos dados apenas com estabelecimentos parceiros necessários para a prestação do serviço.</p>
    `
  }
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar AOS (Animate On Scroll)
  AOS.init({
    duration: 800,
    easing: 'ease',
    once: true
  });
  
  // Inicializar elementos do Bootstrap
  inicializarToasts();
  inicializarModals();
  
  // Verificar sessão existente
  await verificarSessao();
  
  // Configurar formulários e eventos
  configurarEventosAuth();
  
  // Carregar a tela inicial
  if (!window.location.hash) {
    window.location.hash = '#home';
  }
  
  renderizarPagina();
  
  // Obter localização do usuário (para mapa)
  obterLocalizacaoUsuario();
});

// Verificação de sessão existente no Supabase
async function verificarSessao() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar sessão:', error);
      return;
    }
    
    if (data?.session) {
      await carregarDadosUsuario(data.session.user);
      exibirToast('Bem-vindo de volta!', 'success');
    }
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
  }
}

// Carregar dados do usuário após autenticação
async function carregarDadosUsuario(userData) {
  if (!userData) return;
  
  try {
    // Verificar se é um estabelecimento ou usuário comum
    const { data: estabelecimentoData } = await supabase
      .from('estabelecimentos')
      .select('*')
      .eq('user_id', userData.id)
      .single();
    
    if (estabelecimentoData) {
      usuario = {
        id: userData.id,
        nome: estabelecimentoData.nome || userData.email.split('@')[0],
        email: userData.email,
        estabelecimentoId: estabelecimentoData.id,
        foto: userData.user_metadata?.avatar_url || 'images/user-default.png'
      };
      tipoPainel = 'estabelecimento';
    } else {
      // Buscar perfil do usuário
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userData.id)
        .single();
      
      usuario = {
        id: userData.id,
        nome: perfilData?.nome || userData.email.split('@')[0],
        email: userData.email,
        estabelecimentoId: null,
        foto: userData.user_metadata?.avatar_url || 'images/user-default.png'
      };
      tipoPainel = 'usuario';
    }
    
    atualizarInterfaceUsuario();
    
    // Carregar favoritos do usuário
    await carregarFavoritos();
    
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
  }
}

// Configuração de modais
function inicializarModals() {
  loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
  
  // Configurar aba de login/cadastro para manter estado após fechar
  const authTab = document.getElementById('authTab');
  if (authTab) {
    authTab.addEventListener('shown.bs.tab', event => {
      localStorage.setItem('lastAuthTab', event.target.id);
    });
    
    // Restaurar última aba usada
    const lastTab = localStorage.getItem('lastAuthTab');
    if (lastTab) {
      const tab = new bootstrap.Tab(document.getElementById(lastTab));
      tab.show();
    }
  }
  
  // Configurar botões do modal (Google e estabelecimento)
  const btnGoogleLogin = document.getElementById('btn-google-login');
  if (btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', () => {
      loginGoogle();
      loginModal.hide();
    });
  }
  
  const btnEstabelecimentoLogin = document.getElementById('btn-estabelecimento-login');
  if (btnEstabelecimentoLogin) {
    btnEstabelecimentoLogin.addEventListener('click', () => {
      // Abrir submodal para escolher o estabelecimento (simplificado)
      const estabelecimentoId = prompt('Digite o ID do estabelecimento (1, 2 ou 3):');
      if (estabelecimentoId) {
        loginEstabelecimento(parseInt(estabelecimentoId));
        loginModal.hide();
      }
    });
  }
}

// Configuração de toasts
function inicializarToasts() {
  toastElement = document.getElementById('autopassToast');
  if (toastElement) {
    toastInstance = new bootstrap.Toast(toastElement, {
      delay: 5000
    });
  }
}

// Exibir mensagens toast
function exibirToast(mensagem, tipo = 'info') {
  const toastBody = document.querySelector('.toast-body');
  if (!toastBody) return;
  
  toastBody.innerHTML = mensagem;
  
  const headerClass = tipo === 'success' ? 'bg-success text-white' : 
                      tipo === 'error' ? 'bg-danger text-white' : '';
  
  const toastHeader = document.querySelector('.toast-header');
  if (toastHeader) {
    toastHeader.className = `toast-header ${headerClass}`;
  }
  
  toastInstance.show();
}

// Configuração de eventos de autenticação
function configurarEventosAuth() {
  // Login Form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        if (data?.user) {
          await carregarDadosUsuario(data.user);
          loginModal.hide();
          exibirToast('Login realizado com sucesso!', 'success');
          navegar('#painel');
        }
      } catch (error) {
        document.getElementById('login-error').textContent = error.message;
        document.getElementById('login-error').classList.remove('d-none');
      }
    });
  }
  
  // Registro Form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nome = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const passwordConfirm = document.getElementById('register-password-confirm').value;
      
      if (password !== passwordConfirm) {
        document.getElementById('register-error').textContent = 'As senhas não coincidem';
        document.getElementById('register-error').classList.remove('d-none');
        return;
      }
      
      try {
        // Criar usuário
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome
            }
          }
        });
        
        if (error) throw error;
        
        if (data?.user) {
          // Criar perfil
          const { error: perfilError } = await supabase
            .from('perfis')
            .insert([
              { id: data.user.id, nome, email }
            ]);
          
          if (perfilError) throw perfilError;
          
          await carregarDadosUsuario(data.user);
          loginModal.hide();
          exibirToast('Cadastro realizado com sucesso!', 'success');
          navegar('#painel');
        }
      } catch (error) {
        document.getElementById('register-error').textContent = error.message;
        document.getElementById('register-error').classList.remove('d-none');
      }
    });
  }
  
  // Botão de login do header
  const btnLoginTopo = document.getElementById('btn-login-topo');
  if (btnLoginTopo) {
    btnLoginTopo.addEventListener('click', () => {
      if (usuario) {
        navegar('#painel');
      } else {
        loginModal.show();
      }
    });
  }
  
  // Login com Google
  const btnGoogleLogin = document.getElementById('btn-google-login');
  if (btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', async () => {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google'
        });
        
        if (error) throw error;
        
        // Redirecionamento será feito pelo Supabase
      } catch (error) {
        exibirToast('Erro ao fazer login com Google: ' + error.message, 'error');
      }
    });
  }
}

// Exibir a página inicial
function mostrarHome() {
  document.getElementById('home').style.display = '';
  document.getElementById('app').style.display = 'none';
  
  // Gerar cards de serviços
  const cardsDiv = document.getElementById('servicos-cards');
  cardsDiv.innerHTML = servicosDisponiveis.map(s => `
    <div class="card-servico" onclick="escolherServico('${s.nome}')">
      <img src="${s.icone}" alt="${s.nome}">
      <h3>${s.nome}</h3>
      <p>${s.descricao}</p>
      <button class="btn btn-primary btn-ver-opcoes">Ver opções</button>
    </div>
  `).join('');
  
  // Configurar busca na página inicial
  document.getElementById('search-button').addEventListener('click', realizarBusca);
  document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      realizarBusca();
    }
  });
}

// Função para realizar busca
function realizarBusca() {
  const termo = document.getElementById('search-input').value.trim();
  if (termo) {
    window._servicoSelecionado = termo;
    navegar('#mapa');
  }
}

// Função para escolher um serviço
window.escolherServico = function(servico) {
  window._servicoSelecionado = servico;
  navegar('#mapa');
};

// Navegação para páginas informativas
window.navegarPagina = function(pagina) {
  if (paginasInformativas[pagina]) {
    navegar('#pagina-' + pagina);
  }
};

// SPA: navegação
function navegar(rota, params = {}) {
  if (rota === '#home') {
    window.location.hash = '#home';
    renderizarHome();
    return;
  }
  
  window.location.hash = rota;
  renderizarPagina();
}

// Renderização de páginas
function renderizarPagina() {
  const hash = window.location.hash || '#home';
  
  // Mostrar home ou app com base na rota
  if (hash === '#home') {
    document.getElementById('home').style.display = '';
    document.getElementById('app').style.display = 'none';
    renderizarHome();
    return;
  } else {
    document.getElementById('home').style.display = 'none';
    document.getElementById('app').style.display = '';
  }
  
  const app = document.getElementById('app');
  if (!app) return;
  
  // Navegar para as diferentes telas
  if (hash.startsWith('#pagina-')) {
    renderizarPaginaInformativa(hash.replace('#pagina-', ''));
  } else if (hash === '#login') {
    loginModal.show();
  } else if (hash === '#painel') {
    renderizarPainel();
  } else if (hash.startsWith('#detalhe-')) {
    const id = parseInt(hash.split('-')[1]);
    renderizarDetalheEstabelecimento(id);
  } else if (hash === '#mapa' || hash === '#busca') {
    renderizarMapaBusca();
  } else if (hash === '#favoritos') {
    renderizarFavoritos();
  } else if (hash === '#cadastro-estabelecimento') {
    renderizarCadastroEstabelecimento();
  } else {
    // Rota não encontrada, volta para home
    navegar('#home');
  }
}

// Renderizar home page
function renderizarHome() {
  // Gerar cards de serviços
  const cardsDiv = document.getElementById('servicos-cards');
  if (!cardsDiv) return;
  
  const servicosDisponiveis = [
    {
      nome: 'Mecânica',
      descricao: 'Manutenção e reparos para seu veículo',
      icone: 'images/mecanica-icon.png'
    },
    {
      nome: 'Borracharia',
      descricao: 'Soluções para pneus e rodas',
      icone: 'images/borracharia-icon.png'
    },
    {
      nome: 'Lavagem',
      descricao: 'Mantenha seu carro limpo e brilhando',
      icone: 'images/lavagem-icon.png'
    },
    {
      nome: 'Estética',
      descricao: 'Personalização e cuidados estéticos',
      icone: 'images/estetica-icon.png'
    }
  ];
  
  cardsDiv.innerHTML = servicosDisponiveis.map(s => `
    <div class="card-servico" data-aos="fade-up" onclick="escolherServico('${s.nome}')">
      <img src="${s.icone}" alt="${s.nome}">
      <h3>${s.nome}</h3>
      <p>${s.descricao}</p>
      <button class="btn btn-primary btn-ver-opcoes">Ver opções</button>
    </div>
  `).join('');
  
  // Configurar busca na página inicial
  const searchButton = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');
  
  if (searchButton && searchInput) {
    searchButton.onclick = realizarBusca;
    searchInput.onkeypress = e => {
      if (e.key === 'Enter') realizarBusca();
    };
  }
}

// Obter localização do usuário
function obterLocalizacaoUsuario() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      // Sucesso
      position => {
        posicaoUsuario = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        // Se já estivermos na tela do mapa, atualiza
        if (window.location.hash === '#mapa' && mapInstance) {
          centralizarMapaEmUsuario();
        }
      },
      // Erro
      error => {
        console.warn('Erro ao obter localização:', error);
      },
      // Opções
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }
}

// Centralizar mapa na posição do usuário
function centralizarMapaEmUsuario() {
  if (mapInstance && posicaoUsuario) {
    mapInstance.setCenter(posicaoUsuario);
    mapInstance.setZoom(14);
    
    // Adicionar marcador da posição atual
    if (window._marcadorUsuario) {
      window._marcadorUsuario.setMap(null);
    }
    
    window._marcadorUsuario = new google.maps.Marker({
      position: posicaoUsuario,
      map: mapInstance,
      title: 'Sua localização',
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new google.maps.Size(32, 32)
      },
      animation: google.maps.Animation.DROP
    });
    
    // Adicionar círculo de raio
    if (window._raioUsuario) {
      window._raioUsuario.setMap(null);
    }
    
    window._raioUsuario = new google.maps.Circle({
      map: mapInstance,
      center: posicaoUsuario,
      radius: 2500, // 2.5km
      fillColor: '#4285F4',
      fillOpacity: 0.1,
      strokeColor: '#4285F4',
      strokeOpacity: 0.3,
      strokeWeight: 1
    });
    
    // Filtrar e mostrar estabelecimentos apenas no raio
    renderizarEstabelecimentosProximos();
  }
}

// Renderizar estabelecimentos próximos
function renderizarEstabelecimentosProximos() {
  if (!posicaoUsuario || !mapInstance) return;
  
  const estabelecimentosProximos = dadosEstabelecimentos.filter(e => {
    // Cálculo da distância usando fórmula de Haversine
    const R = 6371; // Raio da Terra em km
    const dLat = (e.lat - posicaoUsuario.lat) * Math.PI / 180;
    const dLon = (e.lng - posicaoUsuario.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(posicaoUsuario.lat * Math.PI / 180) * Math.cos(e.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distancia = R * c;
    
    // Guardar a distância para uso posterior
    e.distancia = distancia.toFixed(1);
    
    // Retorna apenas estabelecimentos a menos de 30km
    return distancia <= 30;
  });
  
  // Ordenar por distância
  estabelecimentosProximos.sort((a, b) => a.distancia - b.distancia);
  
  // Renderizar marcadores e lista
  renderizarMarcadoresNoMapa(estabelecimentosProximos);
  renderizarListaEstabelecimentos(estabelecimentosProximos);
}

// Carregar script do Google Maps
function carregarScriptGoogleMaps() {
  if (document.getElementById('google-maps-script')) {
    if (window.google?.maps && document.getElementById('map')) {
      inicializarMapa();
    }
    return;
  }
  
  const script = document.createElement('script');
  script.id = 'google-maps-script';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=inicializarMapa&language=pt-BR&libraries=places`;
  script.async = true;
  window.inicializarMapa = inicializarMapa;
  document.body.appendChild(script);
}

// Inicializar mapa
function inicializarMapa() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;
  
  mapInstance = new google.maps.Map(mapElement, {
    center: posicaoUsuario || { lat: -14.2350, lng: -51.9253 }, // Brasil ou localização do usuário
    zoom: posicaoUsuario ? 14 : 5,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [
      {
        "featureType": "poi",
        "stylers": [{ "visibility": "off" }]
      }
    ]
  });
  
  // Adicionar controle de localização
  const locationButton = document.createElement("button");
  locationButton.innerHTML = '<i class="bi bi-geo-alt-fill"></i>';
  locationButton.className = "btn-mapa-localizacao";
  locationButton.title = "Minha Localização";
  
  mapInstance.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButton);
  
  locationButton.addEventListener("click", () => {
    obterLocalizacaoUsuario();
    centralizarMapaEmUsuario();
  });
  
  // Se temos a localização do usuário, mostrar marcador
  if (posicaoUsuario) {
    centralizarMapaEmUsuario();
  } else {
    // Caso contrário, mostrar todos os estabelecimentos
    renderizarMarcadoresNoMapa(dadosEstabelecimentos);
  }
}

// Renderizar marcadores no mapa
function renderizarMarcadoresNoMapa(locais) {
  if (!mapInstance) return;
  
  // Limpar marcadores existentes
  if (marcadores.length > 0) {
    marcadores.forEach(m => m.setMap(null));
    marcadores = [];
  }
  
  // Adicionar novos marcadores
  marcadores = locais.map(local => {
    const marker = new google.maps.Marker({
      position: { lat: local.lat, lng: local.lng },
      map: mapInstance,
      title: local.nome,
      animation: google.maps.Animation.DROP
    });
    
    // Criar infowindow com detalhes
    const infowindow = new google.maps.InfoWindow({
      content: `
        <div style="max-width: 250px; padding: 5px;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${local.nome}</div>
          <div style="margin-bottom: 5px;">
            <span style="color: #D0AF33; font-weight: bold;">${local.avaliacao}</span> ★
            <span style="color: #666; font-size: 13px;"> (${local.avaliacoes?.length || 0} avaliações)</span>
          </div>
          <div style="font-size: 13px; color: #444; margin-bottom: 5px;">${local.servicos.join(', ')}</div>
          ${local.distancia ? `<div style="font-size: 13px; color: #11100C; margin-bottom: 8px;"><strong>Distância:</strong> ${local.distancia} km</div>` : ''}
          <button 
            onclick="navegar('#detalhe-${local.id}')" 
            style="background: #D0AF33; color: #11100C; border: none; padding: 8px 12px; 
                  border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold;">
            Ver detalhes
          </button>
        </div>
      `
    });
    
    // Evento de clique para mostrar infowindow
    marker.addListener('click', () => {
      // Fechar outras infowindows que estejam abertas
      marcadores.forEach(m => {
        if (m.infowindow && m !== marker) {
          m.infowindow.close();
        }
      });
      
      infowindow.open(mapInstance, marker);
    });
    
    // Guardar referência à infowindow
    marker.infowindow = infowindow;
    
    return marker;
  });
  
  // Se há resultados, ajustar visualização para incluir todos os marcadores
  if (marcadores.length > 0 && !posicaoUsuario) {
    const bounds = new google.maps.LatLngBounds();
    
    marcadores.forEach(marker => {
      bounds.extend(marker.getPosition());
    });
    
    mapInstance.fitBounds(bounds);
    
    // Se só tem um resultado, dar zoom
    if (marcadores.length === 1) {
      mapInstance.setZoom(14);
    }
  }
}

// Login Google
function loginGoogle() {
  // Simulação de login
  usuario = {
    id: Date.now(),
    nome: 'Usuário Google',
    email: 'usuario@google.com',
    foto: 'images/user-default.png',
    estabelecimentoId: null
  };
  tipoPainel = 'usuario';
  
  // Atualizar interface para mostrar o usuário logado
  atualizarInterfaceUsuario();
  
  navegar('#painel');
}

// Login como estabelecimento
window.loginEstabelecimento = function(id) {
  const est = dadosEstabelecimentos.find(e => e.id === id);
  if (est) {
    usuario = {
      id: 'estab-' + est.id,
      nome: est.nome,
      email: est.nome.toLowerCase().replace(/ /g, '') + '@autopass.com',
      estabelecimentoId: est.id
    };
    tipoPainel = 'estabelecimento';
    
    // Atualizar interface para mostrar o usuário logado
    atualizarInterfaceUsuario();
    
    navegar('#painel');
  }
};

// Atualizar interface após login
function atualizarInterfaceUsuario() {
  const btnLoginTopo = document.getElementById('btn-login-topo');
  if (usuario && btnLoginTopo) {
    btnLoginTopo.textContent = 'Meu Painel';
    btnLoginTopo.onclick = () => navegar('#painel');
  }
}

// Inicialização do modal de login
function logout() {
  usuario = null;
  tipoPainel = null;
  
  // Resetar botão de login
  const btnLoginTopo = document.getElementById('btn-login-topo');
  if (btnLoginTopo) {
    btnLoginTopo.textContent = 'Entrar';
    btnLoginTopo.onclick = () => loginModal.show();
  }
  
  navegar('#home');
}

// SPA: escuta mudanças na hash
window.onhashchange = () => {
  if (window.location.hash === '#home' || window.location.hash === '') {
    mostrarHome();
  } else {
    document.getElementById('home').style.display = 'none';
    document.getElementById('app').style.display = '';
    renderizarPagina();
  }
};

// --- RENDERIZAÇÃO DE TELAS ---

// Renderizar tela de mapa e busca
function renderizarMapaBusca() {
  const app = document.getElementById('app');
  if (!app) return;
  
  app.innerHTML = `
    <div class="container py-4 mapa-page">
      <div class="card mb-4">
        <div class="card-header bg-white d-flex justify-content-between align-items-center flex-wrap">
          <h2 class="h5 mb-0">Estabelecimentos</h2>
          <div class="d-flex gap-2 align-items-center">
            <div class="input-group input-group-sm" style="max-width: 320px;">
              <input type="text" id="filtro-texto" class="form-control" placeholder="Buscar...">
              <select id="filtro-servico" class="form-select" style="max-width: 130px;">
                <option value="">Serviços</option>
                ${[...new Set(dadosEstabelecimentos.flatMap(e => e.servicos))].map(s => 
                  `<option value="${s}" ${window._servicoSelecionado === s ? 'selected' : ''}>${s}</option>`
                ).join('')}
              </select>
              <button id="btn-filtrar" class="btn btn-primary">
                <i class="bi bi-search"></i>
              </button>
            </div>
            <button id="btn-mostrar-como" class="btn btn-sm btn-outline-secondary">
              <i class="bi bi-grid"></i>
            </button>
          </div>
        </div>
        <div class="card-body p-0">
          <div id="map" style="height: 450px;"></div>
        </div>
      </div>
      
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="h5 mb-0">Resultados encontrados</h3>
        <div class="d-flex align-items-center gap-2">
          <span class="small text-muted" id="contador-resultados"></span>
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
              Ordenar por
            </button>
            <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
              <li><a class="dropdown-item" href="#" data-ordenacao="avaliacao">Melhor avaliação</a></li>
              <li><a class="dropdown-item" href="#" data-ordenacao="distancia">Mais próximo</a></li>
              <li><a class="dropdown-item" href="#" data-ordenacao="nome">Nome (A-Z)</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="row" id="lista-estabelecimentos">
        <!-- Lista de estabelecimentos -->
      </div>
    </div>
  `;
  
  // Carregar mapa
  carregarScriptGoogleMaps();
  
  // Configurar filtros
  const btnFiltrar = document.getElementById('btn-filtrar');
  const filtroTexto = document.getElementById('filtro-texto');
  const filtroServico = document.getElementById('filtro-servico');
  
  if (btnFiltrar && filtroTexto && filtroServico) {
    // Aplicar filtro inicial se houver
    if (window._servicoSelecionado) {
      filtroServico.value = window._servicoSelecionado;
      filtrarEstabelecimentos();
    } else {
      renderizarListaEstabelecimentos(dadosEstabelecimentos);
    }
    
    // Configurar eventos
    btnFiltrar.addEventListener('click', filtrarEstabelecimentos);
    filtroTexto.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') filtrarEstabelecimentos();
    });
  }
  
  // Configurar ordenação
  const opcoesOrdenacao = document.querySelectorAll('[data-ordenacao]');
  opcoesOrdenacao.forEach(opcao => {
    opcao.addEventListener('click', (e) => {
      e.preventDefault();
      const criterio = opcao.dataset.ordenacao;
      ordenarEstabelecimentos(criterio);
    });
  });
}

// Filtrar estabelecimentos por texto e serviço
function filtrarEstabelecimentos() {
  const texto = document.getElementById('filtro-texto')?.value?.toLowerCase().trim() || '';
  const servico = document.getElementById('filtro-servico')?.value || '';
  
  let filtrados = dadosEstabelecimentos;
  
  // Filtrar por serviço
  if (servico) {
    filtrados = filtrados.filter(e => e.servicos.includes(servico));
  }
  
  // Filtrar por texto
  if (texto) {
    filtrados = filtrados.filter(e => 
      e.nome.toLowerCase().includes(texto) || 
      e.descricao.toLowerCase().includes(texto) || 
      e.endereco.toLowerCase().includes(texto) ||
      e.servicos.some(s => s.toLowerCase().includes(texto))
    );
  }
  
  // Renderizar resultados
  renderizarMarcadoresNoMapa(filtrados);
  renderizarListaEstabelecimentos(filtrados);
}

// Ordenar estabelecimentos
function ordenarEstabelecimentos(criterio) {
  const lista = document.getElementById('lista-estabelecimentos');
  if (!lista) return;
  
  // Obter estabelecimentos que estão sendo exibidos
  const estabelecimentosExibidos = [...dadosEstabelecimentos];
  
  switch(criterio) {
    case 'avaliacao':
      estabelecimentosExibidos.sort((a, b) => b.avaliacao - a.avaliacao);
      break;
    case 'distancia':
      if (posicaoUsuario) {
        estabelecimentosExibidos.sort((a, b) => parseFloat(a.distancia || 999) - parseFloat(b.distancia || 999));
      }
      break;
    case 'nome':
      estabelecimentosExibidos.sort((a, b) => a.nome.localeCompare(b.nome));
      break;
  }
  
  // Renderizar lista ordenada
  renderizarListaEstabelecimentos(estabelecimentosExibidos);
}

// Renderizar lista de estabelecimentos
function renderizarListaEstabelecimentos(listaEstabelecimentos) {
  const listaElement = document.getElementById('lista-estabelecimentos');
  const contadorElement = document.getElementById('contador-resultados');
  
  if (!listaElement) return;
  
  // Atualizar contador
  if (contadorElement) {
    contadorElement.textContent = `${listaEstabelecimentos.length} estabelecimento(s)`;
  }
  
  // Ver se o estabelecimento é favorito
  const isFavorito = (id) => {
    return estabelecimentosFavoritos.some(f => f.id === id);
  };
  
  listaElement.innerHTML = listaEstabelecimentos.length ? listaEstabelecimentos.map(e => `
    <div class="col-lg-4 col-md-6 mb-4">
      <div class="card h-100 establecimento-card" onclick="navegar('#detalhe-${e.id}')">
        <div class="card-img-wrapper">
          <img src="${e.imagem}" class="card-img-top" alt="${e.nome}">
          <button class="btn-favorito ${isFavorito(e.id) ? 'favorito' : ''}" 
            onclick="toggleFavorito(event, ${e.id})">
            <i class="bi ${isFavorito(e.id) ? 'bi-heart-fill' : 'bi-heart'}"></i>
          </button>
        </div>
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title">${e.nome}</h5>
            <span class="badge bg-warning text-dark">
              <i class="bi bi-star-fill"></i> ${e.avaliacao}
            </span>
          </div>
          <p class="card-text mb-1"><i class="bi bi-geo-alt"></i> ${e.endereco}</p>
          ${e.distancia ? `<p class="card-text text-primary mb-2"><i class="bi bi-signpost"></i> ${e.distancia} km</p>` : ''}
          <p class="card-text">
            <strong>Serviços:</strong>
            ${e.servicos.map(s => `<span class="badge bg-light text-dark me-1">${s}</span>`).join('')}
          </p>
        </div>
        <div class="card-footer bg-white">
          <button class="btn btn-sm btn-primary w-100">Ver detalhes</button>
        </div>
      </div>
    </div>
  `).join('') : `
    <div class="col-12 text-center py-5">
      <div class="alert alert-warning">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Nenhum estabelecimento encontrado com os filtros selecionados.
      </div>
    </div>
  `;
}

// Renderizar página de detalhes do estabelecimento
function renderizarDetalheEstabelecimento(id) {
  const app = document.getElementById('app');
  if (!app) return;
  
  const est = dadosEstabelecimentos.find(e => e.id === id);
  if (!est) {
    navegar('#mapa');
    return;
  }
  
  const isFavorito = estabelecimentosFavoritos.some(f => f.id === id);
  
  app.innerHTML = `
    <div class="container py-4 detalhe-page">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="#home" onclick="navegar('#home')">Início</a></li>
          <li class="breadcrumb-item"><a href="#mapa" onclick="navegar('#mapa')">Mapa</a></li>
          <li class="breadcrumb-item active" aria-current="page">${est.nome}</li>
        </ol>
      </nav>
      
      <div class="card mb-4">
        <div class="row g-0">
          <div class="col-md-5">
            <img src="${est.imagem}" class="img-fluid rounded-start h-100 object-fit-cover" alt="${est.nome}">
          </div>
          <div class="col-md-7">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <h2 class="card-title h4 mb-0">${est.nome}</h2>
                <div>
                  <button onclick="toggleFavorito(event, ${est.id})" class="btn btn-outline-danger btn-sm me-2">
                    <i class="bi ${isFavorito ? 'bi-heart-fill' : 'bi-heart'}"></i>
                    ${isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  </button>
                  <span class="badge bg-warning text-dark p-2">
                    <i class="bi bi-star-fill"></i> ${est.avaliacao}
                  </span>
                </div>
              </div>
              
              <p class="card-text mb-1"><i class="bi bi-geo-alt"></i> <b>Endereço:</b> ${est.endereco}</p>
              ${est.distancia ? `<p class="card-text text-primary mb-2"><i class="bi bi-signpost"></i> <b>Distância:</b> ${est.distancia} km</p>` : ''}
              <p class="card-text mb-2"><i class="bi bi-tools"></i> <b>Serviços:</b> ${est.servicos.join(', ')}</p>
              <p class="card-text"><i class="bi bi-info-circle"></i> <b>Descrição:</b> ${est.descricao}</p>
              
              <div class="mt-4">
                <h5>Localização</h5>
                <div id="mapa-detalhe" style="height: 200px; border-radius: 8px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row">
        <!-- Agendamento -->
        <div class="col-lg-7 mb-4">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h3 class="h5 mb-0">Agendar serviço</h3>
            </div>
            <div class="card-body">
              ${usuario ? `
                <form id="form-agendar" class="form-agendar">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Serviço:</label>
                      <select name="servico" class="form-select">
                        ${est.servicos.map(s => `<option value="${s}">${s}</option>`).join('')}
                      </select>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Horário:</label>
                      <select name="horario" class="form-select">
                        ${est.horarios.map(h => `<option value="${h}">${h}</option>`).join('')}
                      </select>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Data:</label>
                    <input type="date" name="data" class="form-control" min="${new Date().toISOString().split('T')[0]}" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Observações:</label>
                    <textarea name="observacoes" class="form-control" rows="2" placeholder="Opcional"></textarea>
                  </div>
                  <button type="submit" class="btn btn-primary btn-lg w-100">Agendar</button>
                </form>
              ` : `
                <div class="text-center py-4">
                  <p class="mb-3">Faça login para agendar um serviço neste estabelecimento!</p>
                  <button onclick="loginModal.show()" class="btn btn-primary">Entrar</button>
                </div>
              `}
            </div>
          </div>
        </div>
        
        <!-- Avaliações -->
        <div class="col-lg-5 mb-4">
          <div class="card">
            <div class="card-header bg-white">
              <h3 class="h5 mb-0">Avaliações</h3>
            </div>
            <div class="card-body p-0">
              <ul class="list-group list-group-flush">
                ${est.avaliacoes?.length ? est.avaliacoes.map(a => `
                  <li class="list-group-item">
                    <div class="d-flex justify-content-between mb-1">
                      <strong>${a.usuario}</strong>
                      <span class="text-warning">${'★'.repeat(Math.floor(a.nota))}${a.nota % 1 >= 0.5 ? '½' : ''}</span>
                    </div>
                    <p class="mb-0">${a.comentario}</p>
                  </li>
                `).join('') : `
                  <li class="list-group-item text-center py-4">
                    <p class="text-muted mb-0">Nenhuma avaliação ainda.</p>
                  </li>
                `}
              </ul>
            </div>
            ${usuario ? `
              <div class="card-footer bg-white">
                <form id="form-avaliacao">
                  <div class="mb-2">
                    <label class="form-label">Sua avaliação:</label>
                    <select name="nota" class="form-select form-select-sm" required>
                      <option value="5">5 estrelas - Excelente</option>
                      <option value="4">4 estrelas - Muito bom</option>
                      <option value="3">3 estrelas - Bom</option>
                      <option value="2">2 estrelas - Regular</option>
                      <option value="1">1 estrela - Ruim</option>
                    </select>
                  </div>
                  <div class="mb-2">
                    <label class="form-label">Comentário:</label>
                    <textarea name="comentario" class="form-control form-control-sm" rows="2" required></textarea>
                  </div>
                  <button type="submit" class="btn btn-sm btn-primary">Enviar avaliação</button>
                </form>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Inicializar mapa de detalhe
  if (window.google?.maps) {
    const mapaDetalhe = new google.maps.Map(document.getElementById('mapa-detalhe'), {
      center: { lat: est.lat, lng: est.lng },
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false
    });
    
    new google.maps.Marker({
      position: { lat: est.lat, lng: est.lng },
      map: mapaDetalhe,
      title: est.nome
    });
  } else {
    // Carregar script do Google Maps se ainda não estiver carregado
    const script = document.createElement('script');
    script.id = 'google-maps-script-detalhe';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=inicializarMapaDetalhe&language=pt-BR`;
    script.async = true;
    window.inicializarMapaDetalhe = function() {
      const mapaDetalhe = new google.maps.Map(document.getElementById('mapa-detalhe'), {
        center: { lat: est.lat, lng: est.lng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false
      });
      
      new google.maps.Marker({
        position: { lat: est.lat, lng: est.lng },
        map: mapaDetalhe,
        title: est.nome
      });
    };
    document.body.appendChild(script);
  }
  
  // Configurar agendamento
  const formAgendar = document.getElementById('form-agendar');
  if (formAgendar) {
    formAgendar.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const servico = this.servico.value;
      const horario = this.horario.value;
      const data = this.data.value;
      const observacoes = this.observacoes.value;
      
      const novoAgendamento = {
        id: Date.now(),
        usuarioId: usuario.id,
        nomeUsuario: usuario.nome,
        nomeEstabelecimento: est.nome,
        estabelecimentoId: est.id,
        servico,
        horario,
        data,
        observacoes,
        status: 'pendente',
        dataAgendamento: new Date().toISOString()
      };
      
      // Adicionar ao array de agendamentos (em produção seria no Supabase)
      agendamentos.push(novoAgendamento);
      
      // Feedback
      exibirToast(`Agendamento de ${servico} realizado com sucesso!`, 'success');
      
      // Redirecionar para o painel
      setTimeout(() => {
        navegar('#painel');
      }, 2000);
    });
  }
  
  // Configurar avaliação
  const formAvaliacao = document.getElementById('form-avaliacao');
  if (formAvaliacao) {
    formAvaliacao.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const nota = parseFloat(this.nota.value);
      const comentario = this.comentario.value;
      
      // Adicionar avaliação (em produção seria no Supabase)
      if (!est.avaliacoes) est.avaliacoes = [];
      
      est.avaliacoes.push({
        id: Date.now(),
        usuario: usuario.nome,
        usuarioId: usuario.id,
        comentario,
        nota,
        data: new Date().toISOString()
      });
      
      // Recalcular média
      est.avaliacao = (est.avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / est.avaliacoes.length).toFixed(1);
      
      // Feedback
      exibirToast('Avaliação enviada com sucesso!', 'success');
      
      // Recarregar para mostrar avaliação
      renderizarDetalheEstabelecimento(id);
    });
  }
}

// Renderizar painel do usuário/estabelecimento
function renderizarPainel() {
  if (!usuario) {
    loginModal.show();
    return;
  }
  
  const app = document.getElementById('app');
  if (!app) return;
  
  if (tipoPainel === 'estabelecimento') {
    renderizarPainelEstabelecimento(app);
  } else {
    renderizarPainelUsuario(app);
  }
}

// Renderizar painel do usuário
function renderizarPainelUsuario(app) {
  const agendamentosUsuario = agendamentos.filter(a => a.usuarioId === usuario.id);
  
  // Separar por status
  const pendentes = agendamentosUsuario.filter(a => a.status === 'pendente');
  const confirmados = agendamentosUsuario.filter(a => a.status === 'confirmado');
  const concluidos = agendamentosUsuario.filter(a => a.status === 'concluido');
  
  app.innerHTML = `
    <div class="container py-4">
      <!-- Cards de resumo -->
      <div class="row mb-4">
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="card h-100 bg-light border-0">
            <div class="card-body text-center">
              <h1 class="display-4 mb-0 text-primary">${pendentes.length}</h1>
              <p class="text-muted mb-0">Agendamentos Pendentes</p>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="card h-100 bg-light border-0">
            <div class="card-body text-center">
              <h1 class="display-4 mb-0 text-success">${confirmados.length}</h1>
              <p class="text-muted mb-0">Agendamentos Confirmados</p>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="card h-100 bg-light border-0">
            <div class="card-body text-center">
              <h1 class="display-4 mb-0 text-info">${concluidos.length}</h1>
              <p class="text-muted mb-0">Serviços Concluídos</p>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="card h-100 bg-light border-0">
            <div class="card-body text-center">
              <h1 class="display-4 mb-0 text-warning">${estabelecimentosFavoritos.length}</h1>
              <p class="text-muted mb-0">Estabelecimentos Favoritos</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Abas -->
      <ul class="nav nav-tabs" id="painelTab" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="agendamentos-tab" data-bs-toggle="tab" data-bs-target="#agendamentos" type="button" role="tab" aria-controls="agendamentos" aria-selected="true">
            Meus Agendamentos
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="favoritos-tab" data-bs-toggle="tab" data-bs-target="#favoritos" type="button" role="tab" aria-controls="favoritos" aria-selected="false">
            Favoritos
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="perfil-tab" data-bs-toggle="tab" data-bs-target="#perfil" type="button" role="tab" aria-controls="perfil" aria-selected="false">
            Meu Perfil
          </button>
        </li>
      </ul>
      
      <div class="tab-content" id="painelTabContent">
        <!-- Agendamentos -->
        <div class="tab-pane fade show active" id="agendamentos" role="tabpanel" aria-labelledby="agendamentos-tab">
          <div class="card border-top-0 rounded-top-0">
            <div class="card-body p-0">
              ${agendamentosUsuario.length ? `
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Estabelecimento</th>
                        <th>Serviço</th>
                        <th>Data</th>
                        <th>Horário</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${agendamentosUsuario.map(a => `
                        <tr>
                          <td>${a.nomeEstabelecimento}</td>
                          <td>${a.servico}</td>
                          <td>${a.data || '01/01/2024'}</td>
                          <td>${a.horario}</td>
                          <td>
                            <span class="badge bg-${a.status === 'pendente' ? 'warning' : a.status === 'confirmado' ? 'success' : 'info'}">
                              ${a.status === 'pendente' ? 'Pendente' : a.status === 'confirmado' ? 'Confirmado' : 'Concluído'}
                            </span>
                          </td>
                          <td>
                            <button class="btn btn-sm btn-primary" onclick="navegar('#detalhe-${a.estabelecimentoId}')">
                              Ver Estabelecimento
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="cancelarAgendamento(${a.id})">
                              Cancelar
                            </button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : `
                <div class="text-center py-5">
                  <p class="mb-3">Você ainda não tem agendamentos.</p>
                  <button onclick="navegar('#mapa')" class="btn btn-primary">Procurar estabelecimentos</button>
                </div>
              `}
            </div>
          </div>
        </div>
        
        <!-- Favoritos -->
        <div class="tab-pane fade" id="favoritos" role="tabpanel" aria-labelledby="favoritos-tab">
          <div class="card border-top-0 rounded-top-0">
            <div class="card-body">
              ${estabelecimentosFavoritos.length ? `
                <div class="row">
                  ${estabelecimentosFavoritos.map(est => `
                    <div class="col-md-4 mb-4">
                      <div class="card h-100 shadow-sm" onclick="navegar('#detalhe-${est.id}')">
                        <img src="${est.imagem}" class="card-img-top" alt="${est.nome}" style="height: 150px; object-fit: cover;">
                        <div class="card-body">
                          <h5 class="card-title">${est.nome}</h5>
                          <p class="card-text small">${est.servicos.join(', ')}</p>
                        </div>
                        <div class="card-footer bg-white d-flex justify-content-between align-items-center">
                          <span class="badge bg-warning text-dark"><i class="bi bi-star-fill"></i> ${est.avaliacao}</span>
                          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); toggleFavorito(event, ${est.id})">
                            <i class="bi bi-heart-fill"></i> Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="text-center py-5">
                  <p class="mb-3">Você ainda não tem estabelecimentos favoritos.</p>
                  <button onclick="navegar('#mapa')" class="btn btn-primary">Procurar estabelecimentos</button>
                </div>
              `}
            </div>
          </div>
        </div>
        
        <!-- Perfil -->
        <div class="tab-pane fade" id="perfil" role="tabpanel" aria-labelledby="perfil-tab">
          <div class="card border-top-0 rounded-top-0">
            <div class="card-body">
              <div class="row">
                <div class="col-md-4">
                  <div class="text-center mb-4">
                    <img src="${usuario.foto || 'images/user-default.png'}" class="rounded-circle img-thumbnail mb-3" alt="${usuario.nome}" style="width: 150px; height: 150px; object-fit: cover;">
                    <h4>${usuario.nome}</h4>
                    <p class="text-muted">${usuario.email}</p>
                  </div>
                </div>
                <div class="col-md-8">
                  <form id="form-perfil">
                    <div class="mb-3">
                      <label for="perfil-nome" class="form-label">Nome completo</label>
                      <input type="text" class="form-control" id="perfil-nome" value="${usuario.nome}">
                    </div>
                    <div class="mb-3">
                      <label for="perfil-email" class="form-label">Email</label>
                      <input type="email" class="form-control" id="perfil-email" value="${usuario.email}" disabled>
                    </div>
                    <div class="mb-3">
                      <label for="perfil-telefone" class="form-label">Telefone</label>
                      <input type="tel" class="form-control" id="perfil-telefone" placeholder="(XX) XXXXX-XXXX">
                    </div>
                    <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                      <button type="submit" class="btn btn-primary">Salvar alterações</button>
                      <button type="button" class="btn btn-danger" onclick="logout()">Sair</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Configurar formulário de perfil
  const formPerfil = document.getElementById('form-perfil');
  if (formPerfil) {
    formPerfil.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Atualizar nome do usuário
      usuario.nome = document.getElementById('perfil-nome').value;
      
      // Feedback
      exibirToast('Perfil atualizado com sucesso!', 'success');
      
      // Atualizar interface
      atualizarInterfaceUsuario();
    });
  }
}

// --- FAVORITOS E AVALIAÇÕES ---

// Adicionar/remover estabelecimento dos favoritos
window.toggleFavorito = function(event, id) {
  event.stopPropagation(); // Evitar navegação para a página de detalhes
  
  if (!usuario) {
    loginModal.show();
    return;
  }
  
  const estabelecimento = dadosEstabelecimentos.find(e => e.id === id);
  if (!estabelecimento) return;
  
  // Verificar se já é favorito
  const index = estabelecimentosFavoritos.findIndex(e => e.id === id);
  
  if (index !== -1) {
    // Remover dos favoritos
    estabelecimentosFavoritos.splice(index, 1);
    exibirToast('Estabelecimento removido dos favoritos!', 'info');
  } else {
    // Adicionar aos favoritos
    estabelecimentosFavoritos.push(estabelecimento);
    exibirToast('Estabelecimento adicionado aos favoritos!', 'success');
  }
  
  // Atualizar interface (recarregar a página atual)
  const hash = window.location.hash;
  if (hash.startsWith('#detalhe-')) {
    renderizarDetalheEstabelecimento(id);
  } else if (hash === '#painel') {
    renderizarPainel();
  } else if (hash === '#mapa' || hash === '#busca') {
    renderizarListaEstabelecimentos(dadosEstabelecimentos);
  }
  
  // Na versão com Supabase, salvaríamos no banco de dados
  salvarFavoritos();
};

// Carregar favoritos do usuário
async function carregarFavoritos() {
  if (!usuario) return;
  
  try {
    // Na versão final isso seria carregado do Supabase
    // Por enquanto usamos localStorage como exemplo
    const favoritosString = localStorage.getItem(`favoritos_${usuario.id}`);
    if (favoritosString) {
      const favoritosIds = JSON.parse(favoritosString);
      estabelecimentosFavoritos = dadosEstabelecimentos.filter(e => favoritosIds.includes(e.id));
    }
  } catch (error) {
    console.error('Erro ao carregar favoritos:', error);
  }
}

// Salvar favoritos do usuário
function salvarFavoritos() {
  if (!usuario) return;
  
  try {
    // Na versão final isso seria salvo no Supabase
    // Por enquanto usamos localStorage como exemplo
    const favoritosIds = estabelecimentosFavoritos.map(e => e.id);
    localStorage.setItem(`favoritos_${usuario.id}`, JSON.stringify(favoritosIds));
  } catch (error) {
    console.error('Erro ao salvar favoritos:', error);
  }
}

// Atualizar interface após login/logout
function atualizarInterfaceUsuario() {
  // Atualizar botão de login
  const btnLoginTopo = document.getElementById('btn-login-topo');
  if (btnLoginTopo) {
    if (usuario) {
      btnLoginTopo.textContent = 'Meu Painel';
      btnLoginTopo.onclick = () => navegar('#painel');
    } else {
      btnLoginTopo.textContent = 'Entrar';
      btnLoginTopo.onclick = () => loginModal.show();
    }
  }
}

// Logout
function logout() {
  if (!usuario) return;
  
  // Logout do Supabase
  supabase.auth.signOut().catch(console.error);
  
  usuario = null;
  tipoPainel = null;
  estabelecimentosFavoritos = [];
  
  // Atualizar interface
  atualizarInterfaceUsuario();
  
  // Feedback
  exibirToast('Logout realizado com sucesso!', 'info');
  
  // Redirecionar para home
  navegar('#home');
}

// Renderizar formulário de cadastro de estabelecimentos
function renderizarCadastroEstabelecimento() {
  const app = document.getElementById('app');
  if (!app) return;
  
  app.innerHTML = `
    <div class="container py-4">
      <h2 class="mb-4">Cadastro de Estabelecimento</h2>
      
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <form id="form-cadastro-estabelecimento">
            <div class="row mb-3">
              <div class="col-md-6">
                <h4 class="h5 mb-3">Informações Básicas</h4>
                
                <div class="mb-3">
                  <label for="estab-nome" class="form-label">Nome do Estabelecimento *</label>
                  <input type="text" class="form-control" id="estab-nome" required>
                </div>
                
                <div class="mb-3">
                  <label for="estab-email" class="form-label">Email *</label>
                  <input type="email" class="form-control" id="estab-email" required>
                </div>
                
                <div class="mb-3">
                  <label for="estab-telefone" class="form-label">Telefone *</label>
                  <input type="tel" class="form-control" id="estab-telefone" 
                    placeholder="(00) 00000-0000" required>
                </div>
              </div>
              
              <div class="col-md-6">
                <h4 class="h5 mb-3">Endereço</h4>
                
                <div class="mb-3">
                  <label for="estab-endereco" class="form-label">Endereço *</label>
                  <input type="text" class="form-control" id="estab-endereco" required>
                </div>
                
                <div class="mb-3">
                  <label for="estab-cidade" class="form-label">Cidade *</label>
                  <input type="text" class="form-control" id="estab-cidade" required>
                </div>
              </div>
            </div>
            
            <div class="row mb-4">
              <div class="col-12">
                <h4 class="h5 mb-3">Serviços Oferecidos</h4>
                
                <div class="mb-3">
                  <div class="row">
                    <div class="col-md-4">
                      <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="servico-mecanica" name="servicos" value="Mecânica">
                        <label class="form-check-label" for="servico-mecanica">Mecânica</label>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="servico-borracharia" name="servicos" value="Borracharia">
                        <label class="form-check-label" for="servico-borracharia">Borracharia</label>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="servico-lavagem" name="servicos" value="Lavagem">
                        <label class="form-check-label" for="servico-lavagem">Lavagem</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
              <button type="button" class="btn btn-outline-secondary" onclick="navegar('#home')">Cancelar</button>
              <button type="submit" class="btn btn-primary">Cadastrar Estabelecimento</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // Configurar o formulário
  const formCadastro = document.getElementById('form-cadastro-estabelecimento');
  if (formCadastro) {
    formCadastro.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Capturar serviços selecionados
      const servicosSelecionados = [];
      document.querySelectorAll('input[name="servicos"]:checked').forEach(checkbox => {
        servicosSelecionados.push(checkbox.value);
      });
      
      if (servicosSelecionados.length === 0) {
        alert('Selecione pelo menos um serviço oferecido');
        return;
      }
      
      // Criar novo estabelecimento
      const novoEstabelecimento = {
        id: 'estab-' + Date.now(),
        nome: document.getElementById('estab-nome').value,
        email: document.getElementById('estab-email').value,
        telefone: document.getElementById('estab-telefone').value,
        endereco: document.getElementById('estab-endereco').value,
        descricao: "Estabelecimento recém cadastrado",
        servicos: servicosSelecionados,
        horarios: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        lat: -23.55052,
        lng: -46.633308,
        status: 'ativo',
        plano: 'básico',
        dataCadastro: new Date().toISOString().split('T')[0],
        imagem: 'https://source.unsplash.com/random/300x200/?shop',
        avaliacao: 0
      };
      
      // Em uma implementação real, enviaria para o Supabase
      // Aqui apenas adicionamos ao array local
      dadosEstabelecimentos.push(novoEstabelecimento);
      
      // Criar usuário associado ao estabelecimento
      usuario = {
        id: 'user-estab-' + Date.now(),
        nome: novoEstabelecimento.nome,
        email: novoEstabelecimento.email,
        estabelecimentoId: novoEstabelecimento.id,
        foto: 'images/user-default.png'
      };
      
      tipoPainel = 'estabelecimento';
      
      // Feedback
      exibirToast('Estabelecimento cadastrado com sucesso!', 'success');
      
      // Redirecionar para painel
      setTimeout(() => {
        navegar('#painel');
      }, 1500);
    });
  }
} 