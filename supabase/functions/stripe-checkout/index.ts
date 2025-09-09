import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2024-06-20',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { price_id, mode = 'subscription', success_url, cancel_url } = await req.json();

    if (!price_id) {
      return new Response(
        JSON.stringify({ error: 'Missing price_id parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ error: 'Missing success_url or cancel_url parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the price exists in Stripe
    let price;
    try {
      price = await stripe.prices.retrieve(price_id);
    } catch (error) {
      console.error('Price not found:', error);
      return new Response(
        JSON.stringify({ error: `No such price: '${price_id}'` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get or create Stripe customer
    let customerId;
    
    // Check if customer already exists in our database
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingCustomer?.customer_id) {
      // Verify the customer still exists in Stripe
      try {
        await stripe.customers.retrieve(existingCustomer.customer_id);
        customerId = existingCustomer.customer_id;
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          // Customer was deleted in Stripe, mark as deleted in our database
          await supabase
            .from('stripe_customers')
            .update({ deleted_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('customer_id', existingCustomer.customer_id);
          
          // Set customerId to null so we create a new one below
          customerId = null;
        } else {
          throw error;
        }
      }
    }

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;

      // Save customer mapping to database
      const { error: customerError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          customer_id: customerId,
        });

      if (customerError) {
        console.error('Error saving customer:', customerError);
        // Continue anyway, as the customer exists in Stripe
      }

      // Create subscription record if mode is subscription
      if (mode === 'subscription') {
        const { error: subscriptionError } = await supabase
          .from('stripe_subscriptions')
          .insert({
            customer_id: customerId,
            status: 'not_started',
          });

        if (subscriptionError) {
          console.error('Error creating subscription record:', subscriptionError);
          // Continue anyway
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode,
      success_url,
      cancel_url,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      locale: 'pt-BR',
    });

    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});