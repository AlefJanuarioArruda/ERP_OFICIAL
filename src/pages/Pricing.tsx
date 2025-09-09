import React, { useState } from "react";
import { stripeProducts, formatPrice, createCheckoutSession } from "../stripe-config";
import { supabase } from "../lib/supabase";

const Pricing: React.FC = () => {
  const [loading, setLoading] = useState(false);

  // 👉 Assinar
  const handleSubscribe = async (priceId: string) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const checkoutData = await createCheckoutSession(priceId, accessToken);
      
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        throw new Error("URL de checkout não recebida");
      }
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
              {formatPrice(p.price, p.currency)} / {p.interval === "month" ? "mês" : "ano"}
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
