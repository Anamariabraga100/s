import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import sharp from 'sharp';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import auth from './middleware/auth.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: '*', // ou https://rafaelabuggati.site
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Inicialização do cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Endpoint para settings fixos (perfil do usuário)
app.get('/api/settings', (req, res) => {
  res.json({
    nome: 'Kelly Matosa',
    capa: 'https://rafaelabuggati.site/images/capa.jpg',
    avatar: 'https://rafaelabuggati.site/images/avatar.jpg',
    descricao: 'Olá! Seja bem-vindo(a) ao meu perfil exclusivo.\nConteúdos novos toda semana 😘',
    visto: 'há 10 minutos',
    destaque: '🔥 Conteúdo exclusivo só para assinantes! Aproveite o desconto por tempo limitado! 🔥',
    destaque_btn: 'Mais informações'
  });
});

// Exemplo de endpoint puxando dados do Supabase (feed)
app.get('/api/feed', async (req, res) => {
  const { data, error } = await supabase.from('feed').select('*').order('data', { ascending: false });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Início do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

const express = require('express');
const cors = require('cors'); // IMPORTAR PRIMEIRO
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const sharp = require('sharp');
const axios = require('axios');
const auth = require('./middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();

app.use(cors({
  origin: '*', // ou 'https://rafaelabuggati.site'
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Load environment variables

// Inicialização do cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Servir arquivos estáticos da raiz do projeto

// Configuração do multer para fotoperfil
const storagePerfil = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'fotoperfil/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const uploadPerfil = multer({ storage: storagePerfil });

// Configuração do multer para fotocapa
const storageCapa = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'fotocapa/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const uploadCapa = multer({ storage: storageCapa });

// Configuração do multer para fav
const storageFav = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'fav/'),
  filename: (req, file, cb) => cb(null, Date.now() + '.png')
});
const uploadFav = multer({ storage: storageFav });

// Configuração do multer para o feed
const storageFeed = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, 'fotosfeed/');
    else if (file.mimetype.startsWith('video/')) cb(null, 'videosfeed/');
    else cb(new Error('Tipo de arquivo não suportado'));
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadFeed = multer({ storage: storageFeed });

// Rotas de autenticação
const authMiddleware = require('./middleware/auth');
app.use(authMiddleware);


// Rotas protegidas
app.use('/api/protected/*', authMiddleware);

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'checkout', 'checkout.html'));
});

