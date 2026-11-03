import uvicorn

if __name__ == "__main__":
    # log_config=None keeps uvicorn on the root JSON logger set up in telemetry.py.
    uvicorn.run("app:app", host="0.0.0.0", port=8000, log_config=None, access_log=False, proxy_headers=True,
                forwarded_allow_ips="*")
