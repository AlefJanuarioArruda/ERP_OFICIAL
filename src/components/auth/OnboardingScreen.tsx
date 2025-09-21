import React, { useState, useEffect } from 'react'
import { ArrowRight, Brain, BarChart3, Users, Zap, Shield, Clock, TrendingUp, CheckCircle, Star, Award, Target, Package, DollarSign, PieChart, Calculator, Wallet, CreditCard, AlertTriangle, Eye, Play, ChevronRight, Sparkles, TrendingDown, Activity, FileText, Layers, Database, Lock, Globe, Smartphone, Building, Crown } from 'lucide-react'

interface OnboardingScreenProps {
  onGetStarted: () => void
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onGetStarted }) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const openVideo = () => setIsVideoOpen(true);
  const closeVideo = () => setIsVideoOpen(false);
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [animatedNumbers, setAnimatedNumbers] = useState({
    revenue: 0,
    savings: 0,
    efficiency: 0
  })

  useEffect(() => {
    setIsVisible(true)
    
    // Animate numbers
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedNumbers(prev => ({
          revenue: Math.min(prev.revenue + 2, 47),
          savings: Math.min(prev.savings + 1.5, 35),
          efficiency: Math.min(prev.efficiency + 3, 85)
        }))
      }, 50)
      
      setTimeout(() => clearInterval(interval), 2000)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const heroFeatures = [
    {
      icon: <Calculator className="w-10 h-10 text-emerald-600" />,
      title: "Controle Financeiro Total",
      description: "Fluxo de caixa em tempo real, contas a pagar e receber, análise de lucratividade por produto",
      highlight: "Aumente lucro em 47%",
      color: "from-emerald-500 to-green-600"
    },
    {
      icon: <Package className="w-10 h-10 text-blue-600" />,
      title: "Gestão Inteligente de Estoque",
      description: "Controle automático de inventário, alertas de reposição, análise de giro e sazonalidade",
      highlight: "Reduza perdas em 35%",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <Brain className="w-10 h-10 text-purple-600" />,
      title: "IA Financeira Avançada",
      description: "Previsões de demanda, otimização de compras, insights de rentabilidade automáticos",
      highlight: "Eficiência +85%",
      color: "from-purple-500 to-pink-600"
    }
  ]

  
  const problemSolutions = [
    {
      problem: "Não sei se estou lucrando de verdade",
      solution: "Dashboard financeiro com margem real por produto",
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      solutionIcon: <DollarSign className="w-6 h-6 text-green-500" />
    },
    {
      problem: "Produtos parados no estoque",
      solution: "IA identifica produtos de baixo giro automaticamente",
      icon: <Package className="w-6 h-6 text-red-500" />,
      solutionIcon: <Brain className="w-6 h-6 text-blue-500" />
    },
    {
      problem: "Perco vendas por falta de produto",
      solution: "Alertas inteligentes de reposição baseados em histórico",
      icon: <TrendingDown className="w-6 h-6 text-red-500" />,
      solutionIcon: <TrendingUp className="w-6 h-6 text-green-500" />
    },
    {
      problem: "Não sei qual produto dá mais lucro",
      solution: "Ranking automático de rentabilidade por item",
      icon: <BarChart3 className="w-6 h-6 text-red-500" />,
      solutionIcon: <Award className="w-6 h-6 text-amber-500" />
    }
  ]

  const financialFeatures = [
    {
      icon: <Wallet className="w-8 h-8 text-emerald-600" />,
      title: "Fluxo de Caixa Inteligente",
      description: "Visualize entradas e saídas em tempo real com projeções automáticas",
      metrics: "Controle 100% do seu dinheiro"
    },
    {
      icon: <PieChart className="w-8 h-8 text-blue-600" />,
      title: "Análise de Lucratividade",
      description: "Descubra quais produtos realmente dão lucro e quais estão te fazendo perder dinheiro",
      metrics: "Aumente margem em 25%"
    },
    {
      icon: <Calculator className="w-8 h-8 text-purple-600" />,
      title: "Precificação Inteligente",
      description: "IA sugere preços ideais baseados em custos, concorrência e demanda",
      metrics: "Otimize preços automaticamente"
    },
    {
      icon: <FileText className="w-8 h-8 text-amber-600" />,
      title: "Relatórios Financeiros",
      description: "DRE, balanço patrimonial e indicadores financeiros gerados automaticamente",
      metrics: "Relatórios em 1 clique"
    }
  ]

  const stockFeatures = [
    {
      icon: <Database className="w-8 h-8 text-blue-600" />,
      title: "Inventário Automatizado",
      description: "Controle de entrada e saída automático com histórico completo de movimentações",
      metrics: "Zero erro de estoque"
    },
    {
      icon: <Activity className="w-8 h-8 text-green-600" />,
      title: "Giro de Estoque IA",
      description: "Identifique produtos parados e otimize seu capital de giro automaticamente",
      metrics: "Libere 40% do capital"
    },
    {
      icon: <Target className="w-8 h-8 text-red-600" />,
      title: "Ponto de Reposição",
      description: "Nunca mais perca vendas por falta de produto com alertas inteligentes",
      metrics: "Aumente vendas em 30%"
    },
    {
      icon: <Layers className="w-8 h-8 text-purple-600" />,
      title: "Categorização Avançada",
      description: "Organize produtos por categoria, fornecedor, sazonalidade e performance",
      metrics: "Gestão 10x mais eficiente"
    }
  ]

  const testimonials = [
    {
      name: "Carlos Mendes",
      company: "Distribuidora CM",
      role: "Proprietário",
      text: "Em 3 meses aumentei meu lucro em 52% só otimizando meu estoque. A IA me mostrou produtos que eu nem sabia que davam prejuízo.",
      rating: 5,
      revenue: "R$ 2.3M",
      growth: "+52%",
      avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    },
    {
      name: "Ana Rodrigues",
      company: "Farmácia Saúde+",
      role: "Gestora Financeira",
      text: "Descobri que 30% dos meus produtos não davam lucro real. Agora foco apenas nos rentáveis e meu faturamento dobrou.",
      rating: 5,
      revenue: "R$ 890K",
      growth: "+89%",
      avatar: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    },
    {
      name: "Roberto Silva",
      company: "Autopeças RS",
      role: "CEO",
      text: "O sistema pagou por si mesmo no primeiro mês. Economizei R$ 15 mil só otimizando compras com as previsões da IA.",
      rating: 5,
      revenue: "R$ 1.8M",
      growth: "+73%",
      avatar: "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    }
  ]

  const stats = [
    { number: "R$ 50M+", label: "Lucro Gerado para Clientes", icon: <DollarSign className="w-6 h-6" /> },
    { number: "2,500+", label: "Empresas Transformadas", icon: <Building className="w-6 h-6" /> },
    { number: "47%", label: "Aumento Médio de Lucro", icon: <TrendingUp className="w-6 h-6" /> },
    { number: "35%", label: "Redução de Custos", icon: <TrendingDown className="w-6 h-6" /> }
  ]

  const pricingBenefits = [
    "Controle financeiro completo",
    "Gestão inteligente de estoque",
    "IA para otimização de lucros",
    "Relatórios executivos automáticos",
    "Alertas de oportunidades",
    "Previsão de demanda",
    "Análise de rentabilidade",
    "Suporte especializado 24/7"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
      {/*  <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-emerald-500 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div> */}
        
        {/* Floating Icons */}
        <div className="absolute top-20 left-1/4 animate-bounce" style={{ animationDelay: '0.5s' }}>
          <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <div className="absolute top-1/3 right-1/3 animate-bounce" style={{ animationDelay: '1.5s' }}>
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Package className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <div className="absolute bottom-1/3 left-1/3 animate-bounce" style={{ animationDelay: '2.5s' }}>
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Logo and Brand */}
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-3xl flex items-center justify-center mr-6 shadow-2xl transform hover:scale-110 transition-transform duration-300">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-5xl font-bold text-white mb-2">ERP Smart</h1>
                <p className="text-xl text-blue-200">Inteligência Financeira</p>
              </div>
            </div>

            {/* Main Headline with Animation */}
            <div className="mb-16">
              <div className="inline-flex items-center bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-full px-6 py-3 mb-8">
                <Sparkles className="w-5 h-5 text-emerald-400 mr-2 animate-pulse" />
                <span className="text-emerald-300 font-semibold">Sistema #1 em Gestão Financeira e Estoque</span>
              </div>

              
              <h2 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
                Controle Total
                <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent block mt-4 animate-pulse">
                  Venda Mais
                </span>
                <span className="text-5xl md:text-6xl block mt-4">
                  Gaste Menos
                </span>
              </h2>
              
              <p className="text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed mb-12">
                Pare de perder dinheiro com estoque parado e custos ocultos. 
                Nossa IA analisa cada centavo e produto para <strong className="text-emerald-400">maximizar seus lucros automaticamente</strong>.
              </p>

              {/* Animated Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                  <div className="text-4xl font-bold text-emerald-400 mb-2">+{animatedNumbers.revenue}%</div>
                  <div className="text-blue-100">Aumento de Receita</div>
                  <div className="text-sm text-blue-200 mt-1">Média dos nossos clientes</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                  <div className="text-4xl font-bold text-blue-400 mb-2">-{animatedNumbers.savings}%</div>
                  <div className="text-blue-100">Redução de Custos</div>
                  <div className="text-sm text-blue-200 mt-1">Com otimização de estoque</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                  <div className="text-4xl font-bold text-purple-400 mb-2">{animatedNumbers.efficiency}%</div>
                  <div className="text-blue-100">Mais Eficiência</div>
                  <div className="text-sm text-blue-200 mt-1">Tempo economizado</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <button
                  onClick={onGetStarted}
                  className="group relative inline-flex items-center px-12 py-5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xl font-bold rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-emerald-500/25 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Calculator className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                  Entre Agora
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                </button>
                
                <button onClick={openVideo}
                  className="group flex items-center text-white hover:text-emerald-400 transition-colors duration-300">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mr-4 group-hover:bg-emerald-500/20 transition-all duration-300">
                    <Play className="w-5 h-5 ml-1" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Ver Demonstração</div>
                    <div className="text-sm text-blue-200">35 segundos de vídeo</div>
                  </div>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center gap-8 text-blue-200">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                  <span>Teste grátis</span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-blue-400 mr-2" />
                  <span>Dados 100% seguros</span>
                </div>
                <div className="flex items-center">
                  <Zap className="w-5 h-5 text-purple-400 mr-2" />
                  <span>Configuração em 5 min</span>
                </div>
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-amber-400 mr-2" />
                  <span>Garantia de resultados</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem/Solution Section */}
      <div className="relative z-10 py-24 bg-gradient-to-r from-slate-800/50 to-blue-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-6">
              Pare de Perder Dinheiro com Gestão Ineficiente
            </h3>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Identifique e resolva os problemas que estão sugando o lucro do seu negócio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {problemSolutions.map((item, index) => (
              <div 
                key={index}
                className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-500 transform hover:scale-105"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-500/30 transition-colors duration-300">
                      {item.icon}
                    </div>
                    <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors duration-300">
                      {item.solutionIcon}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-red-400 mb-2">❌ Problema:</h4>
                      <p className="text-white">{item.problem}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-emerald-400 mb-2">✅ Nossa Solução:</h4>
                      <p className="text-blue-100">{item.solution}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Features Section */}
      <div className="relative z-10 py-24 bg-gradient-to-br from-emerald-900/30 to-green-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-full px-6 py-3 mb-6">
              <Calculator className="w-5 h-5 text-emerald-400 mr-2" />
              <span className="text-emerald-300 font-semibold">Controle Financeiro Inteligente</span>
            </div>
            <h3 className="text-4xl font-bold text-white mb-6">
              Descubra Onde Está Seu Dinheiro
            </h3>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
              Cada real conta. Nossa IA analisa seus dados financeiros e revela oportunidades ocultas de lucro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {financialFeatures.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-emerald-400/20 hover:border-emerald-400/40 transition-all duration-500 transform hover:scale-105 hover:bg-white/10"
              >
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors duration-300 group-hover:rotate-6">
                    {feature.icon}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
                    <p className="text-emerald-100 mb-4 leading-relaxed">{feature.description}</p>
                    
                    <div className="inline-flex items-center bg-emerald-500/20 rounded-full px-4 py-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400 mr-2" />
                      <span className="text-emerald-300 font-semibold text-sm">{feature.metrics}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Management Section */}
      <div className="relative z-10 py-24 bg-gradient-to-br from-blue-900/30 to-indigo-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-6 py-3 mb-6">
              <Package className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-blue-300 font-semibold">Gestão Inteligente de Estoque</span>
            </div>
            <h3 className="text-4xl font-bold text-white mb-6">
              Transforme Estoque em Lucro
            </h3>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Pare de ter dinheiro parado em produtos que não vendem. Nossa IA otimiza seu estoque para máxima rentabilidade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {stockFeatures.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 transform hover:scale-105 hover:bg-white/10"
              >
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors duration-300 group-hover:rotate-6">
                    {feature.icon}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
                    <p className="text-blue-100 mb-4 leading-relaxed">{feature.description}</p>
                    
                    <div className="inline-flex items-center bg-blue-500/20 rounded-full px-4 py-2">
                      <Target className="w-4 h-4 text-blue-400 mr-2" />
                      <span className="text-blue-300 font-semibold text-sm">{feature.metrics}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Features Carousel */}
      <div className="relative z-10 py-24 bg-gradient-to-r from-purple-900/30 to-pink-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-6">
              3 Pilares do Sucesso Financeiro
            </h3>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              Nossa plataforma integra os três elementos essenciais para maximizar seus lucros
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {heroFeatures.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-white/5 backdrop-blur-sm rounded-3xl p-10 border border-white/10 hover:bg-white/10 transition-all duration-700 transform hover:scale-110 hover:-translate-y-4"
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                {/* Gradient Border Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-20 rounded-3xl transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  <div className="flex justify-center mb-8">
                    <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:rotate-12`}>
                      {feature.icon}
                    </div>
                  </div>
                  
                  <h4 className="text-2xl font-bold text-white mb-4 text-center">{feature.title}</h4>
                  <p className="text-gray-300 text-center leading-relaxed mb-6">{feature.description}</p>
                  
                  <div className="text-center">
                    <div className={`inline-flex items-center bg-gradient-to-r ${feature.color} bg-opacity-20 rounded-full px-6 py-3 border border-white/20`}>
                      <Sparkles className="w-4 h-4 text-white mr-2 animate-pulse" />
                      <span className="text-white font-bold text-sm">{feature.highlight}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="relative z-10 py-24 bg-gradient-to-br from-slate-800/50 to-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-6">
              Resultados Reais de Quem Usa
            </h3>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Empresários que transformaram seus negócios com nossa plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-500 transform hover:scale-105"
              >
                {/* Header with Avatar and Stats */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                    />
                    <div>
                      <div className="font-bold text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-300">{testimonial.role}</div>
                      <div className="text-xs text-gray-400">{testimonial.company}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">{testimonial.growth}</div>
                    <div className="text-sm text-gray-300">crescimento</div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                {/* Testimonial Text */}
                <blockquote className="text-gray-200 mb-6 italic leading-relaxed">
                  "{testimonial.text}"
                </blockquote>
                
                {/* Revenue Badge */}
                <div className="inline-flex items-center bg-emerald-500/20 rounded-full px-4 py-2">
                  <DollarSign className="w-4 h-4 text-emerald-400 mr-2" />
                  <span className="text-emerald-300 font-semibold text-sm">Faturamento: {testimonial.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 py-20 bg-gradient-to-r from-emerald-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Números que Comprovam Nossa Eficácia
            </h3>
            <p className="text-xl text-emerald-100">
              Resultados mensuráveis de empresas que escolheram o ERP Smart
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center group hover:scale-110 transition-transform duration-300"
              >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors duration-300">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-white mb-2 group-hover:text-emerald-200 transition-colors duration-300">
                  {stat.number}
                </div>
                <div className="text-emerald-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="relative z-10 py-24 bg-gradient-to-br from-slate-900/80 to-blue-900/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-6">
              Investimento que se Paga Sozinho
            </h3>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Nossos clientes recuperam o investimento em menos de 30 dias com a otimização de lucros
            </p>
          </div>

          {/* Single Pricing Card - Premium */}
          <div className="max-w-lg mx-auto">
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-10 border-2 border-emerald-400/30 shadow-2xl transform hover:scale-105 transition-all duration-500">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center shadow-lg">
                  <Crown className="w-4 h-4 mr-2" />
                  Mais Escolhido
                </span>
              </div>
              
              <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                </div>
                
                <h4 className="text-3xl font-bold text-white mb-4">ERP Smart Premium</h4>
                <p className="text-gray-300 mb-6">Controle financeiro e de estoque completo com IA</p>
                
                <div className="mb-8">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-6xl font-bold text-white">R$ 29</span>
                    <span className="text-2xl text-gray-300 ml-2">/mês</span>
                  </div>
                  <div className="text-emerald-400 font-semibold">
                    Economia média de R$ 2.500/mês
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    ROI de 8.600% comprovado
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                {pricingBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-200">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={onGetStarted}
                className="group w-full py-5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xl font-bold rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-emerald-500/25 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center">
                  <Zap className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                  Começar Teste Gratuito de 14 Dias
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </button>

              {/* Guarantee */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center text-emerald-400 text-sm font-semibold">
                  <Shield className="w-4 h-4 mr-2" />
                  Garantia de 30 dias ou seu dinheiro de volta
                </div>
              </div>
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <Lock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">100% Seguro</h4>
              <p className="text-gray-300 text-sm">Seus dados protegidos com criptografia bancária</p>
            </div>
            
            <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <Globe className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Acesso Anywhere</h4>
              <p className="text-gray-300 text-sm">Use em qualquer dispositivo, a qualquer hora</p>
            </div>
            
            <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <Smartphone className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Suporte 24/7</h4>
              <p className="text-gray-300 text-sm">Especialistas prontos para te ajudar sempre</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative z-10 py-24 bg-gradient-to-r from-gray-900 to-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-12">
            <h3 className="text-5xl font-bold text-white mb-8">
              Sua Transformação Financeira
              <span className="block text-emerald-400 mt-2">Começa Agora</span>
            </h3>
            
            <p className="text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Mais de <strong className="text-emerald-400">2.500 empresários</strong> já descobriram como 
              <strong className="text-blue-400"> maximizar lucros</strong> e 
              <strong className="text-purple-400"> otimizar estoque</strong> com nossa IA
            </p>
          </div>
          
          {/* Urgency Elements */}
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-8 mb-12">
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-red-400 mr-3 animate-pulse" />
              <span className="text-2xl font-bold text-white">Oferta Limitada</span>
            </div>
            <p className="text-red-200 text-lg mb-4">
              <strong>Apenas hoje:</strong> Teste gratuito estendido para 14 dias + consultoria gratuita de implementação
            </p>
            <div className="text-sm text-red-300">
              ⏰ Esta oferta expira em: <span className="font-bold">23:59 hoje</span>
            </div>
          </div>
          
          <div className="space-y-8">
            <button
              onClick={onGetStarted}
              className="group relative inline-flex items-center px-16 py-6 bg-gradient-to-r from-emerald-500 via-green-500 to-blue-500 text-white text-2xl font-bold rounded-3xl hover:from-emerald-600 hover:via-green-600 hover:to-blue-600 transition-all duration-500 transform hover:scale-110 shadow-2xl hover:shadow-emerald-500/30 overflow-hidden"
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="relative flex items-center">
                <Sparkles className="mr-4 w-8 h-8 group-hover:rotate-180 transition-transform duration-500" />
                Começar Minha Transformação Agora
                <ArrowRight className="ml-4 w-8 h-8 group-hover:translate-x-4 transition-transform duration-300" />
              </div>
            </button>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-12 text-gray-300">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-emerald-400 mr-3" />
                <span className="text-lg">14 dias grátis</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-6 h-6 text-blue-400 mr-3" />
                <span className="text-lg">Sem cartão de crédito</span>
              </div>
              <div className="flex items-center">
                <Award className="w-6 h-6 text-purple-400 mr-3" />
                <span className="text-lg">Garantia total</span>
              </div>
              <div className="flex items-center">
                <Zap className="w-6 h-6 text-amber-400 mr-3" />
                <span className="text-lg">Resultados em 24h</span>
              </div>
            </div>
            
            {/* Risk Reversal */}
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 max-w-2xl mx-auto">
              <h4 className="text-xl font-bold text-white mb-3">🛡️ Garantia Blindada de Resultados</h4>
              <p className="text-blue-100 text-sm leading-relaxed">
                Se em 30 dias você não aumentar seus lucros em pelo menos 20% ou não ficar 100% satisfeito, 
                devolvemos todo seu dinheiro sem perguntas. <strong className="text-emerald-400">Garantia total!</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators Footer */}
      <div className="relative z-10 py-12 bg-slate-900/90 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <Shield className="w-8 h-8 text-emerald-400 mb-2" />
              <span className="text-sm text-gray-300 font-medium">SSL Certificado</span>
              <span className="text-xs text-gray-500">Segurança Bancária</span>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-blue-400 mb-2" />
              <span className="text-sm text-gray-300 font-medium">LGPD Compliance</span>
              <span className="text-xs text-gray-500">Dados Protegidos</span>
            </div>
            <div className="flex flex-col items-center">
              <Award className="w-8 h-8 text-purple-400 mb-2" />
              <span className="text-sm text-gray-300 font-medium">ISO 27001</span>
              <span className="text-xs text-gray-500">Certificação Internacional</span>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-8 h-8 text-amber-400 mb-2" />
              <span className="text-sm text-gray-300 font-medium">99.9% Uptime</span>
              <span className="text-xs text-gray-500">Sempre Disponível</span>
            </div>
          </div>
          
          <div className="text-center mt-8 pt-8 border-t border-white/10">
            <p className="text-gray-400 text-sm">
              © 2025 ERP Smart. Transformando negócios com inteligência artificial.
            </p>
          </div>
        </div>
      </div>
            {/* Video Modal */}
      {isVideoOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
    onClick={closeVideo}
  >
    {/* 💡 MUDANÇA: A largura máxima foi reduzida para se adequar ao formato vertical */}
    <div
      className="relative w-full max-w-sm bg-black rounded-lg shadow-2xl"
      onClick={(e) => e.stopPropagation()} 
    >
      <button
        onClick={closeVideo}
        className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full text-black flex items-center justify-center text-xl font-bold z-10"
      >
        &times;
      </button>

      {/* 🔄 MUDANÇA: As classes de proporção foram invertidas para 9:16 */}
      <div className="aspect-w-20 aspect-h-50 rounded-lg overflow-hidden">
        <iframe
          className="w-full h-full" // Adicionado para garantir o preenchimento
          src="https://www.youtube.com/embed/r3rS52FDgTA"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        >
        </iframe>
              
            </div>
          </div>
        </div>
      )}
    </div>
  )
}