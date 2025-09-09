import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!, 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2024-06-20',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  price_id: string;
  mode?: 'subscription' | 'payment';
  success_url: string;
  cancel_url: string;
}

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

    // Validate authorization
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

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse and validate request body
    let requestData: CheckoutRequest;
    try {
      requestData = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { price_id, mode = 'subscription', success_url, cancel_url } = requestData;

    // Validate required parameters
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
    let price: Stripe.Price;
    try {
      price = await stripe.prices.retrieve(price_id);
      console.log('Price retrieved successfully:', price.id);
    } catch (error: any) {
      console.error('Price retrieval failed:', error);
      return new Response(
        JSON.stringify({ 
          error: `Price not found: ${price_id}. Please verify the price ID exists in your Stripe account.` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle Stripe customer - always create fresh customer for production reliability
    let customerId: string;
    
    try {
      // Always create a new customer for each checkout to avoid stale customer issues
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          created_from: 'checkout_session',
          timestamp: new Date().toISOString(),
        },
      });
      
      customerId = customer.id;
      console.log('New Stripe customer created:', customerId);

      // Update or create customer record in database
      const { error: customerError } = await supabase
        .from('stripe_customers')
        .upsert({
          user_id: user.id,
          customer_id: customerId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (customerError) {
        console.error('Database customer update failed:', customerError);
        // Continue anyway - the Stripe customer exists and checkout can proceed
      }

    } catch (error: any) {
      console.error('Customer creation failed:', error);
      return new Response(
        JSON.stringify({ 
          error: `Failed to create customer: ${error.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize subscription record for subscription mode
    if (mode === 'subscription') {
      try {
        const { error: subscriptionError } = await supabase
          .from('stripe_subscriptions')
          .upsert({
            customer_id: customerId,
            status: 'not_started',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'customer_id'
          });

        if (subscriptionError) {
          console.error('Subscription record creation failed:', subscriptionError);
          // Continue anyway - this is not critical for checkout
        }
      } catch (error) {
        console.error('Subscription initialization error:', error);
        // Continue anyway
      }
    }

    // Create checkout session
    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
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
        metadata: {
          user_id: user.id,
          price_id: price_id,
        },
      };

      // Add subscription-specific parameters
      if (mode === 'subscription') {
        sessionParams.subscription_data = {
          metadata: {
            user_id: user.id,
          },
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      
      console.log('Checkout session created successfully:', session.id);

      return new Response(
        JSON.stringify({ 
          sessionId: session.id, 
          url: session.url,
          customerId: customerId,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (error: any) {
      console.error('Checkout session creation failed:', error);
      return new Response(
        JSON.stringify({ 
          error: `Failed to create checkout session: ${error.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error: any) {
    console.error('Unexpected error in stripe-checkout:', error);
    return new Response(
      JSON.stringify({ 
        error: `Internal server error: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});