import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Initialize Supabase and Stripe clients from environment variables.
const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
  // It's good practice to specify the API version.
  apiVersion: '2024-06-20',
});

// Helper function to create standardized JSON responses with CORS headers.
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // For 204 No Content (OPTIONS pre-flight), don't include a body.
  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    // Handle CORS pre-flight requests.
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { price_id, success_url, cancel_url, mode } = await req.json();

    // Validate incoming request parameters.
    const validationError = validateParameters(
      { price_id, success_url, cancel_url, mode },
      {
        cancel_url: 'string',
        price_id: 'string',
        success_url: 'string',
        mode: { values: ['payment', 'subscription'] },
      },
    );

    if (validationError) {
      return corsResponse({ error: validationError }, 400);
    }

    // Authenticate the user with the provided token.
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }
    
    // --- START: MODIFIED LOGIC ---

    // Attempt to retrieve the customer mapping from the database.
    const { data: customerMapping } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    let customerId: string | undefined;

    // If a customer mapping exists, verify the customer ID with Stripe.
    if (customerMapping?.customer_id) {
        try {
            const existingCustomer = await stripe.customers.retrieve(customerMapping.customer_id);
            // If the customer is retrieved and not marked as deleted, it's valid.
            if (existingCustomer && !existingCustomer.deleted) {
                customerId = existingCustomer.id;
                console.log(`Verified existing Stripe customer ${customerId} for user ${user.id}`);
            } else {
                // The customer was deleted in Stripe. We should treat them as a new customer.
                console.warn(`Stripe customer ${customerMapping.customer_id} found in DB but deleted in Stripe. Creating a new one.`);
                // As a self-healing mechanism, delete the stale record from your database.
                await supabase.from('stripe_customers').delete().eq('user_id', user.id);
            }
        } catch (error) {
            // If retrieval fails, the customer ID is invalid.
            console.warn(`Failed to retrieve Stripe customer ${customerMapping.customer_id}. It might have been deleted. Creating a new one.`, error.message);
            // Also delete the stale record here.
            await supabase.from('stripe_customers').delete().eq('user_id', user.id);
        }
    }

    // If we don't have a verified customer ID, create a new customer.
    if (!customerId) {
        const newCustomer = await stripe.customers.create({
            email: user.email,
            metadata: { userId: user.id },
        });
        customerId = newCustomer.id;
        console.log(`Created new Stripe customer ${customerId} for user ${user.id}`);

        // Save the new mapping to the database.
        const { error: insertError } = await supabase.from('stripe_customers').insert({
            user_id: user.id,
            customer_id: customerId,
        });

        if (insertError) {
            console.error('Failed to save new customer mapping to the database', insertError);
            // Clean up the newly created Stripe customer to avoid orphaned data.
            await stripe.customers.del(customerId);
            return corsResponse({ error: 'Failed to create customer mapping in database' }, 500);
        }
    }

    // --- END: MODIFIED LOGIC ---

    // For subscription mode, ensure a subscription record exists.
    if (mode === 'subscription') {
      const { data: subscription } = await supabase
        .from('stripe_subscriptions')
        .select('status')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (!subscription) {
        const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
          customer_id: customerId,
          status: 'not_started',
        });

        if (createSubscriptionError) {
          console.error('Failed to create subscription record for customer', createSubscriptionError);
          return corsResponse({ error: 'Failed to create subscription record' }, 500);
        }
      }
    }

    // Create a Stripe Checkout Session.
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      mode,
      success_url,
      cancel_url,
    });

    console.log(`Created checkout session ${session.id} for customer ${customerId}`);
    return corsResponse({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error(`Checkout session creation failed: ${error.message}`);
    return corsResponse({ error: 'Internal Server Error' }, 500);
  }
});

// --- Helper function for parameter validation ---
type ExpectedType = 'string' | { values: string[] };
type Expectations<T> = { [K in keyof T]: ExpectedType };

function validateParameters<T extends Record<string, any>>(values: T, expected: Expectations<T>): string | undefined {
  for (const parameter in values) {
    const expectation = expected[parameter];
    const value = values[parameter];

    if (expectation === 'string') {
      if (value == null) {
        return `Missing required parameter ${parameter}`;
      }
      if (typeof value !== 'string' || value.trim() === '') {
        return `Expected parameter ${parameter} to be a non-empty string`;
      }
    } else {
      if (!expectation.values.includes(value)) {
        return `Expected parameter ${parameter} to be one of: ${expectation.values.join(', ')}`;
      }
    }
  }
  return undefined;
}
