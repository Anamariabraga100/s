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
