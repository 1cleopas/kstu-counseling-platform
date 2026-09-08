import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageBanner from '../components/PageBanner';
import { formatDbDate } from '../utils/dates';

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [counselors, setCounselors] = useState([]);
  const [students, setStudents] = useState([]);
  const [partnerId, setPartnerId] = useState('');
  const [adminCounselorId, setAdminCounselorId] = useState('');
  const activeIdRef = useRef(null);

  const socket = useMemo(() => {
    const token = localStorage.getItem('kstu_token');
    return io(import.meta.env.DEV ? window.location.origin : import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      auth: { token },
      autoConnect: false
    });
  }, []);

  async function loadConversations() {
    const { data } = await api.get('/chat/conversations');
    setConversations(data.conversations || []);
    setActiveId((current) => current || data.conversations?.[0]?.id || null);
  }

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    loadConversations();
    if (user.role === 'student') {
      api.get('/admin/counselors').then((res) => setCounselors(res.data.counselors || []));
    } else {
      api.get('/clients').then((res) => {
        const unique = [];
        for (const client of res.data.clients || []) {
          if (!unique.find((s) => Number(s.id) === Number(client.student_id))) {
            unique.push({ id: client.student_id, full_name: client.student_name });
          }
        }
        setStudents(unique);
      });
      if (user.role === 'admin') {
        api.get('/admin/counselors').then((res) => setCounselors(res.data.counselors || []));
      }
    }

    socket.connect();
    socket.on('new_message', (message) => {
      setMessages((prev) => {
        if (Number(message.conversation_id) !== Number(activeIdRef.current)) return prev;
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      loadConversations();
    });

    return () => {
      socket.off('new_message');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!activeId) return;
    socket.emit('join_conversation', activeId);
    api.get(`/chat/conversations/${activeId}/messages`).then((res) => {
      setMessages(res.data.messages || []);
    });
  }, [activeId]);

  async function startConversation(e) {
    e.preventDefault();
    if (!partnerId) return;
    const payload =
      user.role === 'student'
        ? { counselor_id: Number(partnerId) }
        : user.role === 'admin'
          ? { student_id: Number(partnerId), counselor_id: Number(adminCounselorId) }
          : { student_id: Number(partnerId) };
    const { data } = await api.post('/chat/conversations', payload);
    setActiveId(data.conversation.id);
    loadConversations();
  }

  function sendMessage(e) {
    e.preventDefault();
    if (!body.trim() || !activeId) return;
    socket.emit('send_message', { conversationId: activeId, body }, (response) => {
      if (response?.ok) {
        setMessages((prev) =>
          prev.some((m) => m.id === response.message.id) ? prev : [...prev, response.message]
        );
        setBody('');
        loadConversations();
      }
    });
  }

  const active = conversations.find((c) => Number(c.id) === Number(activeId));

  return (
    <div>
      <PageBanner
        image="/images/private-chat.jpg"
        title="Secure chat"
        subtitle="Real-time messaging between students and counselors."
      />

      <form className="panel inline-actions" onSubmit={startConversation} style={{ marginBottom: '1rem' }}>
        {user.role === 'admin' && (
          <select value={adminCounselorId} onChange={(e) => setAdminCounselorId(e.target.value)} required>
            <option value="">Select counselor</option>
            {counselors.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name}
              </option>
            ))}
          </select>
        )}
        <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} required>
          <option value="">
            {user.role === 'student' ? 'Select counselor' : 'Select student'}
          </option>
          {(user.role === 'student' ? counselors : students).map((person) => (
            <option key={person.id} value={person.id}>
              {person.full_name}
            </option>
          ))}
        </select>
        <button className="btn btn-primary">Start / open chat</button>
      </form>

      <div className="chat-layout">
        <div className="panel chat-list">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className={`chat-item ${Number(conv.id) === Number(activeId) ? 'active' : ''}`}
              onClick={() => setActiveId(conv.id)}
            >
              <strong>
                {user.role === 'student'
                  ? conv.counselor_name
                  : user.role === 'admin'
                    ? `${conv.student_name} / ${conv.counselor_name}`
                    : conv.student_name}
              </strong>
              <div className="muted">{conv.last_message || 'No messages yet'}</div>
            </button>
          ))}
        </div>

        <div className="chat-pane">
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--line)' }}>
            <strong>
              {active
                ? user.role === 'student'
                  ? active.counselor_name
                  : user.role === 'admin'
                    ? `${active.student_name} / ${active.counselor_name}`
                    : active.student_name
                : 'Select a conversation'}
            </strong>
          </div>
          <div className="messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`bubble ${Number(message.sender_id) === Number(user.id) ? 'mine' : ''}`}
              >
                <div>{message.body}</div>
                <small>{formatDbDate(message.created_at, 'HH:mm')}</small>
              </div>
            ))}
          </div>
          <form className="chat-input" onSubmit={sendMessage}>
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type a confidential message..."
              disabled={!activeId}
            />
            <button className="btn btn-primary" disabled={!activeId}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
