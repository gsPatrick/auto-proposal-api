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
    // 1. Tenta buscar nas variáveis de ambiente do servidor (.env)
    const envKeyMap = {
      'openai': 'OPENAI_API_KEY',
      'claude': 'ANTHROPIC_API_KEY',
      'gemini': 'GEMINI_API_KEY',
      'groq': 'GROQ_API_KEY'
    };
    
    const envKey = process.env[envKeyMap[provider]];
    if (envKey) return envKey;

    // 2. Fallback: Busca na tabela de settings do banco de dados
    const setting = await Setting.findByPk(`${provider}_keys`);
    if (setting && setting.value && setting.value.length > 0) {
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
    const where = this._getDateFilter(range);
    
    const metrics = await ProposalLog.findAll({
      where,
      attributes: [
        [fn('SUM', col('cost')), 'totalCost'],
        [fn('COUNT', col('id')), 'totalProposals'],
        [fn('SUM', col('tokensInput')), 'totalTokensInput'],
        [fn('SUM', col('tokensOutput')), 'totalTokensOutput'],
      ],
      raw: true
    });

    const chartData = await ProposalLog.findAll({
      where,
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('SUM', col('cost')), 'cost'],
      ],
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true
    });

    const totalCost = parseFloat(metrics[0].totalCost || 0);
    const totalProposals = parseInt(metrics[0].totalProposals || 0);
    const totalTokensInput = parseInt(metrics[0].totalTokensInput || 0);
    const totalTokensOutput = parseInt(metrics[0].totalTokensOutput || 0);

    return {
      totalCost,
      totalProposals,
      totalTokens: totalTokensInput + totalTokensOutput,
      avgCostPerProposal: totalProposals > 0 ? (totalCost / totalProposals) : 0,
      chartData: chartData.map(d => ({
        name: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        total: parseFloat(d.cost || 0)
      }))
    };
  }

  _getDateFilter(range) {
    const { Op } = require('sequelize');
    const date = new Date();
    if (range === 'week') date.setDate(date.getDate() - 7);
    else if (range === 'month') date.setMonth(date.getMonth() - 1);
    else return {};
    return { createdAt: { [Op.gte]: date } };
  }
}

module.exports = new ProposalService();
