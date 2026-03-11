// hooks/useSessionLock.js
import { useState, useEffect, useRef, useCallback } from "react";

const LOCK_PREFIX = "matura_session_lock_";
const HEARTBEAT_INTERVAL_MS = 5_000;
const LOCK_TTL_MULTIPLIER = 3;
const CLAIM_TIMEOUT_MS = 150;

function generateTabId() {
  return `tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function readLock(examId) {
  try {
    const raw = localStorage.getItem(LOCK_PREFIX + examId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLock(examId, tabId) {
  try {
    const expiresAt = Date.now() + HEARTBEAT_INTERVAL_MS * LOCK_TTL_MULTIPLIER;
    localStorage.setItem(
      LOCK_PREFIX + examId,
      JSON.stringify({ tabId, claimedAt: Date.now(), expiresAt }),
    );
  } catch {
    console.warn("[useSessionLock] Nije moguće zapisati session lock.");
  }
}

function clearLock(examId, tabId) {
  try {
    const existing = readLock(examId);
    if (existing?.tabId === tabId) {
      localStorage.removeItem(LOCK_PREFIX + examId);
    }
  } catch {
    // ignore
  }
}

export function useSessionLock(examId) {
  const tabIdRef = useRef(generateTabId());
  const [isBlockedByOtherTab, setIsBlockedByOtherTab] = useState(false);
  const [isCheckingLock, setIsCheckingLock] = useState(true);
  const channelRef = useRef(null);
  const heartbeatRef = useRef(null);
  const isOwnerRef = useRef(false);

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) return;
    heartbeatRef.current = setInterval(() => {
      if (isOwnerRef.current) {
        writeLock(examId, tabIdRef.current);
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, [examId]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!examId) {
      setIsCheckingLock(false);
      return;
    }

    const tabId = tabIdRef.current;

    let channel = null;
    let broadcastBlocked = false;

    const SUPPORTS_BROADCAST = typeof BroadcastChannel !== "undefined";

    if (SUPPORTS_BROADCAST) {
      channel = new BroadcastChannel(`matura_exam_${examId}`);
      channelRef.current = channel;

      channel.onmessage = (e) => {
        const { type, senderTabId } = e.data ?? {};

        if (type === "exam:claim" && senderTabId !== tabId) {
          if (isOwnerRef.current) {
            channel.postMessage({ type: "exam:active", senderTabId: tabId });
          }
        }

        if (type === "exam:active" && senderTabId !== tabId) {
          broadcastBlocked = true;
        }

        if (type === "exam:released" && senderTabId !== tabId) {
          if (isBlockedByOtherTab) {
            setIsBlockedByOtherTab(false);
          }
        }
      };

      channel.postMessage({ type: "exam:claim", senderTabId: tabId });
    }

    const checkLock = () => {
      const existing = readLock(examId);
      const now = Date.now();

      if (!existing) return false;
      if (existing.tabId === tabId) return false;
      if (existing.expiresAt && now > existing.expiresAt) {
        localStorage.removeItem(LOCK_PREFIX + examId);
        return false;
      }
      return true;
    };

    const claimTimer = setTimeout(() => {
      const lsBlocked = checkLock();
      const blocked = broadcastBlocked || lsBlocked;

      if (blocked) {
        setIsBlockedByOtherTab(true);
        setIsCheckingLock(false);

        const pollId = setInterval(() => {
          const stillBlocked = checkLock();
          if (!stillBlocked) {
            clearInterval(pollId);
            setIsBlockedByOtherTab(false);
          }
        }, HEARTBEAT_INTERVAL_MS);

        heartbeatRef.current = pollId;
      } else {
        isOwnerRef.current = true;
        writeLock(examId, tabId);
        startHeartbeat();
        setIsCheckingLock(false);
      }
    }, CLAIM_TIMEOUT_MS);

    return () => {
      clearTimeout(claimTimer);
      stopHeartbeat();

      if (isOwnerRef.current) {
        clearLock(examId, tabId);
        channelRef.current?.postMessage({
          type: "exam:released",
          senderTabId: tabId,
        });
        isOwnerRef.current = false;
      }

      channelRef.current?.close();
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  return { isBlockedByOtherTab, isCheckingLock };
}
