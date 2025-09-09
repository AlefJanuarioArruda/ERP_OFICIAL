
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

    // Handle Stripe customer creation/retrieval
    let customerId: string;
    
    // First, check if we have an existing customer record
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingCustomer?.customer_id) {
      // We have a customer ID, let's verify it exists in Stripe
      try {
        await stripe.customers.retrieve(existingCustomer.customer_id);
        customerId = existingCustomer.customer_id;
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          // Customer doesn't exist in Stripe anymore, create a new one
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: {
              user_id: user.id,
            },
          });
          customerId = customer.id;
          
          // Update the database record with the new customer ID
          await supabase
            .from('stripe_customers')
            .update({
              customer_id: customerId,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .is('deleted_at', null);
        } else {
          throw error;
        }
      }
    } else {
      // No existing customer record, create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
      
      // Save the new customer to our database
      await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          customer_id: customerId,
        });
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
      }
    }

    try {
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
      console.error('Error creating checkout session:', error);
      return new Response(
        JSON.stringify({ error: `Failed to create checkout session: ${error.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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
