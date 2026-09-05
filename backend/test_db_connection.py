import os
import socket
import sys
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, SQLAlchemyError

# Load environment
backend_dir = Path(__file__).resolve().parent
env_path = backend_dir / ".env"

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")


def mask_url(url_str: str) -> str:
    """Mask credentials in connection string for safe printing."""
    if not url_str:
        return "<EMPTY>"
    try:
        parsed = urlparse(url_str)
        user_info = ""
        if parsed.username:
            user_info = f"{parsed.username}:***@"
        return f"{parsed.scheme}://{user_info}{parsed.hostname or 'localhost'}:{parsed.port or 5432}{parsed.path}"
    except Exception:
        return "postgresql+psycopg://***@localhost:5432/peoplepay360"


def check_host_port(host: str, port: int, timeout: float = 3.0) -> bool:
    """Test TCP connectivity to PostgreSQL host and port."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False


def test_database_connection():
    print("=" * 60)
    print("PeoplePay360 Database Environment & Connectivity Test")
    print("=" * 60)

    if not DATABASE_URL:
        print("[FAIL] DATABASE_URL is missing in environment or backend/.env.")
        return

    print(f"Target Configuration: {mask_url(DATABASE_URL)}")

    # Parse host, port, dbname, user
    try:
        parsed = urlparse(DATABASE_URL)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        dbname = parsed.path.lstrip("/") or "peoplepay360"
        user = parsed.username or "postgres"
    except Exception as e:
        print(f"[FAIL] Error parsing DATABASE_URL: {e}")
        return

    # Check TCP reachability
    print(f"\n1. Checking host & port reachability ({host}:{port})...")
    is_reachable = check_host_port(host, port)
    if is_reachable:
        print(f"   [PASS] PostgreSQL server is reachable at {host}:{port}.")
    else:
        print(f"   [FAIL] Could not reach PostgreSQL server at {host}:{port}.")
        print("          Ensure PostgreSQL service is running and listening on port 5432.")
        return

    # Check if placeholder password is still present
    if "YOUR_POSTGRES_PASSWORD" in DATABASE_URL:
        print("\n2. Authentication & Connection:")
        print("   [INFO] Placeholder 'YOUR_POSTGRES_PASSWORD' detected in backend/.env.")
        print("   [PENDING] PostgreSQL connection test is pending because the real local PostgreSQL password must be entered manually in backend/.env.")
        print("\nSummary: PostgreSQL server is reachable, configuration is ready.")
        return

    # Attempt non-destructive SQLAlchemy connection
    print(f"\n2. Testing SQLAlchemy 2.0 connection with psycopg 3 to database '{dbname}' as user '{user}'...")
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            if result == 1:
                print("   [PASS] Authentication successful.")
                print(f"   [PASS] Database '{dbname}' exists and is accessible.")
                print("   [PASS] SQLAlchemy connection established successfully.")
                print("   [PASS] Non-destructive query executed: SELECT 1 -> 1")
                print("   [INFO] No database tables were created or modified.")
    except OperationalError as oe:
        err_msg = str(oe.orig) if hasattr(oe, "orig") else str(oe)
        print(f"   [FAIL] Connection failed: {err_msg}")
        if "password authentication failed" in err_msg.lower():
            print("          -> Authentication failed. Please check the password in backend/.env.")
        elif "does not exist" in err_msg.lower():
            print(f"          -> Database '{dbname}' does not exist on the PostgreSQL server.")
            print(f"             (Note: Not creating database automatically as per task instructions).")
        else:
            print(f"          -> Operational error details: {err_msg}")
    except SQLAlchemyError as se:
        print(f"   [FAIL] SQLAlchemy error occurred: {se}")
    except Exception as ex:
        print(f"   [FAIL] Unexpected error: {ex}")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    test_database_connection()
