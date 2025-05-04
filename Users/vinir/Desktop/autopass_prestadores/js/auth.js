import { supabase } from './supabase.js';

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        document.getElementById('login-error').textContent = 'Erro ao fazer login: ' + error.message;
    } else {
        window.location.href = 'dashboard.html';
    }
});