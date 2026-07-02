# controllers/transactions.tcl
package require json
source [file join [file dirname [info script]] ".." "db.tcl"]
source [file join [file dirname [info script]] ".." "utils.tcl"]

proc transactions_transfer {body} {
    set data [parse_json_body $body]
    set fromId [dict get $data fromAccountId]
    set toId   [dict get $data toAccountId]
    set amount [dict get $data amount]
    set desc   [dict get $data description]

    set conn [db_connect $::env(DB_USER) $::env(DB_PASSWORD) $::env(DB_CONNECT_STRING)]
    if {$conn eq ""} {
        ::request send "{\"error\":\"DB connect failed\"}" 500 "Content-Type" "application/json"
        return
    }

    # This should be done inside a transaction with SELECT ... FOR UPDATE
    # Oratcl/PHP differences - we will implement a simple sequence of operations and commit at the end
    # 1) check balances
    set rows [db_select $conn "SELECT id, balance FROM cb_accounts WHERE id IN (${fromId}, ${toId}) FOR UPDATE"]
    if {[llength $rows] < 2} {
        db_disconnect $conn
        ::request send "{\"error\":\"One or both accounts not found\"}" 400 "Content-Type" "application/json"
        return
    }
    # find from/to
    set fromBal -1
    set toBal -1
    foreach r $rows {
        if {[dict get $r ID] == $fromId} { set fromBal [dict get $r BALANCE] }
        if {[dict get $r ID] == $toId}   { set toBal [dict get $r BALANCE] }
    }
    if {$fromBal < $amount} {
        db_disconnect $conn
        ::request send "{\"error\":\"Insufficient funds\"}" 400 "Content-Type" "application/json"
        return
    }

    # update balances
    if {[catch {db_exec $conn "UPDATE cb_accounts SET balance = balance - ${amount} WHERE id = ${fromId}"} err]} {
        db_disconnect $conn
        ::request send "{\"error\":\"Failed to debit\"}" 500 "Content-Type" "application/json"
        return
    }
    if {[catch {db_exec $conn "UPDATE cb_accounts SET balance = balance + ${amount} WHERE id = ${toId}"} err]} {
        db_disconnect $conn
        ::request send "{\"error\":\"Failed to credit\"}" 500 "Content-Type" "application/json"
        return
    }

    # insert ledger entries
    db_exec $conn "INSERT INTO cb_transactions (id, account_id, amount, type, description) VALUES (cb_tx_seq.NEXTVAL, ${fromId}, -${amount}, 'DEBIT', '${desc}')"
    db_exec $conn "INSERT INTO cb_transactions (id, account_id, amount, type, description) VALUES (cb_tx_seq.NEXTVAL, ${toId}, ${amount}, 'CREDIT', '${desc}')"

    # audit
    db_exec $conn "INSERT INTO cb_audit (id, event_type, event_by, details) VALUES (cb_audit_seq.NEXTVAL, 'TRANSFER', NULL, 'from ${fromId} to ${toId} amount ${amount}')"

    db_disconnect $conn
    ::request send "{\"message\":\"Transfer successful\"}" 200 "Content-Type" "application/json"
}

proc transactions_getByAccount {accountId} {
    set conn [db_connect $::env(DB_USER) $::env(DB_PASSWORD) $::env(DB_CONNECT_STRING)]
    if {[catch {set rows [db_select $conn "SELECT id, account_id, amount, type, description, created_at FROM cb_transactions WHERE account_id = ${accountId} ORDER BY id DESC"]} err]} {
        db_disconnect $conn
        ::request send "{\"error\":\"DB error\"}" 500 "Content-Type" "application/json"
        return
    }
    db_disconnect $conn
    set out "[list]"
    foreach r $rows {
        lappend out [json_from_dict $r]
    }
    set body "["[join $out ,]"]"
    ::request send $body 200 "Content-Type" "application/json"
}
