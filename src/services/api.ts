import { ChangeRequest, EmailNotificationLog, UserProfile, Department, TemporaryApproverDelegation, ItDirectModifyPayload } from '../types';

const API_BASE = '/api';

export interface DbStatusResponse {
  connected: boolean;
  message: string;
  config?: {
    host?: string;
    port?: number;
    user?: string;
    database?: string;
  };
}

export const api = {
  // DB Connection status check
  async getDbStatus(): Promise<DbStatusResponse> {
    try {
      const res = await fetch(`${API_BASE}/db/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      return {
        connected: false,
        message: err instanceof Error ? err.message : 'Database check unreachable',
      };
    }
  },

  async initializeSchema(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/db/initialize-schema`, { method: 'POST' });
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  // 1. User Management & Auth
  async registerUser(user: Partial<UserProfile>): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  async loginUser(email: string, password?: string): Promise<{ success: boolean; user?: UserProfile; message?: string; fallback?: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  async getUsers(): Promise<{ success: boolean; data?: UserProfile[]; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  async createUser(user: Partial<UserProfile>): Promise<{ success: boolean; data?: UserProfile; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  async updateUser(id: string, updates: Partial<UserProfile>): Promise<{ success: boolean; data?: UserProfile; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  async approveUser(id: string, details?: Partial<UserProfile>): Promise<{ success: boolean; verified?: boolean; database?: string; table?: string; data?: UserProfile; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/users/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details || {}),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          verified: false,
          message: data.message || `PostgreSQL rejected user approval (HTTP ${res.status})`,
        };
      }
      return data;
    } catch (err) {
      return {
        success: false,
        verified: false,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  },

  async requestPasswordResetOtp(email: string): Promise<{ success: boolean; message: string; otpCode?: string; targetUser?: UserProfile }> {
    try {
      const res = await fetch(`${API_BASE}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  async completePasswordReset(userId: string, newPassword: string, otpCode?: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword, otpCode }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  // 2. Departments
  async getDepartments(): Promise<{ success: boolean; data?: Department[]; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/departments`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  async updateDepartment(dept: Department): Promise<{ success: boolean; data?: Department; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dept),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  // 3. Change Requests & Immutable Audit
  async getChangeRequests(): Promise<{ success: boolean; data?: ChangeRequest[]; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/change-requests`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  async createChangeRequest(cr: Partial<ChangeRequest>): Promise<{ success: boolean; data?: ChangeRequest; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/change-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cr),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  async updateChangeRequest(id: string, updates: Record<string, unknown>): Promise<{ success: boolean; data?: ChangeRequest; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/change-requests/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  async itDirectModify(payload: ItDirectModifyPayload | Record<string, unknown>): Promise<{ success: boolean; result?: unknown; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/it-direct-modify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  // 4. Email Notifications
  async getEmailLogs(): Promise<{ success: boolean; data?: EmailNotificationLog[]; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/email-logs`);
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  async logEmail(email: Partial<EmailNotificationLog>): Promise<{ success: boolean; data?: EmailNotificationLog; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/email-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(email),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  // 5. Delegations
  async getDelegations(): Promise<{ success: boolean; data?: TemporaryApproverDelegation[]; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/delegations`);
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  async saveDelegation(delegation: Partial<TemporaryApproverDelegation>): Promise<{ success: boolean; data?: TemporaryApproverDelegation; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/delegations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(delegation),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  async revokeDelegation(id: string, revokedBy: string, revocationReason: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/delegations/${encodeURIComponent(id)}/revoke`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revokedBy, revocationReason }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },
};
