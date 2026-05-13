import { useEffect, useRef } from "react";
import { getWsChatUrl } from "@/lib/api";

export type SupportChatMessage = {
  id: string;
  threadUserId: string;
  authorId: string;
  authorRole: "user" | "admin";
  text: string;
  createdAt: string;
};

export type SupportWsEvent = {
  type: "support_message";
  threadUserId: string;
  message: SupportChatMessage;
};

export function useSupportWebSocket(token: string | null | undefined, onEvent: (ev: SupportWsEvent) => void) {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(getWsChatUrl(token));
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(String(e.data)) as SupportWsEvent;
        if (data.type === "support_message") handler.current(data);
      } catch {
        /* ignore */
      }
    };
    return () => {
      ws.close();
    };
  }, [token]);
}
