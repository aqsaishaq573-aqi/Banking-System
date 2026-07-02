# controllers/auth.tcl
# POST /api/auth/login   body: {"username":"...", "password":"..."}
package require json
source [file join [file dirname [info script]] ".." "db.tcl"]
source [file join [file dirname [info script]] ".." "utils.tcl"]

proc auth_login {body} {
    # parse JSON
    set data [parse_json_body $body]
    set username [dict get $data username]
    set plainpw [dict get $data password]

    # connect as CBANK user (credentials should be stored in env or config)
    set conn [db_connect $::env(DB_USER) $::env(DB_PASSWORD) $::env(DB_CONNECT_STRING)]
    if {$conn eq ""} {
        ::request send "{\"error\":\"DB connect failed\"}" 500 "Content-Type" "application/json"
        return
    }

    # query user
    # WARNING: example uses direct substitution; better to prepare/bind to avoid SQL injection
    set sql "SELECT id, username, password_hash, salt, role FROM cb_users WHERE username = '${username}'"
    if {[catch {set rows [db_select $conn $sql]} err]} {
        db_disconnect $conn
        ::request send "{\"error\":\"DB error\"}" 500 "Content-Type" "application/json"
        return
    }
    db_disconnect $conn

    if {[llength $rows] == 0} {
        ::request send "{\"error\":\"Invalid credentials\"}" 401 "Content-Type" "application/json"
        return
    }
    set usr [lindex $rows 0]
    # use the structure produced by db_select: dict with keys in uppercase as Oracle returns
    # try both LOWER/UPPER names
    if {[dict exists $usr password_hash]} {
        set stored [dict get $usr password_hash]
    } elseif {[dict exists $usr PASSWORD_HASH]} {
        set stored [dict get $usr PASSWORD_HASH]
    } else {
        set stored ""
    }
    if {[dict exists $usr salt]} {
        set salt [dict get $usr salt]
    } elseif {[dict exists $usr SALT]} {
        set salt [dict get $usr SALT]
    } else {
        set salt ""
    }

    set calc [hash_password $plainpw $salt]

    if {$calc ne $stored} {
        ::request send "{\"error\":\"Invalid credentials\"}" 401 "Content-Type" "application/json"
        return
    }

    # Generate a basic token (not JWT). For production use JWT. Here we return a simple base64 user id token
    set uid [dict get $usr id]
    set token [binary encode base64 "${uid}:${username}"]
    set resp [dict create token $token user [dict create id $uid username $username role [dict get $usr role]]]
    set txt [json_from_dict $resp]
    ::request send $txt 200 "Content-Type" "application/json"
}
