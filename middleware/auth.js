const db = require('../database');

const authMiddleware = async (req, res, next) => {
    const sessionToken = req.headers['x-session-token'];
    
    if (!sessionToken) {
        return res.status(401).json({ error: 'Sessão não encontrada' });
    }

    try {
        // Busca a sessão no banco
        const session = await db.get(
            'SELECT s.*, u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = ?',
            [sessionToken]
        );

        if (!session) {
            return res.status(401).json({ error: 'Sessão inválida' });
        }

        // Atualiza última atividade
        await db.run(
            'UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_token = ?',
            [sessionToken]
        );

        // Adiciona usuário ao request
        req.user = {
            id: session.user_id,
            email: session.email,
            login: session.login,
            senha: session.senha,
            plano: session.plano,
            ativo: session.ativo
        };

        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

module.exports = authMiddleware; 