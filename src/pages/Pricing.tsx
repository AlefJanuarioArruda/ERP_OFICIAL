import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// ================================
// 🔑 CHAVES DIRETO AQUI (⚠️ não usar em produção)
const STRIPE_PUBLIC_KEY = "pk_test_1234567890abcdef"; // troque pela sua publishable key
const STRIPE_SECRET_KEY = "sk_test_1234567890abcdef"; // troque pela sua secret key
const SUPABASE_URL = "https://xxxxx.supabase.co";      // troque pela sua URL
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // troque pela sua anon key
// ================================

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
const stripeServer = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Produtos Stripe
const stripeProducts = [
  {
    id: "plano-mensal",
    priceId: "price_1QdVGJRyxxxxxx", // ⚠️ coloque o seu Price ID
    name: "Plano Mensal",
    description: "Assinatura mensal com todos os recursos",
    price: 2990,
    currency: "BRL",
    interval: "month",
    features: ["Suporte completo", "Acesso total ao sistema"],
    mode: "subscription",
  },
  {
    id: "plano-anual",
    priceId: "price_1QdVGJRyyyyyy", // ⚠️ coloque o seu Price ID
    name: "Plano Anual",
    description: "Assinatura anual com desconto",
    price: 29900,
    currency: "BRL",
    interval: "year",
    features: ["Suporte premium", "2 meses grátis"],
    mode: "subscription",
  },
];

// Formatador de preço
const formatPrice = (amount: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount / 100);

const Pricing: React.FC = () => {
  const [loading, setLoading] = useState(false);

  // 👉 Cria ou recupera o cliente no Supabase + Stripe
  const getOrCreateCustomer = async (userId: string, email: string) => {
    const { data, error } = await supabase
      .from("stripe_customers")
      .select("customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw new Error("Erro ao consultar Supabase");

    if (data?.customer_id) return data.customer_id;

    // cria customer direto no Stripe (aqui tá inseguro pq usa secret no front)
    const customer = await stripeServer.customers.create({ email, metadata: { userId } });

    await supabase.from("stripe_customers").insert([{ user_id: userId, customer_id: customer.id }]);

    return customer.id;
  };

  // 👉 Assinar
  const handleSubscribe = async (priceId: string) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const customerId = await getOrCreateCustomer(user.id, user.email!);

      // cria sessão de checkout direto
      const session = await stripeServer.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: window.location.origin + "/sucesso",
        cancel_url: window.location.origin + "/cancelado",
      });

      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId: session.id });
    } catch (err: any) {
      console.error("Erro ao redirecionar para checkout:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-6">Escolha seu plano</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stripeProducts.map((p) => (
          <div key={p.id} className="border p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-2">{p.name}</h2>
            <p className="text-gray-600 mb-4">{p.description}</p>
            <p className="text-2xl font-bold mb-4">
              {formatPrice(p.price)} / {p.interval === "month" ? "mês" : "ano"}
            </p>
            <ul className="mb-4">
              {p.features.map((f, i) => (
                <li key={i} className="text-sm text-gray-700">✔ {f}</li>
              ))}
            </ul>
            <button
              disabled={loading}
              onClick={() => handleSubscribe(p.priceId)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Assinar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
