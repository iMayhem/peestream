import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const WS_URL = "wss://providers.peestream.in/ws";

type User = { user_id: string; username: string };

type RoomState = {
  video_url: string | null;
  video_type: string | null;
  is_playing: boolean;
  position: number;
};

type ChatMsg = { user_id: string; username: string; text: string };

function createConnection(): WebSocket {
  return new WebSocket(WS_URL);
}

export function WatchTogetherPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRoom = searchParams.get("room");
  const initialUrl = searchParams.get("url");

  const [page, setPage] = useState<"home" | "room">(initialRoom ? "room" : "home");
  const [roomId, setRoomId] = useState<string | null>(initialRoom);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState(() => {
    const saved = localStorage.getItem("wt_username");
    return saved || "";
  });
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [roomState, setRoomState] = useState<RoomState>({
    video_url: null,
    video_type: null,
    is_playing: false,
    position: 0,
  });
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    const ws = createConnection();
    wsRef.current = ws;

    ws.onopen = () => {
      if (initialRoom) {
        const name = username || `User-${Math.random().toString(36).slice(2, 6)}`;
        send({ type: "join_room", room_id: initialRoom, username: name });
      }
    };

    ws.onmessage = (e) => {
      let data: any;
      try {
        data = JSON.parse(e.data);
      } catch {
        return;
      }

      switch (data.type) {
        case "connected":
          break;
        case "room_created":
          setRoomId(data.room_id);
          window.history.replaceState(null, "", `/watch-together?room=${data.room_id}`);
          if (initialUrl) {
            send({ type: "join_room", room_id: data.room_id, username: username.trim() });
          }
          break;
        case "room_joined":
          setUserId(data.user_id);
          setUsers(data.users || []);
          setJoined(true);
          setPage("room");
          if (data.state) {
            setRoomState({
              video_url: data.state.video_url || null,
              video_type: data.state.video_type || null,
              is_playing: data.state.is_playing || false,
              position: data.state.position || 0,
            });
          }
          if (initialUrl && !data.state?.video_url) {
            send({ type: "video_change", url: initialUrl, type: "hls" });
          }
          break;
        case "user_joined":
          setUsers(data.users || []);
          break;
        case "user_left":
          setUsers(data.users || []);
          break;
        case "chat_message":
          setMessages((prev) => [...prev, { user_id: data.user_id, username: data.username, text: data.text }]);
          break;
        case "video_action":
          setRoomState((prev) => ({
            ...prev,
            is_playing: data.is_playing,
            position: data.position,
          }));
          break;
        case "video_change":
          setRoomState((prev) => ({
            ...prev,
            video_url: data.url,
            video_type: data.video_type,
            is_playing: false,
            position: 0,
          }));
          break;
        case "error":
          setError(data.message);
          break;
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    ws.onerror = () => {};
  }, [initialRoom, username, send]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCreateRoom = () => {
    if (!username.trim()) return setError("Enter a name");
    localStorage.setItem("wt_username", username);
    setError("");
    send({ type: "create_room" });
  };

  const handleJoinRoom = () => {
    const code = prompt("Enter room code:");
    if (!code) return;
    if (!username.trim()) return setError("Enter a name");
    localStorage.setItem("wt_username", username);
    setError("");
    window.history.replaceState(null, "", `/watch-together?room=${code}`);
    setRoomId(code);
    send({ type: "join_room", room_id: code, username: username.trim() });
  };

  const handleSendChat = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).elements.namedItem("chat") as HTMLInputElement;
    const text = input.value.trim();
    if (!text) return;
    send({ type: "chat_message", text });
    input.value = "";
  };

  const [showCopied, setShowCopied] = useState(false);
  const copyInviteLink = () => {
    const link = `${window.location.origin}/watch-together?room=${roomId}`;
    navigator.clipboard.writeText(link);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  if (page === "home") {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "#0f0f0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{
          background: "#1a1a1a",
          borderRadius: 16,
          padding: 40,
          width: 380,
          maxWidth: "90vw",
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Watch Together</h1>
          <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
            Create a room or join an existing one
          </p>

          <label style={{ fontSize: 13, color: "#aaa", display: "block", marginBottom: 6 }}>
            Your Name
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name..."
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #333",
              background: "#121212",
              color: "#fff",
              fontSize: 14,
              marginBottom: 16,
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          {error && <p style={{ color: "#ff4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button
            onClick={handleCreateRoom}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              border: "none",
              background: "#3b82f6",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 12,
            }}
          >
            Create Room
          </button>

          <button
            onClick={handleJoinRoom}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              border: "1px solid #444",
              background: "transparent",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Join Room
          </button>

          <button
            onClick={() => navigate(-1)}
            style={{
              marginTop: 20,
              background: "none",
              border: "none",
              color: "#888",
              fontSize: 13,
              cursor: "pointer",
              display: "block",
              width: "100%",
              textAlign: "center",
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      background: "#0f0f0f",
      color: "#fff",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        background: "#1a1a1a",
        borderBottom: "1px solid #222",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Watch Together</span>
          <span style={{ fontSize: 12, color: "#666" }}>Room: {roomId}</span>
          <span style={{ fontSize: 12, color: "#3b82f6" }}>{users.length} online</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={copyInviteLink}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid #444",
              background: "transparent",
              color: "#fff",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {showCopied ? "Copied!" : "Invite"}
          </button>
          <button
            onClick={() => { navigate("/"); }}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              background: "#333",
              color: "#aaa",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Leave
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        display: "flex",
        flex: 1,
        overflow: "hidden",
      }}>
        {/* Left: Video */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          background: "#000",
        }}>
          {roomState.video_url ? (
            <video
              key={roomState.video_url}
              src={roomState.video_url}
              controls
              style={{
                width: "100%",
                maxHeight: "100%",
                borderRadius: 8,
              }}
            />
          ) : (
            <p style={{ color: "#555", fontSize: 14 }}>No video loaded. Start a video from the player to share.</p>
          )}
        </div>

        {/* Right: Chat */}
        <div style={{
          width: 320,
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid #222",
          background: "#111",
        }}>
          <div
            ref={chatRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {messages.map((msg, i) => (
              <div key={i} style={{ fontSize: 13, lineHeight: 1.5 }}>
                <span style={{ color: "#3b82f6", fontWeight: 600, marginRight: 6 }}>
                  {msg.username}:
                </span>
                <span style={{ color: "#ccc" }}>{msg.text}</span>
              </div>
            ))}
            {messages.length === 0 && (
              <p style={{ color: "#555", fontSize: 13, textAlign: "center", marginTop: 40 }}>
                No messages yet
              </p>
            )}
          </div>

          <form
            onSubmit={handleSendChat}
            style={{
              display: "flex",
              gap: 8,
              padding: "12px 16px",
              borderTop: "1px solid #222",
            }}
          >
            <input
              name="chat"
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #333",
                background: "#1a1a1a",
                color: "#fff",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#3b82f6",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </form>

          {/* Users */}
          <div style={{
            padding: "10px 16px",
            borderTop: "1px solid #222",
            fontSize: 12,
            color: "#666",
          }}>
            {users.map((u) => (
              <span key={u.user_id} style={{ marginRight: 12 }}>
                {u.username}{u.user_id === userId ? " (you)" : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WatchTogetherPage;
