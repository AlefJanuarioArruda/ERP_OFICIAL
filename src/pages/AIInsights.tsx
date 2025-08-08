import React, { useState } from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, MessageSquare, Send, Zap } from 'lucide-react';
import { AIInsightCard } from '../components/AIInsightCard';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { aiConsultant } from '../lib/gemini';

// Tipos para análises avançadas
interface SalesAnalysis {
  totalRevenue: number;
  salesCount: number;
  averageTicket: number;
  topProducts: Array<{ name: string; revenue: number; quantity: number }>;
  monthlyGrowth: number;
  weeklyTrend: 'up' | 'down' | 'stable';
  bestDay: string;
  worstDay: string;
}

interface FinancialAnalysis {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  cashFlow: number;
  pendingReceivables: number;
  pendingPayables: number;
  burnRate: number;
}

export const AIInsights: React.FC = () => {
  const { aiInsights, markInsightAsRead, products, sales, financialRecords, loading, customers } = useSupabaseData();
  const [chatMessages, setChatMessages] = useState([
    {
      id: '1',
      type: 'ai' as const,
      content: 'Oi! Sou o Carlos, seu consultor financeiro pessoal. 😊\n\nTenho 15 anos ajudando empreendedores como você a crescer seus negócios. Vou analisar seus dados reais aqui no sistema e dar conselhos práticos que realmente funcionam.\n\nEm que posso te ajudar hoje? Pode ser qualquer dúvida - desde "como está meu lucro?" até "como vender mais?". Estou aqui para isso!',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Formatação de moeda - movida para o topo para evitar erro de referência
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Análises avançadas dos dados
  const getSalesAnalysis = (): SalesAnalysis => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const salesCount = sales.length;
    const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0;
    
    // Produtos mais vendidos
    const productSales = new Map<string, { revenue: number; quantity: number }>();
    sales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          const existing = productSales.get(item.product_name) || { revenue: 0, quantity: 0 };
          productSales.set(item.product_name, {
            revenue: existing.revenue + item.total,
            quantity: existing.quantity + item.quantity
          });
        });
      }
    });
    
    const topProducts = Array.from(productSales.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
    
    // Análise temporal
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const lastMonthSales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= lastMonth && saleDate < currentMonth;
    });
    
    const currentMonthSales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= currentMonth;
    });
    
    const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => sum + sale.total, 0);
    const currentMonthRevenue = currentMonthSales.reduce((sum, sale) => sum + sale.total, 0);
    const monthlyGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    
    // Análise semanal
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekSales = sales.filter(sale => new Date(sale.created_at) >= lastWeek);
    const weeklyTrend = lastWeekSales.length > sales.length / 4 ? 'up' : 
                       lastWeekSales.length < sales.length / 6 ? 'down' : 'stable';
    
    // Melhor e pior dia
    const dailySales = new Map<string, number>();
    sales.forEach(sale => {
      const day = new Date(sale.created_at).toLocaleDateString();
      dailySales.set(day, (dailySales.get(day) || 0) + sale.total);
    });
    
    const sortedDays = Array.from(dailySales.entries()).sort((a, b) => b[1] - a[1]);
    const bestDay = sortedDays[0]?.[0] || 'N/A';
    const worstDay = sortedDays[sortedDays.length - 1]?.[0] || 'N/A';
    
    return {
      totalRevenue,
      salesCount,
      averageTicket,
      topProducts,
      monthlyGrowth,
      weeklyTrend,
      bestDay,
      worstDay
    };
  };
  
  const getFinancialAnalysis = (): FinancialAnalysis => {
    const totalIncome = financialRecords
      .filter(r => r.type === 'income' && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const totalExpenses = financialRecords
      .filter(r => r.type === 'expense' && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const profit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
    
    const pendingReceivables = financialRecords
      .filter(r => r.type === 'income' && r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const pendingPayables = financialRecords
      .filter(r => r.type === 'expense' && r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const cashFlow = pendingReceivables - pendingPayables;
    const burnRate = totalExpenses / Math.max(1, financialRecords.filter(r => r.type === 'expense').length);
    
    return {
      totalIncome,
      totalExpenses,
      profit,
      profitMargin,
      cashFlow,
      pendingReceivables,
      pendingPayables,
      burnRate
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: newMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsAnalyzing(true);

    try {
      // Preparar dados do negócio para o Gemini
      const businessData = {
        products,
        customers,
        sales,
        financialRecords
      };

      // Obter resposta do Gemini AI
      const conversationHistory = chatMessages.slice(-10).map(msg => ({
        type: msg.type,
        content: msg.content
      }));
      
      const aiResponseContent = await aiConsultant.getFinancialAdvice(newMessage, businessData, conversationHistory);
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: aiResponseContent,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Erro ao obter resposta da IA:', error);
      
      // Fallback para resposta local em caso de erro
      const fallbackResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: generateIntelligentAIResponse(newMessage),
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateIntelligentAIResponse = (message: string): string => {
    const lowercaseMessage = message.toLowerCase();
    const salesAnalysis = getSalesAnalysis();
    const financialAnalysis = getFinancialAnalysis();

    // Análise de vendas
    if (lowercaseMessage.includes('venda') || lowercaseMessage.includes('receita') || lowercaseMessage.includes('faturamento')) {
      if (salesAnalysis.salesCount === 0) {
        return `Ainda não identifiquei vendas registradas na su\a conta. Para começar a gerar insights valiosos, recomendo:

📊 **Primeiros Passos:**
• Registre suas primeiras vendas
• Configure seus clientes

Assim que tiver dados, poderei analisar seu desempenho e sugerir estratégias de crescimento!`;
      }
      
      const growthText = salesAnalysis.monthlyGrowth > 0 ? 
        `📈 **Crescimento de ${salesAnalysis.monthlyGrowth.toFixed(1)}%** comparado ao mês anterior - excelente!` :
        salesAnalysis.monthlyGrowth < 0 ?
        `📉 Queda de ${Math.abs(salesAnalysis.monthlyGrowth).toFixed(1)}% comparado ao mês anterior - vamos reverter isso!` :
        `📊 Vendas estáveis comparado ao mês anterior`;
      
      const trendEmoji = salesAnalysis.weeklyTrend === 'up' ? '🚀' : 
                        salesAnalysis.weeklyTrend === 'down' ? '⚠️' : '📊';
      
      return `${trendEmoji} **Análise das Suas Vendas:**

💰 **Faturamento Total:** ${formatCurrency(salesAnalysis.totalRevenue)}
🛒 **Vendas Realizadas:** ${salesAnalysis.salesCount} transações
🎯 **Ticket Médio:** ${formatCurrency(salesAnalysis.averageTicket)}
${growthText}

🏆 **Top 3 Produtos:**
${salesAnalysis.topProducts.map((product, index) => 
  `${index + 1}. ${product.name} - ${formatCurrency(product.revenue)} (${product.quantity} unidades)`
).join('\n')}

📅 **Melhor dia de vendas:** ${salesAnalysis.bestDay}

💡 **Recomendações:**
${salesAnalysis.averageTicket < 50 ? '• Foque em aumentar o ticket médio com produtos complementares' : '• Mantenha o excelente ticket médio!'}
${salesAnalysis.topProducts.length > 0 ? `• Invista mais no produto "${salesAnalysis.topProducts[0].name}" que está performando bem` : ''}
${salesAnalysis.weeklyTrend === 'down' ? '• Considere uma campanha promocional para reverter a tendência' : ''}`;
    }
    
    // Análise financeira
    if (lowercaseMessage.includes('financeiro') || lowercaseMessage.includes('lucro') || lowercaseMessage.includes('despesa') || lowercaseMessage.includes('fluxo')) {
      const profitStatus = financialAnalysis.profit > 0 ? '💚 **Lucrativo**' : 
                          financialAnalysis.profit < 0 ? '🔴 **Prejuízo**' : '⚪ **Ponto de Equilíbrio**';
      
      const marginStatus = financialAnalysis.profitMargin > 20 ? '🎯 Margem excelente!' :
                          financialAnalysis.profitMargin > 10 ? '👍 Margem boa!' :
                          financialAnalysis.profitMargin > 0 ? '⚠️ Margem baixa - pode melhorar' :
                          '🚨 Margem negativa - ação urgente necessária';
      
      return `💼 **Análise Financeira Completa:**

${profitStatus}
💰 **Receitas:** ${formatCurrency(financialAnalysis.totalIncome)}
💸 **Despesas:** ${formatCurrency(financialAnalysis.totalExpenses)}
📊 **Lucro Líquido:** ${formatCurrency(financialAnalysis.profit)}
📈 **Margem de Lucro:** ${financialAnalysis.profitMargin.toFixed(1)}% - ${marginStatus}

💧 **Fluxo de Caixa:**
• A receber: ${formatCurrency(financialAnalysis.pendingReceivables)}
• A pagar: ${formatCurrency(financialAnalysis.pendingPayables)}
• Saldo projetado: ${formatCurrency(financialAnalysis.cashFlow)}

🎯 **Recomendações Estratégicas:**
${financialAnalysis.profit < 0 ? '• URGENTE: Revise custos e aumente preços/vendas' : ''}
${financialAnalysis.profitMargin < 15 ? '• Analise produtos com maior margem e foque neles' : ''}
${financialAnalysis.pendingReceivables > financialAnalysis.totalIncome * 0.3 ? '• Melhore a cobrança - muito dinheiro parado' : ''}
${financialAnalysis.cashFlow < 0 ? '• Atenção ao fluxo de caixa - negocie prazos' : '• Fluxo de caixa saudável!'}`;
    }
    
    // Comparações e tendências
    if (lowercaseMessage.includes('comparar') || lowercaseMessage.includes('tendência') || lowercaseMessage.includes('crescimento')) {
      return `📊 **Análise de Tendências e Comparações:**

📈 **Performance Mensal:**
• Crescimento: ${salesAnalysis.monthlyGrowth > 0 ? '+' : ''}${salesAnalysis.monthlyGrowth.toFixed(1)}%
• Tendência semanal: ${salesAnalysis.weeklyTrend === 'up' ? 'Em alta 🚀' : 
                     salesAnalysis.weeklyTrend === 'down' ? 'Em queda ⚠️' : 'Estável 📊'}

🎯 **Benchmarks do Seu Negócio:**
• Ticket médio: ${formatCurrency(salesAnalysis.averageTicket)}
• Margem de lucro: ${financialAnalysis.profitMargin.toFixed(1)}%
• Taxa de conversão de produtos: ${salesAnalysis.topProducts.length > 0 ? 'Boa diversificação' : 'Concentre em produtos principais'}

💡 **Insights Estratégicos:**
${salesAnalysis.monthlyGrowth > 10 ? '• Excelente crescimento! Considere expandir operação' : ''}
${salesAnalysis.monthlyGrowth < -5 ? '• Queda preocupante - revise estratégia urgentemente' : ''}
${financialAnalysis.profitMargin > 25 ? '• Margem excepcional - você está no caminho certo!' : ''}
${salesAnalysis.averageTicket < 30 ? '• Foque em aumentar ticket médio com upselling' : ''}`;
    }
    
    // Produtos e estoque
    if (lowercaseMessage.includes('produto') || lowercaseMessage.includes('estoque') || lowercaseMessage.includes('inventário')) {
      const lowStockProducts = products.filter(p => p.stock <= p.min_stock);
      const topSellingProducts = salesAnalysis.topProducts;
      
      return `📦 **Análise de Produtos e Estoque:**

📊 **Visão Geral:**
• Total de produtos: ${products.length}
• Produtos com estoque baixo: ${lowStockProducts.length}
• Produtos mais vendidos: ${topSellingProducts.length}

${lowStockProducts.length > 0 ? `🚨 **Alertas de Estoque:**
${lowStockProducts.slice(0, 3).map(p => `• ${p.name}: ${p.stock} unidades (mín: ${p.min_stock})`).join('\n')}` : '✅ **Estoque sob controle!**'}

${topSellingProducts.length > 0 ? `🏆 **Produtos Campeões de Venda:**
${topSellingProducts.map((p, i) => `${i + 1}. ${p.name} - ${formatCurrency(p.revenue)}`).join('\n')}` : ''}

💡 **Recomendações:**
${lowStockProducts.length > 0 ? '• Reabasteça produtos em falta para não perder vendas' : ''}
${topSellingProducts.length > 0 ? `• Invista mais no produto "${topSellingProducts[0].name}" que está vendendo bem` : ''}
• Analise produtos parados e considere promoções
• Mantenha foco nos produtos com maior margem`;
    }
    
    // Metas e objetivos
    if (lowercaseMessage.includes('meta') || lowercaseMessage.includes('objetivo') || lowercaseMessage.includes('plano')) {
      const monthlyTarget = salesAnalysis.totalRevenue * 1.2; // Meta de 20% de crescimento
      const dailyTarget = monthlyTarget / 30;
      
      return `🎯 **Planejamento de Metas Baseado nos Seus Dados:**

📈 **Metas Sugeridas para o Próximo Mês:**
• Faturamento: ${formatCurrency(monthlyTarget)} (+20%)
• Meta diária: ${formatCurrency(dailyTarget)}
• Ticket médio: ${formatCurrency(salesAnalysis.averageTicket * 1.1)} (+10%)

🚀 **Plano de Ação:**
1. **Semana 1-2:** Foque nos produtos top performers
2. **Semana 3:** Lance promoção para produtos parados
3. **Semana 4:** Trabalhe upselling para aumentar ticket médio

📊 **KPIs para Acompanhar:**
• Vendas diárias vs meta
• Ticket médio semanal
• Margem de lucro por produto
• Taxa de conversão de clientes

💡 **Dica Estratégica:**
${salesAnalysis.monthlyGrowth > 0 ? 'Você já está crescendo! Mantenha o ritmo e otimize processos' : 'Foque em recuperar o crescimento com ações direcionadas'}`;
    }
    
    // Clientes
    if (lowercaseMessage.includes('cliente') || lowercaseMessage.includes('customer')) {
      const totalCustomers = sales.reduce((acc, sale) => {
        if (sale.customer_id && !acc.includes(sale.customer_id)) {
          acc.push(sale.customer_id);
        }
        return acc;
      }, [] as string[]).length;
      
      return `👥 **Análise de Clientes:**

📊 **Visão Geral:**
• Total de clientes únicos: ${totalCustomers}
• Ticket médio por cliente: ${formatCurrency(salesAnalysis.averageTicket)}
• Vendas diretas (sem cliente): ${sales.filter(s => !s.customer_id).length}

💡 **Recomendações para Clientes:**
• ${totalCustomers < 10 ? 'Foque em captar mais clientes com campanhas' : 'Base de clientes sólida!'}
• Implemente programa de fidelidade para clientes recorrentes
• Analise clientes que mais compram e replique o perfil
• ${sales.filter(s => !s.customer_id).length > sales.length * 0.3 ? 'Cadastre mais clientes para melhor controle' : ''}

🎯 **Próximos Passos:**
1. Identifique seus top 3 clientes
2. Entenda o que eles mais compram
3. Busque clientes similares no mercado
4. Crie ofertas personalizadas`;
    }
    

    // Resposta padrão inteligente
    return `🤖 **Entendi sua pergunta!** 

Como seu consultor financeiro com IA, posso ajudar você com análises detalhadas sobre:

📊 **Vendas & Faturamento:** "Como foram minhas vendas?" ou "Analise meu faturamento"
💰 **Finanças:** "Como está minha situação financeira?" ou "Analise meu lucro"
📦 **Produtos:** "Quais produtos vendem mais?" ou "Como está meu estoque?"
👥 **Clientes:** "Analise meus clientes" ou "Como fidelizar clientes?"
🎯 **Metas:** "Defina metas para mim" ou "Como crescer 20%?"
📈 **Tendências:** "Qual a tendência das vendas?" ou "Compare este mês"

💡 **Dica:** Seja específico! Quanto mais detalhes você der, mais precisa será minha análise dos seus dados reais.

O que gostaria de analisar primeiro?`;
  };

  const getPredictiveInsights = () => {
    const salesAnalysis = getSalesAnalysis();
    const financialAnalysis = getFinancialAnalysis();
    const nextMonthPrediction = salesAnalysis.totalRevenue * (1 + Math.max(salesAnalysis.monthlyGrowth, 5) / 100);
    
    return {
      salesPrediction: nextMonthPrediction,
      growthRate: Math.max(salesAnalysis.monthlyGrowth, 5),
      recommendations: salesAnalysis.salesCount > 0 ? [
        `Investir no produto "${salesAnalysis.topProducts[0]?.name || 'top performer'}" que está vendendo bem`,
        `Trabalhar para aumentar ticket médio de ${formatCurrency(salesAnalysis.averageTicket)} para ${formatCurrency(salesAnalysis.averageTicket * 1.15)}`,
        financialAnalysis.profitMargin < 15 ? 'Revisar custos para melhorar margem de lucro' : 'Manter foco na rentabilidade',
        salesAnalysis.weeklyTrend === 'down' ? 'Implementar campanha para reverter tendência de queda' : 'Manter estratégias que estão funcionando'
      ] : [
        'Registrar suas primeiras vendas para gerar insights personalizados'
      ]
    };
  };

  const predictiveData = getPredictiveInsights();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-gray-600">Carregando insights inteligentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-blue-600" />
            Consultor Financeiro IA
          </h1>
          <p className="text-gray-600">Análises avançadas e recomendações estratégicas baseadas nos seus dados reais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Predictive Analytics */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Análise Preditiva Inteligente</h3>
                <p className="text-sm text-gray-600">Projeções baseadas nos seus dados reais e tendências de mercado</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Projeção Próximo Mês</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(predictiveData.salesPrediction)}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Crescimento Projetado</p>
                <p className="text-2xl font-bold text-blue-600">+{predictiveData.growthRate.toFixed(1)}%</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Recomendações Estratégicas</h4>
              <ul className="space-y-2">
                {predictiveData.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-700">
                    <Zap className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Current Insights */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas e Insights Automáticos</h3>
            <div className="space-y-4">
              {aiInsights.filter(insight => !insight.is_read).length > 0 ? (
                aiInsights
                  .filter(insight => !insight.is_read)
                  .map((insight) => (
                    <AIInsightCard
                      key={insight.id}
                      insight={{
                        id: insight.id,
                        type: insight.type,
                        title: insight.title,
                        description: insight.description,
                        priority: insight.priority,
                        category: insight.category,
                        data: insight.data,
                        createdAt: new Date(insight.created_at),
                        isRead: insight.is_read
                      }}
                      onMarkAsRead={markInsightAsRead}
                    />
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Todos os insights foram revisados</p>
                  <p className="text-sm">Continue operando para gerar novos alertas e recomendações</p>
                </div>
              )}
            </div>
          </div>

          {/* Historical Insights */}
          {aiInsights.filter(insight => insight.is_read).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Insights</h3>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {aiInsights
                  .filter(insight => insight.is_read)
                  .map((insight) => (
                    <AIInsightCard
                      key={insight.id}
                      insight={{
                        id: insight.id,
                        type: insight.type,
                        title: insight.title,
                        description: insight.description,
                        priority: insight.priority,
                        category: insight.category,
                        data: insight.data,
                        createdAt: new Date(insight.created_at),
                        isRead: insight.is_read
                      }}
                      onMarkAsRead={markInsightAsRead}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Consultor IA Conversacional */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Carlos - Consultor Financeiro</h3>
                <p className="text-sm text-gray-600">15 anos de experiência • Especialista em PMEs</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm whitespace-pre-line">{message.content}</div>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isAnalyzing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">Analisando dados e gerando insights...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ex: Como foram minhas vendas este mês?"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isAnalyzing}
              />
              <button
                onClick={handleSendMessage}
                disabled={isAnalyzing || !newMessage.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Exemplos: "Como está meu lucro?", "Minhas vendas caíram, o que fazer?", "Como crescer 30% este ano?"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};