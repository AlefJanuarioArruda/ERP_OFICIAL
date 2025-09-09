import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
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
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
};

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204, 
        headers: corsHeaders 
      });
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

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('Missing Stripe signature');
      return new Response(
        JSON.stringify({ error: 'Missing Stripe signature' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body, 
        signature, 
        stripeWebhookSecret
      );
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing webhook event:', event.type);

    // Process the event asynchronously
    EdgeRuntime.waitUntil(processWebhookEvent(event));

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processWebhookEvent(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error processing ${event.type}:`, error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout completion:', session.id);
    
    const customerId = session.customer as string;
    const mode = session.mode;

    if (mode === 'subscription') {
      // For subscriptions, sync the subscription data
      await syncCustomerSubscription(customerId);
    } else if (mode === 'payment') {
      // For one-time payments, record the order
      await recordOrder(session);
    }

  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    console.log('Processing subscription change:', subscription.id);
    await syncCustomerSubscription(subscription.customer as string);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Processing payment success:', invoice.id);
    
    if (invoice.subscription) {
      // Update subscription status
      await syncCustomerSubscription(invoice.customer as string);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('Processing payment failure:', invoice.id);
    
    if (invoice.subscription) {
      // Update subscription status
      await syncCustomerSubscription(invoice.customer as string);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function syncCustomerSubscription(customerId: string) {
  try {
    // Fetch the latest subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      console.log('No subscriptions found for customer:', customerId);
      
      // Update to no active subscription
      const { error } = await supabase
        .from('stripe_subscriptions')
        .upsert({
          customer_id: customerId,
          subscription_id: null,
          price_id: null,
          status: 'not_started',
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
          payment_method_brand: null,
          payment_method_last4: null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'customer_id'
        });

      if (error) {
        console.error('Error updating subscription to not_started:', error);
      }
      return;
    }

    const subscription = subscriptions.data[0];
    console.log('Syncing subscription:', subscription.id, 'Status:', subscription.status);

    // Prepare payment method data
    let paymentMethodData = {
      payment_method_brand: null as string | null,
      payment_method_last4: null as string | null,
    };

    if (subscription.default_payment_method && 
        typeof subscription.default_payment_method !== 'string') {
      const paymentMethod = subscription.default_payment_method as Stripe.PaymentMethod;
      if (paymentMethod.card) {
        paymentMethodData = {
          payment_method_brand: paymentMethod.card.brand,
          payment_method_last4: paymentMethod.card.last4,
        };
      }
    }

    // Update subscription in database
    const { error: syncError } = await supabase
      .from('stripe_subscriptions')
      .upsert({
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0]?.price?.id || null,
        status: subscription.status as any,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...paymentMethodData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'customer_id'
      });

    if (syncError) {
      console.error('Error syncing subscription:', syncError);
      throw new Error(`Failed to sync subscription: ${syncError.message}`);
    }

    console.log('Subscription synced successfully for customer:', customerId);

  } catch (error: any) {
    console.error('Error in syncCustomerSubscription:', error);
    throw error;
  }
}

async function recordOrder(session: Stripe.Checkout.Session) {
  try {
    console.log('Recording order for session:', session.id);

    const { error: orderError } = await supabase
      .from('stripe_orders')
      .insert({
        checkout_session_id: session.id,
        payment_intent_id: session.payment_intent as string,
        customer_id: session.customer as string,
        amount_subtotal: session.amount_subtotal || 0,
        amount_total: session.amount_total || 0,
        currency: session.currency || 'brl',
        payment_status: session.payment_status,
        status: 'completed',
      });

    if (orderError) {
      console.error('Error recording order:', orderError);
      throw new Error(`Failed to record order: ${orderError.message}`);
    }

    console.log('Order recorded successfully for session:', session.id);

  } catch (error: any) {
    console.error('Error in recordOrder:', error);
    throw error;
  }
}