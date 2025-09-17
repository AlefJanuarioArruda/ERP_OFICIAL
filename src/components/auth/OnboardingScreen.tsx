import React from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Brain,
  BarChart3,
  Users,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle,
  Star,
  Award,
  Target,
  Package,
  Wallet,
  Landmark,
  Scale,
  Receipt,
  PieChart,
  Warehouse,
} from 'lucide-react'

// --- INTERFACES E DADOS ---

interface OnboardingScreenProps {
  onGetStarted: () => void
}

const mainFeatures = [
  {
    icon: <Wallet className="w-8 h-8 text-green-600" />,
    title: 'Gestão Financeira Completa',
    description: 'Controle seu fluxo de caixa, contas a pagar/receber e conciliação bancária em um só lugar. Tenha clareza total da saúde financeira do seu negócio.',
    highlight: 'Reduza custos em 25%',
  },
  {
    icon: <Warehouse className="w-8 h-8 text-blue-600" />,
    title: 'Controle de Estoque Preditivo',
    description: 'Nossa IA prevê a demanda, sugere compras e evita tanto o excesso quanto a falta de produtos. Venda mais, perdendo menos.',
    highlight: 'Otimize o giro em 40%',
  },
  {
    icon: <PieChart className="w-8 h-8 text-purple-600" />,
    title: 'Inteligência de Negócios (BI)',
    description: 'Conecte dados de estoque e finanças para descobrir a margem de lucro real por produto, identificar tendências e tomar decisões baseadas em dados.',
    highlight: 'Decisões 10x mais rápidas',
  },
]

const benefits = [
  {
    icon: <Scale className="w-6 h-6 text-green-600" />,
    title: 'Visibilidade Financeira Total',
    description: 'Saiba exatamente para onde seu dinheiro está indo com relatórios DRE e de fluxo de caixa gerados automaticamente.',
  },
  {
    icon: <Package className="w-6 h-6 text-blue-600" />,
    title: 'Estoque Sem Pontas Soltas',
    description: 'Alertas de estoque mínimo/máximo, histórico de movimentação e avaliação de inventário (FIFO/LIFO).',
  },
  {
    icon: <Receipt className="w-6 h-6 text-yellow-600" />,
    title: 'Conciliação Bancária Automática',
    description: 'Economize horas de trabalho manual. Integramos com os principais bancos para uma conciliação rápida e sem erros.',
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
    title: 'Análise de Lucratividade',
    description: 'Identifique quais produtos trazem mais lucro e otimize suas estratégias de preço e compra de forma inteligente.',
  },
]

const testimonials = [
  {
    name: 'Carlos Mendes',
    company: 'Distribuidora Veloz',
    text: 'Finalmente entendi minha margem de lucro real por produto. Aumentei a rentabilidade em 30% e reduzi o estoque parado drasticamente.',
    rating: 5,
  },
  {
    name: 'Juliana Almeida',
    company: 'E-commerce Bella Moda',
    text: 'A conciliação bancária que levava dias agora é feita em minutos. O FinanStock IA me devolveu horas preciosas para focar em vendas.',
    rating: 5,
  },
  {
    name: 'Ricardo Bastos',
    company: 'Importados RB',
    text: 'O sistema previu uma alta na demanda de um produto e me alertou para comprar mais. Evitei uma ruptura de estoque que me custaria caro.',
    rating: 5,
  },
]

const stats = [
  { number: 'R$50M+', label: 'Transacionados na Plataforma' },
  { number: '1.500+', label: 'Empresas Otimizadas' },
  { number: '98%', label: 'Satisfação dos Clientes' },
  { number: '24h', label: 'De economia média por mês' },
]

// --- SUBCOMPONENTES VISUAIS ---

const MotionDiv = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
)

