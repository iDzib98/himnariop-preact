import type { WorshipOrder } from '../types/orden';

const ORDERS_KEY = 'ordenes_culto';

let returnToValue: string | null = null;

export function getOrders(): WorshipOrder[] {
  try {
    const stored = localStorage.getItem(ORDERS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getOrder(id: string): WorshipOrder | undefined {
  return getOrders().find(o => o.id === id);
}

export function saveOrder(order: WorshipOrder): void {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === order.id);
  if (idx >= 0) {
    orders[idx] = order;
  } else {
    orders.push(order);
  }
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function deleteOrder(id: string): void {
  const orders = getOrders().filter(o => o.id !== id);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function setReturnTo(path: string | null): void {
  returnToValue = path;
}

export function getReturnTo(): string | null {
  return returnToValue;
}
