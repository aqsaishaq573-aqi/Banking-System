# controllers/audit.tcl
package require json
source [file join [file dirname [info script]] ".." "db.tcl"]
source [file join [file dirname [info script]] ".." "utils.tcl"]

proc audit_list {} {
    set conn [db_connect $::env(DB_USER) $::env(DB_PASSWORD) $::env(DB_CONNECT_STRING)]
    if {$conn eq ""} {
        ::request send "{\"error\":\"DB connect failed\"}" 500 "Content-Type" "application/json"
        return
    }
    if {[catch {set rows [db_select $conn "SELECT id, event_type, event_by, details, created_at FROM cb_audit ORDER BY id DESC"]} err]} {
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