const FeatureCard = ({ feature, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
    className="relative bg-white/50 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:shadow-2xl hover:border-white/50 transition-all duration-300 hover:-translate-y-2 group"
  >
    <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
      {feature.highlight}
    </div>
    <div className="flex justify-center mb-6">
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
        {feature.icon}
      </div>
    </div>
    <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">{feature.title}</h4>
    <p className="text-gray-700 text-center leading-relaxed">{feature.description}</p>
  </motion.div>
)

// --- COMPONENTE PRINCIPAL ---

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 antialiased relative overflow-hidden">
      {/* Fundo Aurora Dinâmico */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-purple-300/50 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] bg-blue-300/40 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-green-300/40 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <header className="relative py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MotionDiv>
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                <Landmark className="w-8 h-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tighter">FinanStock IA</h1>
            </div>
            <h2 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tighter">
              Domine suas Finanças e Estoque
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-2">
                com a Precisão da IA
              </span>
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-10">
              Pare de perder dinheiro com estoque parado e planilhas confusas. Tenha uma visão clara do seu fluxo de caixa e lucro em tempo real.
            </p>
          </MotionDiv>
          
          <MotionDiv>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onGetStarted}
                className="group inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white text-lg font-semibold rounded-2xl hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
              >
                Começar Teste Gratuito
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <p className="mt-6 text-sm text-gray-600">
              Teste grátis por 14 dias • Sem cartão de crédito • Resultados no primeiro mês
            </p>
          </MotionDiv>
        </div>
      </header>

      {/* Main Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionDiv className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              A Plataforma 3-em-1 para o seu Sucesso
            </h3>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Nossa solução integra as áreas mais críticas do seu negócio para que você tenha controle total e possa focar no crescimento.
            </p>
          </MotionDiv>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <MotionDiv key={index} className="text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">{stat.number}</div>
                <div className="text-gray-300 font-medium tracking-wide uppercase text-sm">{stat.label}</div>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-20 bg-white/30 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionDiv className="text-center mb-16">
             <h3 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Benefícios que Transformam sua Gestão
            </h3>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Cada funcionalidade foi desenhada para resolver problemas reais e gerar resultados imediatos.
            </p>
          </MotionDiv>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
               <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start space-x-4 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  {benefit.icon}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{benefit.title}</h4>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionDiv className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              O Que Nossos Clientes Dizem
            </h3>
            <p className="text-lg text-gray-700">
              Histórias reais de quem parou de adivinhar e começou a lucrar.
            </p>
          </MotionDiv>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 border border-white/30 shadow-lg"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 italic text-lg">
                  "{testimonial.text}"
                </blockquote>
                <div className="border-t border-gray-200 pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.company}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MotionDiv>
            <h3 className="text-5xl font-bold text-white mb-6 tracking-tighter">
              Pronto para ter o Controle Total?
            </h3>
            <p className="text-xl text-gray-300 mb-10">
              Junte-se a milhares de empresários que transformaram incerteza em lucro com o poder da gestão inteligente.
            </p>
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              Quero Otimizar Meu Negócio Agora
              <ArrowRight className="ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-gray-300">
              <span className="flex items-center"><CheckCircle className="w-5 h-5 text-green-400 mr-2" />Teste gratuito</span>
              <span className="flex items-center"><CheckCircle className="w-5 h-5 text-green-400 mr-2" />Sem compromisso</span>
              <span className="flex items-center"><CheckCircle className="w-5 h-5 text-green-400 mr-2" />Suporte especializado</span>
            </div>
          </MotionDiv>
        </div>
      </section>

      {/* Trust Indicators Footer */}
      <footer className="py-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-x-12 gap-y-4 text-sm text-gray-600">
            <span className="flex items-center"><Shield className="w-5 h-5 text-green-500 mr-2" />Certificação ISO 27001</span>
            <span className="flex items-center"><CheckCircle className="w-5 h-5 text-blue-500 mr-2" />Conformidade com LGPD</span>
            <span className="flex items-center"><Award className="w-5 h-5 text-purple-500 mr-2" />Prêmio Melhor ERP 2025</span>
            <span className="flex items-center"><Clock className="w-5 h-5 text-amber-500 mr-2" />99.9% de Uptime Garantido</span>
          </div>
        </div>
      </footer>

      {/* CSS para animação do Fundo Aurora */}
      <style jsx global>{`
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
      `}</style>
    </div>
  )
}