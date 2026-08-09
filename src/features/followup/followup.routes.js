const express = require('express');
const router = express.Router();
const FollowUpLog = require('../../models/FollowUpLog');

// POST /followup/log - registra um follow-up enviado.
// A extensao chama isto em best-effort e ignora a resposta: um erro aqui nao pode
// virar problema no fluxo de envio, entao respondemos rapido e nunca lancamos 5xx
// por dado faltando - so registramos o que der.
router.post('/log', async (req, res) => {
  try {
    const { conversationId, trilha, tentativa, projeto, cliente, texto, mensagem, platform, userId, userName } = req.body || {};
    if (!conversationId || !trilha || !tentativa) {
      return res.status(400).json({ success: false, error: 'conversationId, trilha e tentativa sao obrigatorios' });
    }
    const log = await FollowUpLog.create({
      conversationId: String(conversationId),
      platform: platform || '99freelas',
      trilha,
      tentativa: parseInt(tentativa, 10) || 0,
      projeto: projeto || null,
      cliente: cliente || null,
      mensagem: mensagem || texto || '',
      userId: userId || null,
      userName: userName || null
    });
    res.json({ success: true, id: log.id });
  } catch (e) {
    console.error('[followup/log]', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /followup/logs?conversationId=&limit= - historico para o dashboard.
router.get('/logs', async (req, res) => {
  try {
    const where = {};
    if (req.query.conversationId) where.conversationId = String(req.query.conversationId);
    const logs = await FollowUpLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Math.min(parseInt(req.query.limit, 10) || 100, 500)
    });
    res.json({ success: true, total: logs.length, logs });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
