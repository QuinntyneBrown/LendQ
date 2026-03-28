import { APIRequestContext } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const API = `${BASE_URL}/api/v1`;

export class ApiClient {
  constructor(private request: APIRequestContext) {}

  async login(email: string, password: string) {
    const res = await this.request.post(`${API}/auth/login`, {
      data: { email, password },
    });
    return res.json();
  }

  async getMe(token: string) {
    const res = await this.request.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  async createUser(token: string, data: Record<string, unknown>) {
    const res = await this.request.post(`${API}/users`, {
      headers: { Authorization: `Bearer ${token}` },
      data,
    });
    return res.json();
  }

  async createLoan(token: string, data: Record<string, unknown>) {
    const res = await this.request.post(`${API}/loans`, {
      headers: { Authorization: `Bearer ${token}` },
      data,
    });
    return res.json();
  }

  async getSchedule(token: string, loanId: string) {
    const res = await this.request.get(`${API}/loans/${loanId}/schedule`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  async recordPayment(
    token: string,
    loanId: string,
    data: Record<string, unknown>,
  ) {
    const res = await this.request.post(`${API}/loans/${loanId}/payments`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": `e2e-${loanId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      },
      data,
    });
    return res.json();
  }

  async reschedulePayment(
    token: string,
    paymentId: string,
    data: Record<string, unknown>,
  ) {
    const res = await this.request.put(`${API}/payments/${paymentId}/reschedule`, {
      headers: { Authorization: `Bearer ${token}` },
      data,
    });
    return res.json();
  }

  async pausePayments(
    token: string,
    loanId: string,
    paymentIds: string[],
    reason?: string,
  ) {
    const res = await this.request.post(`${API}/loans/${loanId}/pause`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        payment_ids: paymentIds,
        ...(reason ? { reason } : {}),
      },
    });
    return res.json();
  }

  async getNotifications(token: string) {
    const res = await this.request.get(`${API}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  async markAllNotificationsRead(token: string) {
    const res = await this.request.post(`${API}/notifications/read-all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.status();
  }
}