// API Routes
app.post('/api/pix/create', async (req, res) => {
    try {
        const { amount, description } = req.body;
        const pixData = await createPixPayment(amount, description);
        res.json(pixData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Settings API
app.get('/api/settings', async (req, res) => {
    try {
        const data = await fs.readFile('db.json', 'utf8');
        const settings = JSON.parse(data).settings;
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const newSettings = req.body;
        const data = await fs.readFile('db.json', 'utf8');
        const db = JSON.parse(data);
        // Atualiza os campos no nível raiz
        Object.keys(newSettings).forEach(key => {
            if (newSettings[key] !== "" && newSettings[key] !== null && newSettings[key] !== undefined) {
                db[key] = newSettings[key];
            }
        });
        db.lastUpdated = new Date().toISOString();
        await fs.writeFile('db.json', JSON.stringify(db, null, 2));
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para upload de foto de perfil
app.post('/api/upload/perfil', uploadPerfil.single('file'), (req, res) => {
  res.json({ path: '/fotoperfil/' + req.file.filename });
});

// Endpoint para upload de foto de capa
app.post('/api/upload/capa', uploadCapa.single('file'), (req, res) => {
  res.json({ path: '/fotocapa/' + req.file.filename });
});

// Endpoint para upload de favicon (redimensiona para 16x16)
app.post('/api/upload/fav', uploadFav.single('file'), async (req, res) => {
  const inputPath = req.file.path;
  const outputPath = inputPath.replace(/(\\|\/)([^\\/]+)$/, '$1processed_$2'); // adiciona 'processed_' ao nome do arquivo

  await sharp(inputPath)
    .resize(16, 16)
    .png()
    .toFile(outputPath);

  // Remover o arquivo original e renomear o processado para o nome original
  await fs.unlink(inputPath);
  await fs.rename(outputPath, inputPath);

  res.json({ path: '/fav/' + req.file.filename });
});

// Servir as pastas de imagens
app.use('/fotoperfil', express.static('fotoperfil'));
app.use('/fotocapa', express.static('fotocapa'));

// Servir a pasta fav
app.use('/fav', express.static('fav'));

// Servir as pastas de mídia do feed
app.use('/fotosfeed', express.static('fotosfeed'));
app.use('/videosfeed', express.static('videosfeed'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Endpoint para criar checkout PIX na Bestfy (modo simulado)
app.post('/api/pix/bestfy', async (req, res) => {
    try {
        // Lê configurações do painel
        const data = await fs.readFile('db.json', 'utf8');
        const settings = JSON.parse(data).settings;
        const { plano } = req.body;
        let valor = 0;
        if (plano === 'mensal') valor = settings.monthlyPrice;
        else if (plano === '3m') valor = settings.price3;
        else if (plano === '6m') valor = settings.price6;
        else if (plano === '12m') valor = settings.price12;
        else return res.status(400).json({ error: 'Plano inválido' });
        // Modo simulado: retorna uma URL fake
        return res.json({ checkout_url: `https://pix.simulado/qr?plano=${plano}&valor=${valor}` });
        // --- Para produção, descomente abaixo ---
        /*
        const body = {
            amount: Math.round(valor * 100),
            payment_methods: ['pix'],
            metadata: { plano },
            postback_url: 'https://SEU_DOMINIO/webhook-bestfy'
        };
        const response = await axios.post('https://api.bestfybr.com.br/v1/checkouts', body, {
            headers: {
                'Authorization': `Bearer ${settings.bestfyKey}`,
                'Content-Type': 'application/json'
            }
        });
        res.json({ checkout_url: response.data.checkout_url });
        */
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET feed da Supabase
app.get('/api/feed', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('feed')
            .select('*')
            .order('data', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST (adicionar novo post) no feed da Supabase
app.post('/api/feed', uploadFeed.fields([
  { name: 'foto', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { texto, qtdComentariosIA, personaComentariosIA, comentarioAdultoIA } = req.body;
    const foto = req.files['foto'] ? '/fotosfeed/' + req.files['foto'][0].filename : null;
    const video = req.files['video'] ? '/videosfeed/' + req.files['video'][0].filename : null;
    const tipo = video ? (texto ? 'video+texto' : 'video') : (foto ? (texto ? 'foto+texto' : 'foto') : 'texto');
    const targetreactions = {
      '❤️': randomInRange(100, 120),
      '😍': randomInRange(60, 80),
      '👍': randomInRange(40, 60)
    };
    const post = {
      id: uuidv4(),
      tipo,
      texto: texto || null,
      foto,
      video,
      data: new Date().toISOString(),
      targetreactions,
      reactions: { '❤️': 0, '😍': 0, '👍': 0 },
      comentarios: []
    };

    // Insere o post na Supabase
    const { error } = await supabase
      .from('feed')
      .insert([post]);
    if (error) throw error;

    // (Opcional: gerar comentários IA e atualizar o post na Supabase, se necessário)

    res.json({ message: 'Post publicado com sucesso!' });
  } catch (error) {
    console.error('Erro ao adicionar post:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE post do feed na Supabase
app.delete('/api/feed/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('feed')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Salvar mensagem do usuário (chat)
app.post('/api/chat', async (req, res) => {
    try {
        const { user, message, from } = req.body;
        if (!user || !message) return res.status(400).json({ error: 'Usuário e mensagem são obrigatórios.' });
        const { error } = await supabase
            .from('chats')
            .insert([{
                id: uuidv4(),
                user_id: user,
                admin_id: from === 'admin' ? user : null,
                message: message,
                role: from === 'admin' ? 'assistant' : 'user'
            }]);
        if (error) throw error;
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Listar todos os chats (última mensagem por usuário)
app.get('/api/chat/list', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        // Agrupar por user_id e pegar a última mensagem
        const chatMap = {};
        data.forEach(msg => {
            if (!chatMap[msg.user_id] || new Date(msg.created_at) > new Date(chatMap[msg.user_id].created_at)) {
                chatMap[msg.user_id] = msg;
            }
        });
        const chatList = Object.values(chatMap).map(msg => ({
            user: msg.user_id,
            lastMessage: msg.created_at,
            message: msg.message
        }));
        // Ordenar por última mensagem (mais recente primeiro)
        chatList.sort((a, b) => new Date(b.lastMessage) - new Date(a.lastMessage));
        res.json(chatList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Buscar histórico de chat de um usuário
app.get('/api/chat/:user', async (req, res) => {
    try {
        const user = req.params.user;
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', user)
            .order('created_at', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para chat com IA (OpenAI)
app.post('/api/chat/ia', async (req, res) => {
    try {
        const { user, message } = req.body;
        if (!user || !message) return res.status(400).json({ error: 'Usuário e mensagem são obrigatórios.' });
        const data = await fs.readFile('db.json', 'utf8');
        const db = JSON.parse(data);
        const openaiKey = db.settings && db.settings.openaiKey;
        // Usa a persona do chat (mulher/modelo)
        const aiPersonaChat = db.settings && db.settings.aiPersonaChat;
        if (!openaiKey || !aiPersonaChat) return res.status(400).json({ error: 'Configuração da IA não encontrada.' });

        // Monta prompt para OpenAI
        const messages = [
            { role: 'system', content: aiPersonaChat },
            { role: 'user', content: message }
        ];
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages,
            max_tokens: 200,
            temperature: 0.8
        }, {
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json'
            }
        });
        const reply = response.data.choices[0].message.content.trim();
        res.json({ reply });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para criar novo usuário usando Supabase
app.post('/api/create-user', async (req, res) => {
    try {
        const { email, login, senha, plano } = req.body;
        if (!email || !login || !senha || !plano) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }
        // Verifica se já existe usuário
        const { data: existing, error: findError } = await supabase
            .from('users')
            .select('id')
            .or(`email.eq.${email},login.eq.${login}`);
        if (existing && existing.length > 0) {
            return res.status(400).json({ error: 'Usuário já existe.' });
        }
        // Cria usuário
        const { data, error } = await supabase
            .from('users')
            .insert([{ email, login, senha, plano }]);
        if (error) throw error;
        res.json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para listar todos os usuários cadastrados
app.get('/api/list-users', async (req, res) => {
    try {
        const data = await fs.readFile('db.json', 'utf8');
        const db = JSON.parse(data);
        res.json(db.users || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para editar usuário pelo e-mail
app.post('/api/edit-user/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const { email: novoEmail, login, senha, plano, status } = req.body;
        const data = await fs.readFile('db.json', 'utf8');
        const db = JSON.parse(data);
        if (!db.users) db.users = [];
        const idx = db.users.findIndex(u => u.email === email);
        if (idx === -1) return res.status(404).json({ error: 'Usuário não encontrado.' });
        db.users[idx] = {
            ...db.users[idx],
            email: novoEmail,
            login,
            senha,
            plano,
            status: status || 'ativo'
        };
        await fs.writeFile('db.json', JSON.stringify(db, null, 2));
        res.json({ message: 'Usuário atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint de login por e-mail e senha usando Supabase
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('senha', senha);
    if (!users || users.length === 0) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
    const user = users[0];
    const sessionToken = Math.random().toString(36).substring(2);
    res.json({
        user: {
            email: user.email,
            login: user.login,
            senha: user.senha,
            plano: user.plano,
            status: user.status || 'ativo',
            criadoEm: user.criadoEm
        },
        sessionToken: sessionToken
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
