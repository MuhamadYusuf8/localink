import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface NotifPayload {
  userId: string;
  type: 'new_order' | 'new_message' | 'review' | 'promotion';
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

const internalApiBase =
  process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';

async function postInternal(path: string, body: Record<string, unknown>) {
  await fetch(`${internalApiBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function sendNotification(payload: NotifPayload) {
  const { data: prefs } = await supabase
    .from('farmer_profiles')
    .select(
      'notif_new_order, notif_new_message, notif_review, notif_promotion, notif_email, notif_whatsapp, email, whatsapp',
    )
    .eq('user_id', payload.userId)
    .single();

  if (!prefs) {
    return;
  }

  const prefMap = {
    new_order: prefs.notif_new_order,
    new_message: prefs.notif_new_message,
    review: prefs.notif_review,
    promotion: prefs.notif_promotion,
  };

  if (!prefMap[payload.type]) {
    return;
  }

  await supabase.from('notification_logs').insert({
    user_id: payload.userId,
    type: payload.type,
    channel: 'in_app',
    title: payload.title,
    message: payload.message,
    metadata: payload.metadata ?? {},
    status: 'sent',
  });

  if (prefs.notif_email && prefs.email) {
    await postInternal('/api/notifications/email', { to: prefs.email, ...payload });
  }

  if (prefs.notif_whatsapp && prefs.whatsapp) {
    await postInternal('/api/notifications/whatsapp', {
      phone: prefs.whatsapp,
      message: `${payload.title}\n\n${payload.message}`,
    });
  }
}
