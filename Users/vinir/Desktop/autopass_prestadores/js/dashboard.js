import { supabase } from './supabase.js';

const user = (await supabase.auth.getUser()).data.user;
if (!user) window.location.href = 'login.html';

const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('prestador_id', user.id);

if (error) {
    document.getElementById('agendamentos').innerText = 'Erro ao carregar agendamentos.';
} else {
    const container = document.getElementById('agendamentos');
    data.forEach(ap => {
        const div = document.createElement('div');
        div.innerHTML = `<p>Cliente: ${ap.cliente_nome}</p><p>Status: ${ap.status}</p>`;
        container.appendChild(div);
    });
}
