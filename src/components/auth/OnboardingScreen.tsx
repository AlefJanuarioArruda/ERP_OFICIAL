import React from 'react'
import { ArrowRight, Brain, BarChart3, Users, Zap, Shield, Clock, TrendingUp, CheckCircle, Star, Award, Target, Package } from 'lucide-react'

interface OnboardingScreenProps {
  onGetStarted: () => void
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onGetStarted }) => {
  const mainFeatures = [
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: "IA Avançada",
      description: "Análises preditivas que antecipam tendências e oportunidades do seu negócio",
      highlight: "Aumente vendas em até 35%"
    },
    {
      icon: <Package className="w-8 h-8 text-green-600" />,
      title: "Gestão de Estoque e Produtos",
      description: "Controle completo de inventário com alertas automáticos de estoque baixo e análise de performance de produtos",
      highlight: "Reduza perdas em 50%"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
      title: "Vendas Inteligentes",
      description: "Sistema de vendas integrado com controle de clientes, histórico de compras e análise de performance",
      highlight: "Aumente conversão em 40%"
    }
  ]

  const benefits = [
    {
      icon: <Target className="w-6 h-6 text-blue-600" />,
      title: "ROI Comprovado",
      description: "Clientes relatam retorno do investimento em menos de 3 meses"
    },
    {
      icon: <Package className="w-6 h-6 text-green-600" />,
      title: "Controle de Estoque Inteligente",
      description: "Alertas automáticos, previsão de demanda e otimização de compras"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      title: "Análise de Performance",
      description: "Identifique produtos mais rentáveis e otimize seu mix de vendas"
    },
    {
      icon: <Shield className="w-6 h-6 text-amber-600" />,
      title: "Integração Total",
      description: "Estoque, vendas e financeiro trabalhando em perfeita sincronia"
    }
  ]

  const testimonials = [
    {
      name: "Maria Silva",
      company: "Loja Fashion Plus",
      text: "Aumentei minhas vendas em 40% nos primeiros 2 meses. A IA me ajuda a entender melhor meus clientes.",
      rating: 5
    },
    {
      name: "João Santos",
      company: "Distribuidora Santos",
      text: "Economizo 20 horas por semana com a automação. Agora foco no que realmente importa: crescer.",
      rating: 5
    },
    {
      name: "Ana Costa",
      company: "Consultoria AC",
      text: "O melhor investimento que fiz para minha empresa. Relatórios que realmente fazem diferença.",
      rating: 5
    }
  ]

  const stats = [
    { number: "1,000+", label: "Empresas Atendidas" },
    { number: "R$ 10M+", label: "Faturamento Gerado" },
    { number: "98%", label: "Satisfação dos Clientes" },
    { number: "24/7", label: "Suporte Disponível" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Logo and Brand */}
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-gray-900">ERP Smart</h1>
                <p className="text-lg text-gray-600">Sistema Inteligente de Gestão</p>
              </div>
            </div>

            {/* Main Headline */}
            <div className="mb-12">
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transforme seu negócio com
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block mt-4 leading-relaxed">
                  Inteligência Artificial
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
                O único ERP que combina gestão empresarial completa com IA avançada. 
                Sistema completo de gestão empresarial com IA avançada para estoque, vendas e análises preditivas.
                Gestão Integrada: Do Estoque ao Faturamento
              </p>
              <p className="text-xl text-gray-600">
                Controle completo do seu negócio com foco em produtos, vendas e lucratividade
              </p>
              
              {/* Value Proposition */}
              <div className="flex flex-wrap justify-center gap-6 mb-12 mt-8">
                <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-md">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="font-semibold text-gray-900">Aumento de 35% nas vendas</span>
                </div>
                <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-md">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="font-semibold text-gray-900">Economia de 15h/semana</span>
                </div>
                <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-md">
                  <CheckCircle className="w-5 h-5 text-purple-500 mr-2" />
                  <span className="font-semibold text-gray-900">A partir de R$ 59,90/mês</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <button
                  onClick={onGetStarted}
                  className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Começar Gratuitamente
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Teste grátis por 14 dias
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Sem cartão de crédito
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Configuração em 5 minutos
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-green-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Por que o ERP Smart é Perfeito para Gestão de Produtos?
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Plataforma especializada em gestão de estoque, catálogo de produtos e otimização de vendas com IA
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature, index) => (
              <div 
                key={index}
                className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {feature.highlight}
                </div>
                
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-white rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    {feature.icon}
                  </div>
                </div>
                
                <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">{feature.title}</h4>
                <p className="text-gray-600 text-center leading-relaxed">{feature.description}</p>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-center text-sm text-green-600 font-semibold">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Resultado Comprovado
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Números que Comprovam Nossa Excelência
            </h3>
            <p className="text-xl text-blue-100">
              Resultados reais de empresas que transformaram sua gestão conosco
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-blue-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Benefícios Que Fazem a Diferença
            </h3>
            <p className="text-xl text-gray-600">
              Cada funcionalidade foi pensada para maximizar seus resultados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-start space-x-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-100 to-white rounded-xl flex items-center justify-center shadow-sm">
                  {benefit.icon}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h4>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              O Que Nossos Clientes Dizem
            </h3>
            <p className="text-xl text-gray-600">
              Histórias reais de transformação e crescimento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <blockquote className="text-gray-700 mb-6 italic">
                  "{testimonial.text}"
                </blockquote>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Problem/Solution Section */}
      <div className="py-20 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Pare de Perder Dinheiro com Gestão Ineficiente
              </h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Planilhas Desorganizadas</h4>
                    <p className="text-gray-600">Dados espalhados, erros manuais e tempo perdido</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Decisões no Escuro</h4>
                    <p className="text-gray-600">Falta de insights para crescer estrategicamente</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Oportunidades Perdidas</h4>
                    <p className="text-gray-600">Vendas que poderiam acontecer mas você não vê</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                A Solução Está Aqui
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Gestão Centralizada</h4>
                    <p className="text-gray-600">Todos os dados em um só lugar, organizados e seguros</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">IA que Prevê Tendências</h4>
                    <p className="text-gray-600">Antecipe demandas e otimize seu estoque automaticamente</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Crescimento Acelerado</h4>
                    <p className="text-gray-600">Identifique oportunidades que seus concorrentes não veem</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Funcionalidades que Impulsionam Resultados
            </h3>
            <p className="text-xl text-gray-600">
              Cada ferramenta foi desenvolvida para maximizar sua eficiência e lucratividade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Package className="w-6 h-6" />, title: "Gestão de Estoque", desc: "Controle completo de inventário com alertas automáticos" },
              { icon: <BarChart3 className="w-6 h-6" />, title: "Catálogo de Produtos", desc: "Organize produtos com preços, custos e margens" },
              { icon: <Users className="w-6 h-6" />, title: "Gestão de Clientes", desc: "CRM completo com histórico de compras e fidelização" },
              { icon: <TrendingUp className="w-6 h-6" />, title: "Vendas Inteligentes", desc: "PDV integrado com análise de performance em tempo real" },
              { icon: <Brain className="w-6 h-6" />, title: "Insights de IA", desc: "Previsões de demanda e recomendações estratégicas" },
              { icon: <Shield className="w-6 h-6" />, title: "Controle Financeiro", desc: "Fluxo de caixa, contas a pagar e receber automatizados" },
              { icon: <Award className="w-6 h-6" />, title: "Relatórios Avançados", desc: "Análises detalhadas de lucratividade por produto" },
              { icon: <Zap className="w-6 h-6" />, title: "Automação Total", desc: "Processos integrados que eliminam trabalho manual" }
            ].map((feature, index) => (
              <div 
                key={index}
                className="text-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                  {feature.icon}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Empresas de Todos os Tamanhos Confiam em Nós
            </h3>
            <p className="text-xl text-gray-600">
              Do pequeno empreendedor à grande corporação
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
              <div className="text-4xl font-bold text-blue-600 mb-2">Pequenas</div>
              <div className="text-gray-600 mb-4">1-10 funcionários</div>
              <div className="text-sm text-gray-500">Organização e crescimento estruturado</div>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border-2 border-purple-200">
              <div className="text-4xl font-bold text-purple-600 mb-2">Médias</div>
              <div className="text-gray-600 mb-4">11-100 funcionários</div>
              <div className="text-sm text-gray-500">Otimização e automação de processos</div>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
              <div className="text-4xl font-bold text-green-600 mb-2">Grandes</div>
              <div className="text-gray-600 mb-4">100+ funcionários</div>
              <div className="text-sm text-gray-500">Análises avançadas e inteligência de mercado</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-20 bg-gradient-to-r from-gray-900 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Pronto para Transformar Seu Negócio?
          </h3>
          <p className="text-xl text-gray-300 mb-8">
            Junte-se a milhares de empresários que já descobriram o poder da gestão inteligente
          </p>
          
          <div className="space-y-6">
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              Começar Minha Transformação Digital
              <ArrowRight className="ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-gray-300">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                <span>Teste gratuito</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                <span>Sem compromisso</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                <span>Suporte incluído</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-12 text-sm text-gray-600">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-green-500 mr-2" />
              <span>Certificação ISO 27001</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
              <span>LGPD Compliance</span>
            </div>
            <div className="flex items-center">
              <Award className="w-5 h-5 text-purple-500 mr-2" />
              <span>Prêmio Melhor ERP 2024</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-amber-500 mr-2" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}