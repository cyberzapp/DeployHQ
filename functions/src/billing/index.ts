import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { db, verifyWorkspaceRole } from '../auth/permissions';

const razorpayKeyId = defineSecret('RAZORPAY_KEY_ID');
const razorpayKeySecret = defineSecret('RAZORPAY_KEY_SECRET');
const razorpayWebhookSecret = defineSecret('RAZORPAY_WEBHOOK_SECRET');

const PLAN_PRICES_INR_PAISE: Record<string, { monthly: number; annual: number }> = {
  pro: { monthly: 240000, annual: 2400000 }, // ₹2,400/mo
  team: { monthly: 790000, annual: 7900000 }, // ₹7,900/mo
};

/**
 * Creates a Razorpay Order for upgrading workspace subscription.
 * If Razorpay secrets are not configured in the environment, returns a clearly flagged
 * `mode: 'test_unconfigured'` response so the UI can run the labelled Billing Test Mode flow.
 */
export const createRazorpaySubscriptionOrder = onCall(
  { secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request) => {
    const { workspaceId, plan, billingCycle = 'monthly' } = request.data || {};
    await verifyWorkspaceRole(workspaceId, request.auth?.uid, ['owner']);

    if (!['pro', 'team'].includes(plan)) {
      throw new HttpsError('invalid-argument', 'Selected plan must be pro or team.');
    }

    const keyId = razorpayKeyId.value() || process.env.RAZORPAY_KEY_ID;
    const keySecret = razorpayKeySecret.value() || process.env.RAZORPAY_KEY_SECRET;
    const amount =
      billingCycle === 'annual'
        ? PLAN_PRICES_INR_PAISE[plan].annual
        : PLAN_PRICES_INR_PAISE[plan].monthly;

    if (!keyId || !keySecret) {
      const testOrderId = `order_test_${Date.now()}`;
      await db.doc(`workspaces/${workspaceId}/subscriptions/current`).set(
        {
          id: 'current',
          workspaceId,
          requestedPlan: plan,
          billingCycle,
          status: 'checkout_requested',
          checkoutSessionId: testOrderId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        mode: 'billing_test_mode',
        orderId: testOrderId,
        amount,
        currency: 'INR',
        plan,
        billingCycle,
      };
    }

    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: `dhq_${workspaceId.slice(0, 10)}_${Date.now()}`,
        notes: {
          workspaceId,
          plan,
          billingCycle,
          uid: request.auth!.uid,
        },
      }),
    });

    if (!orderRes.ok) {
      throw new HttpsError('unavailable', 'Failed to create order with Razorpay API.');
    }

    const orderJson = (await orderRes.json()) as { id: string; amount: number; currency: string };

    await db.doc(`workspaces/${workspaceId}/subscriptions/current`).set(
      {
        id: 'current',
        workspaceId,
        requestedPlan: plan,
        billingCycle,
        status: 'checkout_requested',
        checkoutSessionId: orderJson.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      mode: 'live',
      keyId,
      orderId: orderJson.id,
      amount: orderJson.amount,
      currency: orderJson.currency,
      plan,
      billingCycle,
    };
  }
);

/**
 * Verifies Razorpay checkout signature server-side (or processes explicit Billing Test Mode confirmation)
 * and updates the workspace plan + subscription document via Admin SDK.
 */
export const verifyRazorpayPayment = onCall(
  { secrets: [razorpayKeySecret] },
  async (request) => {
    const {
      workspaceId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      plan,
      billingCycle = 'monthly',
      isTestModeSimulation = false,
    } = request.data || {};

    await verifyWorkspaceRole(workspaceId, request.auth?.uid, ['owner']);

    const keySecret = razorpayKeySecret.value() || process.env.RAZORPAY_KEY_SECRET;

    if (!isTestModeSimulation) {
      if (!keySecret || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new HttpsError('invalid-argument', 'Missing Razorpay payment verification parameters.');
      }

      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        throw new HttpsError('permission-denied', 'Razorpay payment signature verification failed.');
      }
    }

    const now = Date.now();
    const periodEndMs =
      billingCycle === 'annual' ? now + 365 * 24 * 3600 * 1000 : now + 30 * 24 * 3600 * 1000;

    const batch = db.batch();
    const subRef = db.doc(`workspaces/${workspaceId}/subscriptions/current`);
    batch.set(
      subRef,
      {
        id: 'current',
        workspaceId,
        plan,
        billingCycle,
        status: 'active',
        subscriptionId: razorpayPaymentId || `pay_test_${Date.now()}`,
        checkoutSessionId: razorpayOrderId || `order_test_${Date.now()}`,
        cancelAtPeriodEnd: false,
        currentPeriodStart: admin.firestore.Timestamp.fromMillis(now),
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(periodEndMs),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const workspaceRef = db.doc(`workspaces/${workspaceId}`);
    batch.update(workspaceRef, {
      plan,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const activityRef = db.collection(`workspaces/${workspaceId}/activity`).doc();
    batch.set(activityRef, {
      action: 'subscription_upgraded',
      type: 'billing',
      description: `Workspace upgraded to ${String(plan).toUpperCase()} plan (${
        isTestModeSimulation ? 'Billing Test Mode' : 'Razorpay Verified'
      })`,
      actorId: request.auth!.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return {
      verified: true,
      plan,
      status: 'active',
      testMode: Boolean(isTestModeSimulation),
    };
  }
);

/**
 * Razorpay Webhook endpoint with HMAC SHA-256 signature verification.
 */
export const razorpayWebhook = onRequest(
  { secrets: [razorpayWebhookSecret] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const eventId = req.headers['x-razorpay-event-id'] as string | undefined;
    const secret = razorpayWebhookSecret.value() || process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret || !signature) {
      res.status(401).json({ error: 'Missing Razorpay webhook signature' });
      return;
    }

    const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
    if (expected !== signature) {
      res.status(401).json({ error: 'Invalid Razorpay signature' });
      return;
    }

    if (eventId) {
      const dedupRef = db.doc(`webhookDeliveries/razorpay_${eventId}`);
      if ((await dedupRef.get()).exists) {
        res.status(200).json({ status: 'duplicate_ignored' });
        return;
      }
      await dedupRef.set({
        provider: 'razorpay',
        eventId,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const event = req.body?.event;
    const notes = req.body?.payload?.payment?.entity?.notes || {};
    if (event === 'payment.captured' && notes.workspaceId && notes.plan) {
      await db.doc(`workspaces/${notes.workspaceId}/subscriptions/current`).set(
        {
          id: 'current',
          workspaceId: notes.workspaceId,
          plan: notes.plan,
          status: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      await db.doc(`workspaces/${notes.workspaceId}`).update({
        plan: notes.plan,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(200).json({ status: 'ok' });
  }
);

