import { Customer, Account, Transaction, AuditLogEntry, Complaint, PasswordResetRequest } from '../types';

// Initial Data
const INITIAL_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Ahmed Hassan', cnic: '35202-1234567-1', contact: '03001234567', email: 'ahmed@example.com', address: 'House 123, F-7, Islamabad', dob: '1990-05-15', status: 'Active', createdAt: new Date().toISOString(), password: 'password123' },
  { id: 2, name: 'Fatima Khan', cnic: '42101-9876543-2', contact: '03219876543', email: 'fatima@example.com', address: 'Flat 45, DHA Phase 5, Karachi', dob: '1988-08-22', status: 'Active', createdAt: new Date().toISOString(), password: 'password123' },
  { id: 3, name: 'Ali Raza', cnic: '33100-5555555-5', contact: '03335555555', email: 'ali@example.com', address: 'Block C, Model Town, Lahore', dob: '1995-03-10', status: 'Active', createdAt: new Date().toISOString(), password: 'password123' },
];

const INITIAL_ACCOUNTS: Account[] = [
  // Savings: Has Interest Rate & Withdraw Limit
  { accountNo: 1001, customerId: 1, accountType: 'Savings', balance: 50000.00, status: 'Active', openingDate: new Date().toISOString(), lastTransactionDate: null, interestRate: 5.0, withdrawLimit: 50000 },
  // Current: Has Service Charges
  { accountNo: 1002, customerId: 1, accountType: 'Current', balance: 120000.00, status: 'Active', openingDate: new Date().toISOString(), lastTransactionDate: null, serviceCharges: 1 },
  { accountNo: 1003, customerId: 2, accountType: 'Savings', balance: 75000.00, status: 'Active', openingDate: new Date().toISOString(), lastTransactionDate: null, interestRate: 5.0, withdrawLimit: 50000 },
  { accountNo: 1004, customerId: 3, accountType: 'Current', balance: 200000.00, status: 'Active', openingDate: new Date().toISOString(), lastTransactionDate: null, serviceCharges: 1 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [];
const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];
const INITIAL_COMPLAINTS: Complaint[] = [];
const INITIAL_RESET_REQUESTS: PasswordResetRequest[] = [];

// Helper to simulate database latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockDatabase {
  private customers: Customer[] = [];
  private accounts: Account[] = [];
  private transactions: Transaction[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private complaints: Complaint[] = [];
  private passwordResets: PasswordResetRequest[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    const storedCust = localStorage.getItem('cbs_customers');
    const storedAcc = localStorage.getItem('cbs_accounts');
    const storedTx = localStorage.getItem('cbs_transactions');
    const storedAudit = localStorage.getItem('cbs_audit');
    const storedComplaints = localStorage.getItem('cbs_complaints');
    const storedResets = localStorage.getItem('cbs_resets');

    this.customers = storedCust ? JSON.parse(storedCust) : INITIAL_CUSTOMERS;

    // SELF-HEALING: Ensure all customers have a password (fixes issues with legacy data)
    let customersUpdated = false;
    this.customers = this.customers.map(c => {
      if (!c.password) {
        customersUpdated = true;
        return { ...c, password: 'password123' };
      }
      return c;
    });
    if (customersUpdated) this.saveData(); // Persist fix immediately

    this.accounts = storedAcc ? JSON.parse(storedAcc) : INITIAL_ACCOUNTS;
    this.transactions = storedTx ? JSON.parse(storedTx) : INITIAL_TRANSACTIONS;
    this.auditLogs = storedAudit ? JSON.parse(storedAudit) : INITIAL_AUDIT_LOGS;
    this.complaints = storedComplaints ? JSON.parse(storedComplaints) : INITIAL_COMPLAINTS;
    this.passwordResets = storedResets ? JSON.parse(storedResets) : INITIAL_RESET_REQUESTS;
  }

  private saveData() {
    localStorage.setItem('cbs_customers', JSON.stringify(this.customers));
    localStorage.setItem('cbs_accounts', JSON.stringify(this.accounts));
    localStorage.setItem('cbs_transactions', JSON.stringify(this.transactions));
    localStorage.setItem('cbs_audit', JSON.stringify(this.auditLogs));
    localStorage.setItem('cbs_complaints', JSON.stringify(this.complaints));
    localStorage.setItem('cbs_resets', JSON.stringify(this.passwordResets));
  }

  // --- Authentication ---
  async authenticate(cnic: string, password: string): Promise<Customer | null> {
    await delay(600);
    // Find user
    const user = this.customers.find(c => c.cnic === cnic && c.password === password);
    if (!user) return null;
    if (user.status !== 'Active') throw new Error("Account is inactive or suspended.");
    return user;
  }

  // REPLACED registerCustomer with registerOnlineAccess
  // This ensures accounts are only created by Admin, and users only "Claim" them.
  async registerOnlineAccess(cnic: string, name: string, email: string, password: string): Promise<Customer> {
    await delay(800);

    // 1. Verify Identity
    const existingCustomer = this.customers.find(c => c.cnic === cnic);

    if (!existingCustomer) {
      throw new Error("No bank account found with this CNIC. Please visit a branch to open an account first.");
    }

    // Case-insensitive name match
    if (existingCustomer.name.toLowerCase() !== name.toLowerCase()) {
      throw new Error("The name provided does not match our records for this CNIC.");
    }

    if (existingCustomer.status !== 'Active') {
      throw new Error("This account is currently inactive or closed.");
    }

    // 2. Update Credentials
    const index = this.customers.indexOf(existingCustomer);
    this.customers[index] = {
      ...existingCustomer,
      email: email, // Update email if provided
      password: password
    };

    this.logAudit('UPDATE', 'Customer', existingCustomer.id, 'User registered for Online Banking', 'COMMIT', 'Success');
    this.saveData();
    return this.customers[index];
  }

  // --- Password Reset (Rule 3) ---
  async requestPasswordReset(name: string, cnic: string, newPassword: string): Promise<void> {
    await delay(500);
    const customer = this.customers.find(c => c.cnic === cnic && c.name.toLowerCase() === name.toLowerCase());
    if (!customer) throw new Error("Identity verification failed. Name and CNIC do not match records.");

    this.passwordResets.push({
      id: Date.now(),
      cnic,
      name,
      newPassword,
      status: 'Pending',
      requestDate: new Date().toISOString()
    });
    this.saveData();
  }

  async getPasswordResetRequests(): Promise<PasswordResetRequest[]> {
    await delay(300);
    return this.passwordResets.filter(r => r.status === 'Pending');
  }

  async approvePasswordReset(requestId: number): Promise<void> {
    await delay(500);
    const reqIndex = this.passwordResets.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error("Request not found");

    const req = this.passwordResets[reqIndex];
    const custIndex = this.customers.findIndex(c => c.cnic === req.cnic);

    if (custIndex !== -1) {
      this.customers[custIndex].password = req.newPassword;
      this.logAudit('UPDATE', 'Customer', this.customers[custIndex].id, 'Admin approved password reset', 'COMMIT', 'Success');
    }

    this.passwordResets[reqIndex].status = 'Approved';
    this.saveData();
  }

  // --- Getters ---
  async getCustomers(): Promise<Customer[]> {
    await delay(300);
    return [...this.customers];
  }

  async getAccounts(): Promise<Account[]> {
    await delay(300);
    return [...this.accounts];
  }

  async getTransactions(): Promise<Transaction[]> {
    await delay(300);
    return [...this.transactions].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    await delay(300);
    return [...this.auditLogs].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }

  // --- Complaint Management ---
  async submitComplaint(customerId: number, description: string): Promise<void> {
    await delay(500);
    const newId = this.complaints.length > 0 ? Math.max(...this.complaints.map(c => c.id)) + 1 : 1;
    this.complaints.push({
      id: newId,
      customerId,
      description,
      date: new Date().toISOString(),
      status: 'Pending'
    });
    this.saveData();
  }

  async getCustomerComplaints(customerId: number): Promise<Complaint[]> {
    await delay(300);
    return this.complaints.filter(c => c.customerId === customerId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Admin: Get all complaints with customer details
  async getAllComplaints(): Promise<(Complaint & { customerName: string, customerCnic: string })[]> {
    await delay(400);
    return this.complaints.map(c => {
      const cust = this.customers.find(cu => cu.id === c.customerId);
      return {
        ...c,
        customerName: cust ? cust.name : 'Unknown',
        customerCnic: cust ? cust.cnic : 'Unknown'
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Admin: Respond to complaint
  async respondToComplaint(id: number, response: string): Promise<void> {
    await delay(400);
    const index = this.complaints.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Complaint not found");

    this.complaints[index].status = 'Resolved';
    this.complaints[index].adminResponse = response;
    this.saveData();
  }

  // --- Customer Specific ---
  async getCustomerAccounts(customerId: number): Promise<Account[]> {
    await delay(300);
    return this.accounts.filter(a => a.customerId === customerId);
  }

  // Helper for dashboard notifications & statements
  async getCustomerTransactions(customerId: number): Promise<(Transaction & { otherPartyName?: string })[]> {
    await delay(400);
    const myAccounts = this.accounts.filter(a => a.customerId === customerId).map(a => a.accountNo);
    const txs = this.transactions.filter(t =>
      (t.fromAccount && myAccounts.includes(t.fromAccount)) ||
      (t.toAccount && myAccounts.includes(t.toAccount))
    ).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    // Enrich with other party names
    const enriched = txs.map(t => {
      let otherPartyName = 'Bank/System';
      let otherAccountId: number | undefined;

      if (t.fromAccount && myAccounts.includes(t.fromAccount)) {
        // Outgoing: find receiver
        otherAccountId = t.toAccount;
      } else if (t.toAccount && myAccounts.includes(t.toAccount)) {
        // Incoming: find sender
        otherAccountId = t.fromAccount;
      }

      if (otherAccountId) {
        const acc = this.accounts.find(a => a.accountNo === otherAccountId);
        if (acc) {
          const cust = this.customers.find(c => c.id === acc.customerId);
          if (cust) otherPartyName = cust.name;
        }
      }
      return { ...t, otherPartyName };
    });

    return enriched;
  }

  // --- Actions ---
  // Updated Rule 4: Allow creating accounts for EXISTING customers
  async addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'password'>): Promise<Customer> {
    await delay(500);

    // Check if customer already exists by CNIC
    const existingCustomer = this.customers.find(c => c.cnic === customer.cnic);

    if (existingCustomer) {
      // If names match, return existing customer so we can add another account to them
      if (existingCustomer.name.toLowerCase() === customer.name.toLowerCase()) {
        return existingCustomer;
      } else {
        throw new Error("CNIC exists but name does not match records.");
      }
    }

    const newId = this.customers.length > 0 ? Math.max(...this.customers.map(c => c.id)) + 1 : 1;
    const newCustomer: Customer = {
      ...customer,
      id: newId,
      createdAt: new Date().toISOString(),
      password: 'password123' // Default password for admin created users
    };
    this.customers.push(newCustomer);
    this.logAudit('INSERT', 'Customer', newId, `Created customer ${customer.name}`, null, 'Success');
    this.saveData();
    return newCustomer;
  }

  async updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer> {
    await delay(400);
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Customer not found");

    this.customers[index] = { ...this.customers[index], ...updates };
    this.logAudit('UPDATE', 'Customer', id, `Updated profile details`, 'COMMIT', 'Success');
    this.saveData();
    return this.customers[index];
  }

  // Rule 1, 2, & 3 Implementation (STRICT Deletion)
  async softDeleteCustomer(id: number, verificationCnic: string): Promise<void> {
    await delay(800); // Simulate network
    const customerIndex = this.customers.findIndex(c => c.id === id);
    if (customerIndex === -1) throw new Error("Customer not found");
    const customer = this.customers[customerIndex];

    // Rule 2 Check: Identity Verification
    if (customer.cnic !== verificationCnic) {
      this.logAudit('DELETE_ATTEMPT', 'Customer', id, `Failed identity check for ${customer.name}`, 'ROLLBACK', 'Identity Verification Failed');
      throw new Error("Identity Verification Failed: The provided CNIC does not match the customer record.");
    }

    // Rule 1 Check: Zero Balance
    const customerAccounts = this.accounts.filter(a => a.customerId === id && a.status !== 'Closed');
    const accountsWithFunds = customerAccounts.filter(a => a.balance > 0);

    if (accountsWithFunds.length > 0) {
      const details = accountsWithFunds.map(a => `Acc #${a.accountNo} ($${a.balance})`).join(', ');
      this.logAudit('DELETE_ATTEMPT', 'Customer', id, `Failed closure due to remaining funds: ${details}`, 'ROLLBACK', 'Failed: Non-zero balance');
      // Ensure the log is saved before throwing error
      this.saveData();
      throw new Error(`Cannot close customer relationship (Rule 1 Violated).\n\nThe following accounts still have active funds:\n${details}\n\nPlease withdraw all funds to 0.00 before closing.`);
    }

    // Rule 3: Soft Delete (Preserve History)
    this.customers[customerIndex].status = 'Inactive';

    // Close all empty accounts associated with this customer
    let closedCount = 0;
    customerAccounts.forEach(acc => {
      const accIndex = this.accounts.findIndex(a => a.accountNo === acc.accountNo);
      if (accIndex !== -1) {
        this.accounts[accIndex].status = 'Closed';
        closedCount++;
      }
    });

    this.logAudit('UPDATE', 'Customer', id, `Customer ${customer.name} marked Inactive. ${closedCount} accounts closed. History preserved.`, 'COMMIT', 'Relationship Closed');
    this.saveData();
  }

  async createAccount(customerId: number, type: Account['accountType'], initialDeposit: number): Promise<Account> {
    await delay(500);
    const newAccountNo = this.accounts.length > 0 ? Math.max(...this.accounts.map(a => a.accountNo)) + 1 : 1001;

    // Rule: Inactive savings if balance < 10
    let initialStatus: Account['status'] = 'Active';
    if (type === 'Savings' && initialDeposit < 10) {
      initialStatus = 'Inactive';
    }

    // Apply EERD Specific defaults based on type
    let extraAttributes = {};
    if (type === 'Savings') {
      extraAttributes = {
        interestRate: 5.0, // 5% per year 
        withdrawLimit: 50000 // Default ATM limit
      };
    } else if (type === 'Current') {
      extraAttributes = { serviceCharges: 1 }; // $1 fee
    } else if (type === 'Fixed Deposit') {
      extraAttributes = { interestRate: 11.0 };
    }

    const newAccount: Account = {
      accountNo: newAccountNo,
      customerId,
      accountType: type,
      balance: initialDeposit,
      status: initialStatus,
      openingDate: new Date().toISOString(),
      lastTransactionDate: initialDeposit > 0 ? new Date().toISOString() : null,
      ...extraAttributes
    };
    this.accounts.push(newAccount);

    if (initialDeposit > 0) {
      this.recordTransaction({
        toAccount: newAccountNo,
        amount: initialDeposit,
        type: 'Deposit',
        description: 'Initial Deposit',
        status: 'Completed',
        transId: 0, // Placeholder
        dateTime: new Date().toISOString()
      });
    }

    this.logAudit('INSERT', 'Account', newAccountNo, `Opened ${type} account`, 'COMMIT', 'Success');
    this.saveData();
    return newAccount;
  }

  async processTransaction(type: 'Deposit' | 'Withdrawal' | 'Transfer', amount: number, fromAccId?: number, toAccId?: number, description?: string, method?: string): Promise<boolean> {
    await delay(800);
    const date = new Date().toISOString();

    try {
      // Begin Transaction Logic
      this.logAudit(type, 'Transaction', 0, `Initiating ${type}`, 'BEGIN', 'Transaction Started');

      if (type === 'Deposit' && toAccId) {
        const accIndex = this.accounts.findIndex(a => a.accountNo === toAccId);
        if (accIndex === -1) throw new Error("Account not found");
        if (this.accounts[accIndex].status === 'Closed') throw new Error("Account is closed");

        // Reactivate if inactive savings gets deposit? (Not strictly requested, but good practice. For now, we leave manual.)

        this.accounts[accIndex].balance += amount;
        this.accounts[accIndex].lastTransactionDate = date;

        this.recordTransaction({
          transId: 0,
          toAccount: toAccId,
          amount,
          type: 'Deposit',
          description: description || 'Deposit',
          status: 'Completed',
          dateTime: date
        });

        this.logAudit('UPDATE', 'Account', toAccId, `Deposited ${amount}`, 'COMMIT', 'Success');

      } else if (type === 'Withdrawal' && fromAccId) {
        const accIndex = this.accounts.findIndex(a => a.accountNo === fromAccId);
        if (accIndex === -1) throw new Error("Account not found");
        const account = this.accounts[accIndex];

        if (account.status !== 'Active') throw new Error("Account is closed or inactive");
        if (account.balance < amount) throw new Error("Insufficient funds");

        // Rule: Savings Daily Limit
        if (account.accountType === 'Savings') {
          const limit = method === 'Online' ? 200000 : 50000; // 50k ATM, 200k Online
          if (amount > limit) {
            throw new Error(`Exceeds ${method} limit of ${limit.toLocaleString()} for Savings account.`);
          }
        }

        // Rule: Current Account Charges ($1 for ATM/Online)
        let finalAmount = amount;
        let serviceCharge = 0;
        if (account.accountType === 'Current' && (method === 'ATM' || method === 'Online')) {
          serviceCharge = 1; // Fixed fee
          if (account.balance < (amount + serviceCharge)) {
            throw new Error("Insufficient funds to cover withdrawal + service charge ($1).");
          }
          finalAmount += serviceCharge;
        }

        this.accounts[accIndex].balance -= finalAmount;
        this.accounts[accIndex].lastTransactionDate = date;

        this.recordTransaction({
          transId: 0,
          fromAccount: fromAccId,
          amount,
          type: 'Withdrawal',
          description: description || 'Withdrawal',
          status: 'Completed',
          dateTime: date,
          withdrawalMethod: method as any
        });

        if (serviceCharge > 0) {
          this.logAudit('UPDATE', 'Account', fromAccId, `Service charge applied: $${serviceCharge}`, null, 'Fee Deducted');
        }

        this.logAudit('UPDATE', 'Account', fromAccId, `Withdrew ${amount} via ${method}`, 'COMMIT', 'Success');

      } else if (type === 'Transfer' && fromAccId && toAccId) {
        const fromIndex = this.accounts.findIndex(a => a.accountNo === fromAccId);
        const toIndex = this.accounts.findIndex(a => a.accountNo === toAccId);

        if (fromIndex === -1 || toIndex === -1) throw new Error("One or both accounts not found");
        if (this.accounts[fromIndex].status !== 'Active' || this.accounts[toIndex].status !== 'Active') throw new Error("One or both accounts are inactive");

        let finalAmount = amount;
        let serviceCharge = 0;

        // Current Account Transfer Fee ($1 for Online Transfer)
        if (this.accounts[fromIndex].accountType === 'Current') {
          serviceCharge = 1;
        }

        if (this.accounts[fromIndex].balance < (amount + serviceCharge)) throw new Error("Insufficient funds (incl. $1 fee)");

        // Atomic Operation Simulation
        this.accounts[fromIndex].balance -= (amount + serviceCharge);
        this.logAudit('UPDATE', 'Account', fromAccId, `Debited ${amount}`, 'SAVEPOINT', 'Step 1 Complete');

        this.accounts[toIndex].balance += amount;

        this.recordTransaction({
          transId: 0,
          fromAccount: fromAccId,
          toAccount: toAccId,
          amount,
          type: 'Transfer',
          description: description || 'Transfer',
          status: 'Completed',
          dateTime: date
        });

        this.logAudit('UPDATE', 'Account', toAccId, `Credited ${amount}`, 'COMMIT', 'Transaction Complete');
      }

      this.saveData();
      return true;

    } catch (e: any) {
      this.logAudit(type, 'Transaction', 0, `Failed: ${e.message}`, 'ROLLBACK', 'Transaction Failed');
      this.saveData();
      throw e;
    }
  }

  // Rule 3 & 4 (Month End Processing)
  async runMonthEndProcessing(): Promise<string> {
    await delay(1000);
    let logs = [];
    let processedCount = 0;

    for (let i = 0; i < this.accounts.length; i++) {
      const acc = this.accounts[i];
      if (acc.status !== 'Active') continue;

      // Savings Interest (5%)
      if (acc.accountType === 'Savings') {
        // 5% annual / 12 months
        const interest = acc.balance * (0.05 / 12);
        if (interest > 0) {
          this.accounts[i].balance += interest;
          logs.push(`Acc ${acc.accountNo}: Credited Interest +${interest.toFixed(2)}`);
          processedCount++;
        }
      }
      // Current Maintenance ($1)
      else if (acc.accountType === 'Current') {
        const fee = 1;
        if (acc.balance >= fee) {
          this.accounts[i].balance -= fee;
          logs.push(`Acc ${acc.accountNo}: Deducted Maintenance Fee -${fee.toFixed(2)}`);
          processedCount++;
        }
      }
    }

    this.saveData();
    this.logAudit('BATCH', 'Accounts', 0, 'Run Month End Processing', 'COMMIT', `Processed ${processedCount} accounts`);
    return `Month-End Processing Complete.\n\n${logs.slice(0, 5).join('\n')}${logs.length > 5 ? '\n...' : ''}`;
  }

  // Helper to record tx
  private recordTransaction(tx: Transaction) {
    const newId = this.transactions.length > 0 ? Math.max(...this.transactions.map(t => t.transId)) + 1 : 100000;
    this.transactions.push({ ...tx, transId: newId });
  }

  // Helper to log audit
  private logAudit(op: string, table: string, recId: number, action: string, tcl: AuditLogEntry['tclCommand'], status: string) {
    const newId = this.auditLogs.length > 0 ? Math.max(...this.auditLogs.map(l => l.logId)) + 1 : 1;
    this.auditLogs.push({
      logId: newId,
      operation: op,
      tableAffected: table,
      recordId: recId,
      userAction: action,
      tclCommand: tcl,
      dateTime: new Date().toISOString(),
      statusMessage: status,
      sqlQuery: tcl === 'BEGIN' ? 'BEGIN TRANSACTION;' : tcl === 'COMMIT' ? 'COMMIT;' : tcl === 'ROLLBACK' ? 'ROLLBACK;' : undefined
    });
  }

  // --- For TCL Demo Reset ---
  async resetDemoData() {
    this.accounts[0].balance = 50000; // Reset Account 1001
    this.accounts[1].balance = 120000; // Reset Account 1002
    this.saveData();
  }
}

export const db = new MockDatabase();