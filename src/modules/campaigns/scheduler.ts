function randomDelayMs(minMinutes: number, maxMinutes: number): number {
  const min = minMinutes * 60 * 1000;
  const max = maxMinutes * 60 * 1000;
  return min + Math.floor(Math.random() * (max - min + 1));
}

function nextBusinessMorning(from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function clampToBusinessHours(date: Date): Date {
  const d = new Date(date);
  const hour = d.getHours();
  if (hour < 9) {
    d.setHours(9, Math.floor(Math.random() * 30), 0, 0);
  } else if (hour >= 18) {
    return nextBusinessMorning(d);
  }
  return d;
}

export function buildSendSchedule(input: {
  emailIds: string[];
  dailyLimit: number;
  minDelayMinutes: number;
  maxDelayMinutes: number;
  startAt?: Date;
}): Array<{ emailId: string; scheduledAt: Date }> {
  const slots: Array<{ emailId: string; scheduledAt: Date }> = [];
  let cursor = clampToBusinessHours(input.startAt ?? new Date());
  let sentToday = 0;

  for (const emailId of input.emailIds) {
    if (sentToday >= input.dailyLimit) {
      cursor = nextBusinessMorning(cursor);
      sentToday = 0;
    }

    cursor = new Date(cursor.getTime() + randomDelayMs(1, 3));
    slots.push({ emailId, scheduledAt: new Date(cursor) });
    sentToday += 1;
    cursor = new Date(
      cursor.getTime() +
        randomDelayMs(input.minDelayMinutes, input.maxDelayMinutes)
    );
  }

  return slots;
}

export function canSendNow(
  lastSentAt: Date | null,
  minDelayMinutes: number,
  maxDelayMinutes: number
): boolean {
  if (!lastSentAt) return true;
  const elapsed = Date.now() - lastSentAt.getTime();
  const minWait = minDelayMinutes * 60 * 1000;
  return elapsed >= minWait;
}
