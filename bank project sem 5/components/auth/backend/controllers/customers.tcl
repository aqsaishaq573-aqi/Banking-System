# controllers/customers.tcl
package require json
source [file join [file dirname [info script]] ".." "db.tcl"]
source [file join [file dirname [info script]] ".." "utils.tcl"]

proc customers_list {} {
    set conn [db_connect $::env(DB_USER) $::env(DB_PASSWORD) $::env(DB_CONNECT_STRING)]
    if {$conn eq ""} {
        ::request send "{\"error\":\"DB connect failed\"}" 500 "Content-Type" "application/json"
        return
    }
    set sql "SELECT id, name, email, phone FROM cb_customers ORDER BY id"
    if {[catch {set rows [db_select $conn $sql]} err]} {
        db_disconnect $conn
        ::request send "{\"error\":\"DB error\"}" 500 "Content-Type" "application/json"
        return
    }
    db_disconnect $conn

    # rows is a list of dicts
    # build JSON: naive but works for common types
    set out "[list]"
    foreach r $rows {
        lappend out [json_from_dict $r]
    }
    set body "["[join $out ,]"]"
    ::request send $body 200 "Content-Type" "application/json"
}

proc customers_get {id} {
    set conn [db_connect $::env(DB_USER) $::env(DB_PASSWORD) $::env(DB_CONNECT_STRING)]
    if {$conn eq ""} {
        ::request send "{\"error\":\"DB connect failed\"}" 500 "Content-Type" "application/json"
        return
    }
    set sql "SELECT id, name, email, phone FROM cb_customers WHERE id = ${id}"
    if {[catch {set rows [db_select $conn $sql]} err]} {
        db_disconnect $conn
        ::request send "{\"error\":\"DB error\"}" 500 "Content-Type" "application/json"
        return
    }
    db_disconnect $conn
    if {[llength $rows] == 0} {
        ::request send "{\"error\":\"Customer not found\"}" 404 "Content-Type" "application/json"
        return
    }
    set txt [json_from_dict [lindex $rows 0]]
    ::request send $txt 200 "Content-Type" "application/json"
}

proc customers_create {body} {
    set data [parse_json_body $body]
    set name [dict get $data name]
    set email [dict get $data email]
    set phone [dict get $data phone]

    set conn [db_connect $::env(DB_USER) $::env(DB_PASSWORD) $::env(DB_CONNECT_STRING)]
    if {$conn eq ""} {
        ::request send "{\"error\":\"DB connect failed\"}" 500 "Content-Type" "application/json"
        return
    }

    # Use INSERT ... RETURNING into a variable in Oracle PL/SQL block
    set sql "DECLARE newId NUMBER; BEGIN INSERT INTO cb_customers (id, name, email, phone) VALUES (cb_customers_seq.NEXTVAL, '${name}', '${email}', '${phone}') RETURNING id INTO newId; ?; END;"
    # above '?;' placeholder: some Oratcl versions support oraplexec with bound OUT variables. If your Oratcl doesn't, simply run a plain insert and then select cb_customers_seq.CURRVAL
    if {[catch {db_exec $conn "INSERT INTO cb_customers (id, name, email, phone) VALUES (cb_customers_seq.NEXTVAL, '${name}', '${email}', '${phone})'"} err]} {
        # fallback: naive insert (we already tried)
    }

    # simpler strategy: insert and then select last sequence value
    if {[catch {db_exec $conn "INSERT INTO cb_customers (id, name, email, phone) VALUES (cb_customers_seq.NEXTVAL, '${name}', '${email}', '${phone}')"} err]} {
        db_disconnect $conn
        ::request send "{\"error\":\"DB insert failed\"}" 500 "Content-Type" "application/json"
        return
    }

    # get currval
    set rows [db_select $conn "SELECT cb_customers_seq.CURRVAL AS id FROM dual"]
    db_disconnect $conn
    set newId [dict get [lindex $rows 0] ID]
    set resp [dict create id $newId]
    ::request send [json_from_dict $resp] 201 "Content-Type" "application/json"
}

proc customers_update {id body} {
    set data [parse_json_body $body]
    set name [dict get $data name]
    set email [dict get $data email]
    set phone [dict get $data phone]
    set conn [db_connect $::env(DB_USER) $::env(DB_PASSWORD) $::env(DB_CONNECT_STRING)]
    if {$conn eq ""} {
        ::request send "{\"error\":\"DB connect failed\"}" 500 "Content-Type" "application/json"
        return
    }
    if {[catch {db_exec $conn "UPDATE cb_customers SET name='${name}', email='${email}', phone='${phone}' WHERE id=${id}"} err]} {
        db_disconnect $conn
        ::request send "{\"error\":\"DB update failed\"}" 500 "Content-Type" "application/json"
        return
    }
    db_disconnect $conn
    set resp [dict create id $id]
    ::request send [json_from_dict $resp] 200 "Content-Type" "application/json"
}

proc customers_remove {id} {
    set conn [db_connect $::env(DB_USER) $::env(DB_PASSWORD) $::env(DB_CONNECT_STRING)]
    if {$conn eq ""} {
        ::request send "{\"error\":\"DB connect failed\"}" 500 "Content-Type" "application/json"
        return
    }
    if {[catch {db_exec $conn "DELETE FROM cb_customers WHERE id=${id}"} err]} {
        db_disconnect $conn
        ::request send "{\"error\":\"DB delete failed\"}" 500 "Content-Type" "application/json"
        return
    }
    db_disconnect $conn
    ::request send "" 204 "Content-Type" "application/json"
}
