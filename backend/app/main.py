from fastapi import FastAPI

app = FastAPI(title="HelpDesk API")


@app.get("/api/health")
def health():
    return {"status": "ok"}