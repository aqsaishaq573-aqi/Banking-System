# controllers/accounts.tcl
package require json
source [file join [file dirname [info script]] ".." "db.tcl"]
source [file join [file dirname [info script]] ".." "utils.tcl"]

proc accounts_list {} {
    set conn [db_connect $::env(DB_USER) $::env(DB_PASSWORD) $::env(DB_CONNECT_STRING)]
    if {$conn eq ""} {
        ::request send "{\"error\":\"DB connect failed\"}" 500 "Content-Type" "application/json"
        return
    }
    set sql "SELECT a.id, a.account_number, a.balance, a.customer_id, c.name AS customer_name FROM cb_accounts a JOIN cb_customers c ON a.customer_id = c.id ORDER BY a.id"
    if {[catch {set rows [db_select $conn $sql]} err]} {
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

proc accounts_get {id} {
    set conn [db_connect $::env(DB_USER) $::env(DB_PASSWORD) $::env(DB_CONNECT_STRING)]
    set sql "SELECT id, account_number, balance, customer_id FROM cb_accounts WHERE id = ${id}"
    if {[catch {set rows [db_select $conn $sql]} err]} {
        db_disconnect $conn
        ::request send "{\"error\":\"DB error\"}" 500 "Content-Type" "application/json"
        return
    }
    db_disconnect $conn
    if {[llength $rows] == 0} {
        ::request send "{\"error\":\"Account not found\"}" 404 "Content-Type" "application/json"
        return
    }
    ::request send [json_from_dict [lindex $rows 0]] 200 "Content-Type" "application/json"
}

proc accounts_create {body} {
    set data [parse_json_body $body]
    set accno [dict get $data account_number]
    set cid [dict get $data customer_id]
    set init [dict get $data initial_deposit]

    set conn [db_connect $::env(DB_USER) $::env(DB_PASSWORD) $::env(DB_CONNECT_STRING)]
    if {$conn eq ""} {
        ::request send "{\"error\":\"DB connect failed\"}" 500 "Content-Type" "application/json"
        return
    }
    if {[catch {db_exec $conn "INSERT INTO cb_accounts (id, account_number, balance, customer_id) VALUES (cb_accounts_seq.NEXTVAL, '${accno}', ${init}, ${cid})"} err]} {
        db_disconnect $conn
        ::request send "{\"error\":\"DB insert failed\"}" 500 "Content-Type" "application/json"
        return
    }
    set rows [db_select $conn "SELECT cb_accounts_seq.CURRVAL AS id FROM dual"]
    db_disconnect $conn
    set newId [dict get [lindex $rows 0] ID]
    ::request send [json_from_dict [dict create id $newId]] 201 "Content-Type" "application/json"
}

proc accounts_update {id body} {
    set data [parse_json_body $body]
    set accno [dict get $data account_number]
    set conn [db_connect $::env(DB_USER) $::env(DB_PASSWORD) $::env(DB_CONNECT_STRING)]
    if {[catch {db_exec $conn "UPDATE cb_accounts SET account_number='${accno}' WHERE id=${id}"} err]} {
        db_disconnect $conn
        ::request send "{\"error\":\"DB update failed\"}" 500 "Content-Type" "application/json"
        return
    }
    db_disconnect $conn
    ::request send [json_from_dict [dict create id $id]] 200 "Content-Type" "application/json"
}

proc accounts_remove {id} {
    set conn [db_connect $::env(DB_USER) $::env(DB_PASSWORD) $::env(DB_CONNECT_STRING)]
    if {[catch {db_exec $conn "DELETE FROM cb_accounts WHERE id=${id}"} err]} {
        db_disconnect $conn
        ::request send "{\"error\":\"DB delete failed\"}" 500 "Content-Type" "application/json"
        return
    }
    db_disconnect $conn
    ::request send "" 204 "Content-Type" "application/json"
}
