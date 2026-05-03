const axios = require('axios');
const ProposalLog = require('../../models/ProposalLog');
const Setting = require('../../models/Setting');

// Preços por 1M tokens (Maio 2026)
const PRICES = {
  'gpt-4o-mini': { in: 0.15, out: 0.60 },
  'gpt-4o': { in: 2.50, out: 10.00 },
  'gpt-5.5': { in: 5.00, out: 30.00 },
  'gpt-5.5-pro': { in: 30.00, out: 180.00 },
  'claude-haiku-4-5': { in: 1.00, out: 5.00 },
  'claude-sonnet-4-6': { in: 3.00, out: 15.00 },
  'claude-opus-4-7': { in: 5.00, out: 25.00 }
};

class ProposalService {
  
  async generateProposal(data) {
    const { 
      provider, model, platform, 
      systemInstruction, userPrompt, proposalData 
    } = data;

    // Busca chaves no banco de dados se não vierem na request
    let apiKey = await this._getApiKey(provider);
    
    let result;
    if (provider === 'openai') {
      result = await this._callOpenAI(apiKey, model, systemInstruction, userPrompt);
    } else if (provider === 'claude') {
      result = await this._callClaude(apiKey, model, systemInstruction, userPrompt);
    } else {
      throw new Error(`Provider ${provider} não suportado via API centralizada ainda.`);
    }

    // Calcula custo
    const cost = this._calculateCost(model, result.usage);

    // Salva no Banco de Dados
    const log = await ProposalLog.create({
      provider,
      model,
      platform,
      proposalData,
      aiResponse: result.data,
      tokensInput: result.usage.input,
      tokensOutput: result.usage.output,
      cost
    });

    // LOG EM UMA LINHA NO TERMINAL
    const timestamp = new Date().toLocaleString('pt-BR');
    console.log(`[${timestamp}] 🚀 ${provider.toUpperCase()} (${model}) | Custo: $${cost.toFixed(4)} | Tokens: IN:${result.usage.input} OUT:${result.usage.output} | Plataforma: ${platform}`);

    return {
      success: true,
      data: result.data,
      logId: log.id,
      cost
    };
  }

  async _getApiKey(provider) {
    const setting = await Setting.findByPk(`${provider}_keys`);
    if (setting && setting.value && setting.value.length > 0) {
      // Retorna a primeira chave (ou implementa rotação aqui)
      return setting.value[0];
    }
    return null;
  }

  _calculateCost(model, usage) {
    const price = PRICES[model];
    if (!price) return 0;
    const inputCost = (usage.input / 1000000) * price.in;
    const outputCost = (usage.output / 1000000) * price.out;
    return inputCost + outputCost;
  }

  async _callOpenAI(key, model, system, prompt) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      response_format: { type: "json_object" }
    }, {
      headers: { 'Authorization': `Bearer ${key}` }
    });

    const choice = response.data.choices[0].message.content;
    return {
      data: JSON.parse(choice),
      usage: {
        input: response.data.usage.prompt_tokens,
        output: response.data.usage.completion_tokens
      }
    };
  }

  async _callClaude(key, model, system, prompt) {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });

    return {
      data: JSON.parse(response.data.content[0].text),
      usage: {
        input: response.data.usage.input_tokens,
        output: response.data.usage.output_tokens
      }
    };
  }

  async getMetrics() {
    const { Op, fn, col } = require('sequelize');
    const now = new Date();

    // 1. Gasto Total (All Time)
    const totalSpend = await ProposalLog.sum('cost') || 0;
    const totalCount = await ProposalLog.count();

    // 2. Gasto por Provedor
    const spendByProvider = await ProposalLog.findAll({
      attributes: [
        'provider',
        [fn('SUM', col('cost')), 'totalCost'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['provider']
    });

    // 3. Gasto Diário (Últimos 30 dias)
    const dailySpend = await ProposalLog.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('SUM', col('cost')), 'totalCost']
      ],
      where: {
        createdAt: { [Op.gte]: new Date(now.setDate(now.getDate() - 30)) }
      },
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'DESC']]
    });

    // 4. Gasto Mensal
    const monthlySpend = await ProposalLog.findAll({
      attributes: [
        [fn('DATE_TRUNC', 'month', col('createdAt')), 'month'],
        [fn('SUM', col('cost')), 'totalCost']
      ],
      group: [fn('DATE_TRUNC', 'month', col('createdAt'))],
      order: [[fn('DATE_TRUNC', 'month', col('createdAt')), 'DESC']]
    });

    return {
      summary: {
        totalSpend: parseFloat(totalSpend).toFixed(4),
        totalCount
      },
      byProvider: spendByProvider,
      daily: dailySpend,
      monthly: monthlySpend
    };
  }
}

module.exports = new ProposalService();
