// middleware/auth.js

// Middleware de autenticação (libera tudo, pronto para usar Supabase futuramente)
module.exports = (req, res, next) => {
  // Aqui você pode adicionar autenticação com Supabase se quiser
  next();
};