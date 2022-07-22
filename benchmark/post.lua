wrk.method = "POST"
wrk.body   = string.rep("-TEST_STRING-", 8192)
wrk.headers["Content-Type"] = "text/plain"
