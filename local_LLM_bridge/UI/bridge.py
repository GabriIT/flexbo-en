import os
import time
import logging
from typing import Any, Dict, List

import requests
from requests import Session, RequestException

# --- Configuration ---
API_KEY = os.getenv("API_KEY", "secret")  # Replace or set via environment
THREADS_BASE_URL = os.getenv("THREADS_BASE_URL", "http://localhost:8000/api")
# THREADS_BASE_URL = os.getenv("THREADS_BASE_URL", "http://localhost/api")
LLM_API_URL = os.getenv("LLM_API_URL", "http://localhost:5001/ai")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "5"))  # seconds

# --- Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

# --- HTTP Session ---
session = Session()
session.headers.update({
    "X-API-KEY": API_KEY,
    "Content-Type": "application/json"
})


def get_llm_response(prompt: str, timeout: float = 10.0) -> str:
    """
    Send a prompt to the LLM backend and return its response.
    Raises on network errors or unexpected payloads.
    """
    try:
        logger.debug(f"Sending prompt to LLM: {prompt}")
        resp = session.post(LLM_API_URL, json={"Prompt": prompt}, timeout=timeout)
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, dict) or "Response" not in data:
            raise ValueError(f"Invalid LLM response format: {data}")
        return data["Response"]
    except RequestException as e:
        logger.error(f"Network error when calling LLM: {e}")
        raise
    except ValueError as e:
        logger.error(e)
        raise


def fetch_pending_threads() -> List[Dict[str, Any]]:
    """
    Retrieve the list of pending threads to process.
    Returns an empty list on error or if no threads.
    """
    try:
        resp = session.get(f"{THREADS_BASE_URL}/thread/pending")
        resp.raise_for_status()
        payload = resp.json()
        return payload if isinstance(payload, list) else []
    except RequestException as e:
        logger.error(f"Error fetching pending threads: {e}")
        return []


def process_thread(thread: Dict[str, Any]) -> None:
    """
    Fetch the latest message from a thread, get an LLM response, and post the answer back.
    """
    thread_id = thread.get("id")
    if thread_id is None:
        logger.warning("Skipping thread without 'id'")
        return

    try:
        # Get prompt messages for this thread
        resp = session.get(f"{THREADS_BASE_URL}/thread/{thread_id}/prompt/messages")
        resp.raise_for_status()
        messages = resp.json().get("messages", [])

        if not messages:
            logger.info(f"No messages in thread {thread_id}")
            return

        latest_content = messages[-1].get("content", "")
        answer = get_llm_response(latest_content)

        # Post the answer
        post_resp = session.post(
            f"{THREADS_BASE_URL}/thread/{thread_id}/prompt/answer",
            json={"content": answer}
        )
        post_resp.raise_for_status()
        logger.info(f"Answered thread {thread_id}")

    except RequestException as e:
        logger.error(f"Network error processing thread {thread_id}: {e}")
    except Exception as e:
        logger.error(f"Unexpected error in thread {thread_id}: {e}")


def main() -> None:
    """Main polling loop."""
    logger.info("Starting bridge service...")
    while True:
        threads = fetch_pending_threads()
        if not threads:
            logger.debug("No pending threads.")
        else:
            logger.info(f"Processing {len(threads)} threads.")
            for thread in threads:
                process_thread(thread)
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
