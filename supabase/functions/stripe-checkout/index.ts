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

    // ROBUST CUSTOMER HANDLING LOGIC
    let validCustomerId: string;
    
    try {
      console.log('Starting customer validation for user:', user.id);
      
      // Step 1: Check if user has a customer record in our database
      const { data: existingCustomerRecord, error: dbError } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .eq('user_id', user.id)
        .eq('deleted_at', null)
        .maybeSingle();

      if (dbError) {
        console.error('Database query error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      let shouldCreateNewCustomer = false;
      let existingStripeCustomer: Stripe.Customer | null = null;

      if (existingCustomerRecord?.customer_id) {
        console.log('Found existing customer record:', existingCustomerRecord.customer_id);
        
        // Step 2: Validate that the customer still exists in Stripe
        try {
          const stripeCustomer = await stripe.customers.retrieve(existingCustomerRecord.customer_id);
          
          // Check if customer is deleted or invalid
          if (stripeCustomer.deleted) {
            console.log('Customer is deleted in Stripe, will create new one');
            shouldCreateNewCustomer = true;
          } else {
            console.log('Customer is valid in Stripe');
            existingStripeCustomer = stripeCustomer as Stripe.Customer;
            validCustomerId = existingCustomerRecord.customer_id;
          }
          
        } catch (stripeError: any) {
          console.log('Customer validation failed in Stripe:', stripeError.message);
          
          // If customer doesn't exist in Stripe (any error), create a new one
          if (stripeError.code === 'resource_missing' || 
              stripeError.message?.includes('No such customer') ||
              stripeError.type === 'invalid_request_error') {
            console.log('Customer not found in Stripe, will create new one');
            shouldCreateNewCustomer = true;
          } else {
            // For other Stripe errors, throw to handle properly
            throw stripeError;
          }
        }
      } else {
        console.log('No customer record found in database, will create new one');
        shouldCreateNewCustomer = true;
      }

      // Step 3: Create new customer if needed
      if (shouldCreateNewCustomer) {
        console.log('Creating new Stripe customer for user:', user.id);
        
        const newCustomer = await stripe.customers.create({
          email: user.email,
          name: user.user_metadata?.full_name || undefined,
          metadata: {
            user_id: user.id,
            created_from: 'checkout_session',
            timestamp: new Date().toISOString(),
          },
        });
        
        validCustomerId = newCustomer.id;
        console.log('New Stripe customer created:', validCustomerId);

        // Step 4: CRITICAL - Update database with new customer ID and verify success
        const { data: customerRecord, error: upsertError } = await supabase
          .from('stripe_customers')
          .upsert({
            user_id: user.id,
            customer_id: validCustomerId,
            updated_at: new Date().toISOString(),
            deleted_at: null,
          }, {
            onConflict: 'user_id'
          })
          .select()
          .single();

        if (upsertError) {
          console.error('CRITICAL: Failed to update customer record in database:', upsertError);
          throw new Error(`Database update failed: ${upsertError.message}. Cannot proceed with checkout without valid customer linkage.`);
        }

        if (!customerRecord || customerRecord.customer_id !== validCustomerId) {
          console.error('CRITICAL: Customer record validation failed after upsert');
          throw new Error('Customer record validation failed. Database may be inconsistent.');
        }

        console.log('Customer record successfully updated in database:', customerRecord);
      } else {
        // Step 4b: For existing customers, verify the database record is still valid
        const { data: verifyRecord, error: verifyError } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user.id)
          .eq('customer_id', validCustomerId)
          .eq('deleted_at', null)
          .maybeSingle();

        if (verifyError) {
          console.error('Failed to verify existing customer record:', verifyError);
          throw new Error(`Customer verification failed: ${verifyError.message}`);
        }

        if (!verifyRecord) {
          console.error('CRITICAL: Customer record not found in database after validation');
          throw new Error('Customer record missing from database. Data inconsistency detected.');
        } else {
          console.log('Existing customer record verified in database');
        }
      }

      // Step 5: Final validation - ensure we have a valid customer ID
      if (!validCustomerId) {
        throw new Error('Failed to obtain valid customer ID');
      }

      console.log('Using customer ID for checkout:', validCustomerId);

    } catch (error: any) {
      console.error('Customer handling failed:', error);
      return new Response(
        JSON.stringify({ 
          error: `Customer handling failed: ${error.message}` 
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
        console.log('Initializing subscription record for customer:', validCustomerId);
        
        const { data: subscriptionRecord, error: subscriptionError } = await supabase
          .from('stripe_subscriptions')
          .upsert({
            customer_id: validCustomerId,
            status: 'not_started',
            updated_at: new Date().toISOString(),
            deleted_at: null,
          }, {
            onConflict: 'customer_id'
          })
          .select()
          .single();

        if (subscriptionError) {
          console.error('CRITICAL: Subscription record initialization failed:', subscriptionError);
          throw new Error(`Subscription initialization failed: ${subscriptionError.message}`);
        }

        if (!subscriptionRecord) {
          console.error('CRITICAL: Subscription record not created');
          throw new Error('Subscription record creation failed');
        }
        
        console.log('Subscription record initialized successfully:', subscriptionRecord.customer_id);
      } catch (error) {
        console.error('CRITICAL: Subscription initialization error:', error);
        throw error;
      }
    }

    // Create checkout session with validated customer
    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: validCustomerId,
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
          customer_validation: 'robust_v2',
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
      
      console.log('Checkout session created successfully:', session.id, 'with customer:', validCustomerId);

      return new Response(
        JSON.stringify({ 
          sessionId: session.id, 
          url: session.url,
          customerId: validCustomerId,
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