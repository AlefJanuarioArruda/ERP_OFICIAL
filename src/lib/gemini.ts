import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyCVbWggl2Auw6sL3wmhnnAQuT-jDhfi-3g';
const genAI = new GoogleGenerativeAI(API_KEY);

export class AIConsultant {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2000,
      }
    });
  }

  async getFinancialAdvice(
    userMessage: string, 
    businessData: {
      products: any[];
      customers: any[];
      sales: any[];
      financialRecords: any[];
    },
    conversationHistory: Array<{type: 'user' | 'ai'; content: string}> = []
  ): Promise<string> {
    try {
      // Prepare business context
      const context = this.prepareBusinessContext(businessData);
      const history = this.prepareConversationHistory(conversationHistory);
      
      const prompt = `
Você é Carlos, um consultor financeiro sênior especialista em pequenas e médias empresas brasileiras, com 15 anos de experiência. 
Você é conhecido por ser direto, prático e por dar conselhos que realmente funcionam. Você tem uma personalidade calorosa mas profissional.

PERSONALIDADE:
- Seja conversacional e humano, como se fosse um consultor real
- Use linguagem natural, não robótica
- Demonstre empatia com os desafios do empreendedor
- Seja encorajador mas realista
- Use exemplos práticos e situações do dia a dia
- Faça perguntas quando necessário para entender melhor
- Celebre conquistas e seja solidário com dificuldades

DADOS REAIS DO NEGÓCIO DO CLIENTE:
${context}

HISTÓRICO DA CONVERSA:
${history}

PERGUNTA/MENSAGEM ATUAL: ${userMessage}

INSTRUÇÕES PARA RESPOSTA:
- Responda como Carlos, o consultor humano
- Use os dados reais para dar conselhos específicos e personalizados
- Seja prático: dê passos acionáveis, não apenas teoria
- Use emojis moderadamente para humanizar (máximo 3-4 por resposta)
- Inclua números e métricas dos dados reais quando relevante
- Se não tiver dados suficientes, explique o que precisa para ajudar melhor
- Faça conexões entre diferentes aspectos do negócio
- Termine com uma pergunta ou sugestão de próximo passo quando apropriado
- Mantenha tom profissional mas acessível, como uma conversa entre amigos de negócios
- Limite a resposta a no máximo 1500 caracteres para manter o foco

EXEMPLOS DE TOM:
- "Olhando seus números aqui, vejo que..."
- "Posso te dar uma dica baseada na minha experiência..."
- "Isso me lembra de um cliente que tinha situação similar..."
- "Vamos trabalhar juntos para melhorar isso..."

Responda em português brasileiro, como Carlos, o consultor financeiro.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
      
    } catch (error) {
      console.error('Erro ao consultar IA:', error);
      return this.getHumanizedFallbackResponse(userMessage, businessData);
    }
  }

  private prepareBusinessContext(data: {
    products: any[];
    customers: any[];
    sales: any[];
    financialRecords: any[];
  }): string {
    const { products, customers, sales, financialRecords } = data;

    // Calculate key metrics
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalIncome = financialRecords
      .filter(r => r.type === 'income' && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = financialRecords
      .filter(r => r.type === 'expense' && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
    const profit = totalIncome - totalExpenses;
    const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0;
    
    // Low stock products
    const lowStockProducts = products.filter(p => p.stock <= p.min_stock);
    
    // Top selling products
    const productSales = new Map();
    sales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach((item: any) => {
          const current = productSales.get(item.product_name) || 0;
          productSales.set(item.product_name, current + item.total);
        });
      }
    });
    
    const topProducts = Array.from(productSales.entries())
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, revenue]) => ({ name, revenue }));

    // Recent sales trend
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentSales = sales.filter(sale => new Date(sale.created_at) >= lastWeek);
    
    // Customer analysis
    const uniqueCustomers = new Set(sales.filter(s => s.customer_id).map(s => s.customer_id)).size;
    const directSales = sales.filter(s => !s.customer_id).length;

    return `
SITUAÇÃO ATUAL DO NEGÓCIO:
- Faturamento total: R$ ${totalRevenue.toFixed(2)}
- Lucro líquido: R$ ${profit.toFixed(2)}
- Margem de lucro: ${totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : 0}%
- Ticket médio: R$ ${averageTicket.toFixed(2)}
- Total de vendas: ${sales.length}
- Vendas na última semana: ${recentSales.length}

PRODUTOS:
- Total cadastrados: ${products.length}
- Com estoque baixo: ${lowStockProducts.length}
${topProducts.length > 0 ? `- Mais vendidos: ${topProducts.map(p => `${p.name} (R$ ${p.revenue.toFixed(2)})`).join(', ')}` : '- Ainda sem dados de vendas por produto'}

CLIENTES:
- Clientes únicos: ${uniqueCustomers}
- Vendas diretas: ${directSales}
- Base total cadastrada: ${customers.length}

FINANCEIRO:
- Receitas pagas: R$ ${totalIncome.toFixed(2)}
- Despesas pagas: R$ ${totalExpenses.toFixed(2)}
- A receber: R$ ${financialRecords.filter(r => r.type === 'income' && r.status === 'pending').reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
- A pagar: R$ ${financialRecords.filter(r => r.type === 'expense' && r.status === 'pending').reduce((sum, r) => sum + r.amount, 0).toFixed(2)}

ALERTAS:
${lowStockProducts.length > 0 ? `- Produtos com estoque baixo: ${lowStockProducts.map(p => `${p.name} (${p.stock} unidades)`).join(', ')}` : '- Estoque sob controle'}
${profit < 0 ? '- ATENÇÃO: Negócio operando com prejuízo' : ''}
${recentSales.length === 0 ? '- Nenhuma venda na última semana' : ''}
`;
  }

  private prepareConversationHistory(history: Array<{type: 'user' | 'ai'; content: string}>): string {
    if (history.length === 0) return 'PRIMEIRA CONVERSA';
    
    return history.slice(-6).map(msg => 
      `${msg.type === 'user' ? 'CLIENTE' : 'CARLOS'}: ${msg.content}`
    ).join('\n');
  }

  private getHumanizedFallbackResponse(userMessage: string, businessData: any): string {
    const lowercaseMessage = userMessage.toLowerCase();
    
    // Saudações e cumprimentos
    if (lowercaseMessage.includes('oi') || lowercaseMessage.includes('olá') || lowercaseMessage.includes('bom dia') || lowercaseMessage.includes('boa tarde')) {
      return `Olá! Que bom falar com você! 😊

Sou Carlos, seu consultor financeiro pessoal. Estou aqui para te ajudar a entender melhor seu negócio e encontrar oportunidades de crescimento.

Vejo que você já tem alguns dados no sistema - isso é ótimo! Posso analisar suas vendas, finanças, produtos... o que você gostaria de conversar primeiro?

Pode me perguntar qualquer coisa sobre seu negócio que vou te dar conselhos práticos baseados nos seus números reais.`;
    }
    
    // Análise de vendas
    if (lowercaseMessage.includes('venda') || lowercaseMessage.includes('receita') || lowercaseMessage.includes('faturamento')) {
      const totalRevenue = businessData.sales.reduce((sum: number, sale: any) => sum + sale.total, 0);
      const salesCount = businessData.sales.length;
      const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0;
      
      if (salesCount === 0) {
        return `Olha, vejo que você ainda não registrou vendas no sistema. Isso é super normal no começo! 

Para eu conseguir te dar insights valiosos sobre vendas, preciso que você:

📝 **Cadastre suas vendas** - mesmo as antigas, se possível
📦 **Adicione seus produtos** - com preços reais
👥 **Registre seus clientes** - para análises mais precisas

Assim que tiver esses dados, posso te mostrar tendências, identificar seus produtos campeões e sugerir estratégias para aumentar seu faturamento.

Quer que eu te ajude a organizar isso? Por onde prefere começar?`;
      }
      
      return `Analisando suas vendas aqui... 📊

Você já faturou **R$ ${totalRevenue.toFixed(2)}** com **${salesCount} vendas**. Seu ticket médio está em **R$ ${averageTicket.toFixed(2)}**.

${averageTicket < 50 ? 
  `Vejo uma oportunidade interessante: seu ticket médio está baixo. Na minha experiência, empresas similares conseguem facilmente aumentar isso para R$ ${(averageTicket * 1.5).toFixed(2)} com algumas estratégias simples.` :
  averageTicket > 200 ?
  `Parabéns! Seu ticket médio está excelente. Isso mostra que você tem produtos de valor ou sabe vender bem.` :
  `Seu ticket médio está numa faixa boa. Com algumas otimizações, podemos levar para o próximo nível.`
}

Quer que eu te mostre como aumentar essas vendas? Tenho algumas ideias baseadas no que vejo aqui nos seus dados.`;
    }

    // Problemas financeiros
    if (lowercaseMessage.includes('dificuldade') || lowercaseMessage.includes('problema') || lowercaseMessage.includes('ajuda') || lowercaseMessage.includes('não sei')) {
      return `Entendo sua preocupação. Todo empreendedor passa por momentos assim, e é normal ter dúvidas! 💪

Estou aqui exatamente para isso - vamos resolver juntos. Baseado na minha experiência, posso te ajudar com:

🎯 **Estratégias de vendas** - como vender mais e melhor
💰 **Controle financeiro** - organizar entradas e saídas
📊 **Análise de dados** - entender o que os números estão dizendo
🚀 **Planos de crescimento** - próximos passos para expandir

Me conta mais detalhes sobre o que está te preocupando? Quanto mais específico você for, melhor posso te orientar.

Por exemplo: "Minhas vendas caíram", "Não sei se estou lucrando", "Como aumentar meu faturamento"...

Vamos resolver isso juntos! 😊`;
    }

    // Análise de lucro/prejuízo
    if (lowercaseMessage.includes('lucro') || lowercaseMessage.includes('prejuízo') || lowercaseMessage.includes('margem')) {
      const totalIncome = businessData.financialRecords
        .filter((r: any) => r.type === 'income' && r.status === 'paid')
        .reduce((sum: number, r: any) => sum + r.amount, 0);
      const totalExpenses = businessData.financialRecords
        .filter((r: any) => r.type === 'expense' && r.status === 'paid')
        .reduce((sum: number, r: any) => sum + r.amount, 0);
      const profit = totalIncome - totalExpenses;
      const margin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

      if (profit > 0) {
        return `Ótimas notícias! 🎉 Você está lucrando!

Seu lucro atual é de **R$ ${profit.toFixed(2)}** com uma margem de **${margin.toFixed(1)}%**.

${margin > 20 ? 
  `Cara, essa margem está excelente! Você está no caminho certo. Agora é manter e escalar.` :
  margin > 10 ?
  `Margem boa! Com alguns ajustes, podemos levar para 20%+ facilmente.` :
  `Margem baixa, mas você está lucrando - isso já é um bom sinal. Vamos trabalhar para melhorar.`
}

**Próximos passos que recomendo:**
• Identifique seus produtos/serviços mais rentáveis
• Foque vendas nos itens com maior margem
• Analise onde pode otimizar custos sem perder qualidade

Quer que eu analise produto por produto para ver onde está sua maior rentabilidade?`;
      } else if (profit < 0) {
        return `Olha, vou ser direto contigo: você está operando com prejuízo de R$ ${Math.abs(profit).toFixed(2)}. 😟

Mas calma! Isso é mais comum do que imagina, especialmente no início. Já ajudei muitos empreendedores a reverter essa situação.

**Plano de ação imediato:**
1️⃣ **Revisar preços** - talvez estejam baixos demais
2️⃣ **Cortar custos desnecessários** - todo centavo conta
3️⃣ **Focar nos produtos mais rentáveis** - eliminar os que dão prejuízo

Vamos trabalhar nisso juntos. Me conta: qual você acha que é o maior vilão dos seus custos? Fornecedores? Impostos? Operação?

Com os dados que tenho aqui, posso te dar sugestões bem específicas.`;
      } else {
        return `Você está no ponto de equilíbrio - nem lucro, nem prejuízo.

Isso significa que está quase lá! Com pequenos ajustes, podemos te colocar no azul rapidinho.

**Estratégias que funcionam:**
• Aumentar preços em 10-15% (teste com produtos menos sensíveis primeiro)
• Negociar melhores condições com fornecedores
• Focar vendas nos produtos com maior margem

Quer que eu analise seus produtos para identificar onde tem mais oportunidade de melhoria?`;
      }
    }

    // Crescimento e estratégia
    if (lowercaseMessage.includes('crescer') || lowercaseMessage.includes('expandir') || lowercaseMessage.includes('aumentar')) {
      return `Adoro quando vejo essa mentalidade de crescimento! 🚀

Baseado no que vejo nos seus dados, você tem uma base sólida para crescer. Vamos montar uma estratégia:

**Análise rápida da sua situação:**
• ${businessData.products.length} produtos cadastrados
• ${businessData.customers.length} clientes na base
• ${businessData.sales.length} vendas realizadas

**Minha recomendação para crescimento:**

${businessData.sales.length < 10 ? 
  `**Fase 1 - Consolidação:** Primeiro vamos estabilizar suas vendas atuais e entender melhor seu mercado.` :
  `**Fase 1 - Otimização:** Você já tem movimento, agora vamos otimizar o que funciona.`
}

**Próximos 30 dias:**
• Identifique seus 3 melhores clientes e entenda por que compram
• Replique o perfil deles para buscar similares
• Teste aumento de 10% nos preços dos produtos mais procurados

Qual dessas estratégias faz mais sentido para sua realidade atual?`;
    }

    // Resposta padrão humanizada
    return `Oi! Sou o Carlos, seu consultor financeiro pessoal. 😊

Estou aqui para te ajudar com qualquer dúvida sobre seu negócio. Posso analisar seus dados reais e dar conselhos práticos sobre:

💰 **Finanças:** "Como está meu lucro?", "Onde posso economizar?"
📈 **Vendas:** "Como vender mais?", "Meu preço está certo?"
📊 **Estratégia:** "Como crescer?", "Onde focar meus esforços?"
🎯 **Metas:** "Que meta é realista?", "Como chegar lá?"

Pode me perguntar qualquer coisa - desde dúvidas básicas até estratégias complexas. Vou sempre usar seus dados reais para dar conselhos personalizados.

O que está na sua cabeça hoje? Em que posso te ajudar?`;
  }
}

export const aiConsultant = new AIConsultant();