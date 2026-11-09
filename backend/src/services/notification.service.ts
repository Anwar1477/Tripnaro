import { Notification } from '../models/Engagement';
import { User } from '../models/User';
import { emailService, type EmailMessage } from './email.service';

interface NotifyInput {
  title: string;
  message: string;
  type?: 'booking' | 'payment' | 'visa' | 'promo' | 'system';
  link?: string;
  email?: Omit<EmailMessage, 'to'>;
}

/** Creates an in-app notification and, if the user allows it, sends an email. */
export async function notifyUser(userId: string, input: NotifyInput): Promise<void> {
  await Notification.create({
    user: userId,
    title: input.title,
    message: input.message,
    type: input.type ?? 'system',
    link: input.link,
  });

  if (!input.email) return;
  const user = await User.findById(userId).select('email notificationPrefs');
  if (!user) return;
  const prefs = user.notificationPrefs;
  const isTransactional = input.type === 'booking' || input.type === 'payment' || input.type === 'visa';
  const allowed = isTransactional ? prefs?.bookingUpdates !== false : prefs?.email !== false;
  if (allowed) await emailService.send({ to: user.email, ...input.email });
}
