// Delivery date + time slot: shared by the order form, "My orders" and the admin panel.
// The database checks the same rules again (supabase/orders-delivery-time.sql).

// PLACEHOLDER hours: change them here AND in supabase/orders-delivery-time.sql.
// `endHour` = when the slot is over, so it can't be picked any more today.
export const DELIVERY_SLOTS = [
  { value: "morning", name: "Morning", time: "9:00–12:00", endHour: 12 },
  { value: "afternoon", name: "Afternoon", time: "12:00–17:00", endHour: 17 },
  { value: "evening", name: "Evening", time: "17:00–21:00", endHour: 21 },
];

// Deliveries end with the last slot: after that, "today" can't be chosen any more.
const LAST_DELIVERY_HOUR = 21;

// The shop works on London time, wherever the customer's computer is.
// Returns today's date as "YYYY-MM-DD" (the format of <input type="date">) and the hour.
function londonNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  return { today: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Earliest and latest date the customer may pick: today (or tomorrow once today's
// deliveries are over) up to a year ahead.
export function deliveryDateRange() {
  const { today, hour } = londonNow();
  return {
    min: hour >= LAST_DELIVERY_HOUR ? addDays(today, 1) : today,
    max: addDays(today, 365),
  };
}

// Slots that can still be delivered on this date (today: only the ones not over yet)
export function slotsForDate(isoDate) {
  const { today, hour } = londonNow();
  if (isoDate !== today) return DELIVERY_SLOTS;
  return DELIVERY_SLOTS.filter((slot) => slot.endHour > hour);
}

export const slotLabel = (slot) => `${slot.name} (${slot.time})`;

export const formatDeliveryDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// e.g. "Tue, 24 Nov 2026 · Morning (9:00–12:00)". Empty date -> null.
export function formatDelivery(isoDate, slotValue) {
  if (!isoDate) return null;
  const slot = DELIVERY_SLOTS.find((s) => s.value === slotValue);
  return slot ? `${formatDeliveryDate(isoDate)} · ${slotLabel(slot)}` : `${formatDeliveryDate(isoDate)} · any time`;
}
