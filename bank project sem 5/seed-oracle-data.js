#!/usr/bin/env node

import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Oracle Thick Mode
try {
    const libDir = 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin';
    oracledb.initOracleClient({ libDir });
    console.log('✅ Oracle Thick Mode initialized');
} catch (error) {
    console.error('⚠️  Oracle Client init error:', error.message);
}

const dbConfig = {
    user: process.env.DB_USER || 'system',
    password: process.env.DB_PASSWORD || 'system',
    connectString: `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 1521}/${process.env.DB_SERVICE_NAME || 'XE'}`,
};

async function seedData() {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        console.log('✅ Connected to Oracle Database 11g XE\n');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        try {
            await connection.execute('DELETE FROM TRANSACTIONS', {}, { autoCommit: true });
            console.log('  ✓ Cleared TRANSACTIONS');
        } catch (e) { }

        try {
            await connection.execute('DELETE FROM COMPLAINTS', {}, { autoCommit: true });
            console.log('  ✓ Cleared COMPLAINTS');
        } catch (e) { }

        try {
            await connection.execute('DELETE FROM ACCOUNTS', {}, { autoCommit: true });
            console.log('  ✓ Cleared ACCOUNTS');
        } catch (e) { }

        try {
            await connection.execute('DELETE FROM CUSTOMERS', {}, { autoCommit: true });
            console.log('  ✓ Cleared CUSTOMERS');
        } catch (e) { }

        // Insert sample customers
        console.log('\n📝 Inserting sample customers...');
        const customers = [
            { id: 1, name: 'Ahmed Hassan', cnic: '35202-1234567-1', email: 'ahmed@example.com', password: 'password123' },
            { id: 2, name: 'Fatima Khan', cnic: '42101-9876543-2', email: 'fatima@example.com', password: 'password123' },
            { id: 3, name: 'Ali Raza', cnic: '33100-5555555-5', email: 'ali@example.com', password: 'password123' },
        ];

        for (const customer of customers) {
            await connection.execute(
                `INSERT INTO CUSTOMERS (ID, NAME, CNIC, CONTACT, EMAIL, ADDRESS, DOB, STATUS, PASSWORD) 
         VALUES (:id, :name, :cnic, :contact, :email, :address, :dob, :status, :password)`,
                {
                    id: customer.id,
                    name: customer.name,
                    cnic: customer.cnic,
                    contact: '03001234567',
                    email: customer.email,
                    address: 'Karachi',
                    dob: null,
                    status: 'Active',
                    password: customer.password,
                },
                { autoCommit: false }
            );
            console.log(`  ✓ ${customer.name} (${customer.cnic})`);
        }

        // Insert sample accounts with balances
        console.log('\n💰 Inserting sample accounts with balances...');
        const accounts = [
            { accountNo: 1001, customerId: 1, accountType: 'Savings', balance: 50000.00 },
            { accountNo: 1002, customerId: 1, accountType: 'Current', balance: 120000.00 },
            { accountNo: 1003, customerId: 2, accountType: 'Savings', balance: 75000.00 },
            { accountNo: 1004, customerId: 3, accountType: 'Current', balance: 200000.00 },
        ];

        for (const account of accounts) {
            await connection.execute(
                `INSERT INTO ACCOUNTS (ACCOUNT_NO, CUSTOMER_ID, ACCOUNT_TYPE, BALANCE, STATUS, OPENING_DATE) 
         VALUES (:accountNo, :customerId, :accountType, :balance, :status, SYSDATE)`,
                {
                    accountNo: account.accountNo,
                    customerId: account.customerId,
                    accountType: account.accountType,
                    balance: account.balance,
                    status: 'Active',
                },
                { autoCommit: false }
            );
            console.log(`  ✓ Account ${account.accountNo} - ${account.accountType} - $${account.balance.toLocaleString()}`);
        }

        // Insert sample transactions
        console.log('\n📊 Inserting sample transactions...');
        const transactions = [
            { id: 1, fromAccount: null, toAccount: 1001, amount: 5000, type: 'Deposit' },
            { id: 2, fromAccount: 1001, toAccount: 1002, amount: 2000, type: 'Transfer' },
            { id: 3, fromAccount: 1002, toAccount: null, amount: 1500, type: 'Withdrawal' },
            { id: 4, fromAccount: null, toAccount: 1002, amount: 10000, type: 'Deposit' },
            { id: 5, fromAccount: 1001, toAccount: 1003, amount: 3500, type: 'Transfer' },
            { id: 6, fromAccount: 1003, toAccount: null, amount: 2000, type: 'Withdrawal' },
            { id: 7, fromAccount: null, toAccount: 1003, amount: 7500, type: 'Deposit' },
        ];

        for (const tx of transactions) {
            await connection.execute(
                `INSERT INTO TRANSACTIONS (ID, FROM_ACCOUNT_NO, TO_ACCOUNT_NO, AMOUNT, TYPE, STATUS, CREATED_AT) 
         VALUES (:id, :fromAccount, :toAccount, :amount, :type, :status, SYSTIMESTAMP)`,
                {
                    id: tx.id,
                    fromAccount: tx.fromAccount,
                    toAccount: tx.toAccount,
                    amount: tx.amount,
                    type: tx.type,
                    status: 'Completed',
                },
                { autoCommit: false }
            );
            const fromTo = tx.fromAccount ? `From Account ${tx.fromAccount}` : 'Deposit';
            console.log(`  ✓ Transaction ${tx.id} - ${tx.type} - $${tx.amount}`);
        }

        // Commit all changes
        await connection.commit();
        console.log('\n✅ All sample data inserted successfully!');
        console.log('\n📊 Data Summary:');
        console.log('   - 3 customers created');
        console.log('   - 4 accounts created with balances:');
        console.log('     • Ahmed Hassan: $50,000 (Savings) + $120,000 (Current)');
        console.log('     • Fatima Khan: $75,000 (Savings)');
        console.log('     • Ali Raza: $200,000 (Current)');
        console.log('   - 7 transactions recorded');
        console.log('\n🔐 Test Login Credentials:');
        console.log('   • CNIC: 35202-1234567-1 | Password: password123');
        console.log('   • CNIC: 42101-9876543-2 | Password: password123');
        console.log('   • CNIC: 33100-5555555-5 | Password: password123');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error('Error closing connection:', e.message);
            }
        }
    }
}

seedData();
