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
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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

app.get('/api/feed', async (req, res) => {
  const { data, error } = await supabase.from('feed').select('*').order('data', { ascending: false });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Criar usuário
app.post('/api/create-user', async (req, res) => {
  try {
    const { email, login, senha, plano } = req.body;
    const { data, error } = await supabase.from('users').insert([{ email, login, senha, plano }]);
    if (error) throw error;
    res.json({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar usuários
app.get('/api/list-users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Editar usuário por e-mail
app.post('/api/edit-user/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const { email: novoEmail, login, senha, plano, status } = req.body;
    const { error } = await supabase.from('users')
      .update({ email: novoEmail, login, senha, plano, status })
      .eq('email', email);
    if (error) throw error;
    res.json({ message: 'Usuário atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar settings via Supabase (se houver tabela 'settings')
app.post('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    const { error } = await supabase.from('settings').upsert([settings], { onConflict: 'id' });
    if (error) throw error;
    res.json({ message: 'Configurações atualizadas com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
