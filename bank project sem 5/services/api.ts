// services/api.ts
// REST API client that communicates with the backend on http://localhost:4000

const API_BASE_URL = 'http://localhost:4000/api';

/**
 * Helper to make HTTP requests and handle responses
 */
async function apiRequest<T>(
  method: string,
  endpoint: string,
  body?: any
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) errorMessage = errorData.error;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Cannot connect to backend at ${API_BASE_URL}. Make sure the Node.js server is running on port 4000. Run: node backend-server.js`
      );
    }
    throw error;
  }
}

export const api = {
  auth: {
    async login(cnic: string, password: string) {
      return apiRequest<{ user: any; token: string }>('POST', '/auth/login', { cnic, password });
    },
    async registerOnlineAccess(cnic: string, name: string, email: string, password: string) {
      return apiRequest('POST', '/auth/register', { cnic, name, email, password });
    },
    async requestPasswordReset(name: string, cnic: string, newPassword: string) {
      return apiRequest('POST', '/auth/forgot-password', { name, cnic, newPassword });
    },
    async resetPassword(cnic: string, newPassword: string) {
      return apiRequest('POST', '/auth/reset-password', { cnic, newPassword });
    },
  },

  customers: {
    async list() {
      return apiRequest<any[]>('GET', '/customers');
    },
    async get(id: string | number) {
      return apiRequest<any>('GET', `/customers/${id}`);
    },
    async create(data: any) {
      return apiRequest('POST', '/customers', data);
    },
    async update(id: string | number, data: any) {
      return apiRequest('PUT', `/customers/${id}`, data);
    },
    async delete(id: string | number) {
      return apiRequest('DELETE', `/customers/${id}`);
    },
  },

  accounts: {
    async list() {
      return apiRequest<any[]>('GET', '/accounts');
    },
    async getByCustomer(customerId: string | number) {
      return apiRequest<any[]>('GET', `/accounts/customer/${customerId}`);
    },
    async get(accountNo: string | number) {
      return apiRequest<any>('GET', `/accounts/${accountNo}`);
    },
    async create(data: any) {
      return apiRequest('POST', '/accounts', data);
    },
    async update(accountNo: string | number, data: any) {
      return apiRequest('PUT', `/accounts/${accountNo}`, data);
    },
    async delete(accountNo: string | number) {
      return apiRequest('DELETE', `/accounts/${accountNo}`);
    },
  },

  transactions: {
    async list() {
      return apiRequest<any[]>('GET', '/transactions');
    },
    async getByAccount(accountNo: string | number) {
      return apiRequest<any[]>('GET', `/transactions/account/${accountNo}`);
    },
    async create(data: any) {
      return apiRequest('POST', '/transactions', data);
    },
    async deposit(data: { accountNo: number; amount: number; description?: string }) {
      return apiRequest('POST', '/transactions', {
        fromAccountNo: null,
        toAccountNo: data.accountNo,
        amount: data.amount,
        type: 'Deposit',
        description: data.description || ''
      });
    },
    async withdraw(data: { accountNo: number; amount: number; description?: string }) {
      return apiRequest('POST', '/transactions', {
        fromAccountNo: data.accountNo,
        toAccountNo: null,
        amount: data.amount,
        type: 'Withdrawal',
        description: data.description || ''
      });
    },
    async transfer(data: { fromAccountNo: number; toAccountNo: number; amount: number; description?: string }) {
      return apiRequest('POST', '/transactions', {
        fromAccountNo: data.fromAccountNo,
        toAccountNo: data.toAccountNo,
        amount: data.amount,
        type: 'Transfer',
        description: data.description || ''
      });
    },
  },

  complaints: {
    async list() {
      return apiRequest<any[]>('GET', '/complaints');
    },
    async getByCustomer(customerId: string | number) {
      return apiRequest<any[]>('GET', `/complaints/customer/${customerId}`);
    },
    async create(data: any) {
      return apiRequest('POST', '/complaints', data);
    },
    async update(id: string | number, data: any) {
      return apiRequest('PUT', `/complaints/${id}`, data);
    },
  },

  auditLogs: {
    async list(filters?: any) {
      let endpoint = '/audit-logs';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.action) params.append('action', filters.action);
        if (filters.tableName) params.append('tableName', filters.tableName);
        if (filters.limit) params.append('limit', filters.limit);
        if (params.toString()) endpoint += '?' + params.toString();
      }
      return apiRequest<any[]>('GET', endpoint);
    },
  },

  health: {
    async check() {
      return apiRequest<{ status: string }>('GET', '/health');
    },
  },
};

export default api;