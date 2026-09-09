import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.jsx';
import SidebarNav from '../components/SidebarNav.jsx';
import Avatar from '../components/Avatar.jsx';
import CreatePost from '../modals/CreatePost.jsx';
import {
  Send,
  Search,
  ArrowLeft,
  Circle,
  MessageCircle,
  Users,
  Smile,
  Sparkles,
  Check,
  CheckCheck,
  UserCheck
} from 'lucide-react';
import '../styles/App.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://social-media-clone-di9z.onrender.com/api';
const SOCKET_URL = API_URL.replace(/\/api$/, '');

const socket = io(SOCKET_URL, {
  secure: true,
  transports: ['websocket', 'polling']
});

const QUICK_REACTIONS = ['❤️', '😂', '🔥', '👍', '👋', '🎉'];

function MessagesPage() {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'friends'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [onlineUsersMap, setOnlineUsersMap] = useState(new Map());
  const [readMessageIds, setReadMessageIds] = useState(new Set());
  const [showCreatePost, setShowCreatePost] = useState(false);

  const messagesEndRef = useRef(null);

  // 1. Fetch conversations list
  const fetchConversations = useCallback(async () => {
    if (!currentUser?.user_id) return;
    try {
      const res = await fetch(`${API_URL}/conversations/${currentUser.user_id}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách hội thoại:', err);
    }
  }, [currentUser]);

  // 2. Fetch friends list
  const fetchFriends = useCallback(async () => {
    if (!currentUser?.user_id) return;
    try {
      const res = await fetch(`${API_URL}/friends/${currentUser.user_id}/list`);
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách bạn bè:', err);
    }
  }, [currentUser]);

  // Initial load
  useEffect(() => {
    if (currentUser?.user_id) {
      fetchConversations();
      fetchFriends();
      socket.emit('user_online', currentUser.user_id);
    }
  }, [currentUser, fetchConversations, fetchFriends]);

  // Check if a specific user was requested via route param or localStorage
  useEffect(() => {
    if (paramUserId && currentUser) {
      // Find among conversations or friends or fetch user
      const found =
        conversations.find((c) => String(c.user_id) === String(paramUserId)) ||
        friends.find((f) => String(f.user_id) === String(paramUserId));
      if (found) {
        setActiveFriend(found);
      } else {
        // Fetch user info
        fetch(`${API_URL}/users/id/${paramUserId}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((u) => {
            if (u) setActiveFriend(u);
          })
          .catch(() => {});
      }
    } else {
      // Check localStorage for activeChatUser
      const stored = localStorage.getItem('activeChatUser');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setActiveFriend(parsed);
          localStorage.removeItem('activeChatUser');
        } catch (e) {}
      }
    }
  }, [paramUserId, conversations, friends, currentUser]);

  // 3. Fetch messages when activeFriend changes
  useEffect(() => {
    if (!currentUser?.user_id || !activeFriend?.user_id) return;

    let isMounted = true;
    setLoadingMessages(true);

    fetch(`${API_URL}/messages/${currentUser.user_id}/${activeFriend.user_id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isMounted) {
          setMessages(data);
          setLoadingMessages(false);
          socket.emit('mark_messages_read', {
            reader_id: currentUser.user_id,
            sender_id: activeFriend.user_id
          });
        }
      })
      .catch((err) => {
        console.error('Lỗi tải tin nhắn:', err);
        if (isMounted) setLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser, activeFriend]);

  // 4. Socket.io Real-time handlers
  useEffect(() => {
    if (!currentUser?.user_id) return;

    const handleReceiveMessage = (newMsg) => {
      // Update conversations list
      fetchConversations();

      const isCurrentActive =
        activeFriend &&
        ((Number(newMsg.sender_id) === Number(currentUser.user_id) &&
          Number(newMsg.receiver_id) === Number(activeFriend.user_id)) ||
          (Number(newMsg.sender_id) === Number(activeFriend.user_id) &&
            Number(newMsg.receiver_id) === Number(currentUser.user_id)));

      if (isCurrentActive) {
        setMessages((prev) => [...prev, newMsg]);
        if (Number(newMsg.sender_id) === Number(activeFriend.user_id)) {
          socket.emit('mark_messages_read', {
            reader_id: currentUser.user_id,
            sender_id: activeFriend.user_id
          });
        }
      }
    };

    const handlePresenceChanged = ({ userId, online }) => {
      setOnlineUsersMap((prev) => {
        const next = new Map(prev);
        next.set(Number(userId), online);
        return next;
      });
    };

    const handleUserTyping = ({ user_id, isTyping: typing }) => {
      if (activeFriend && Number(user_id) === Number(activeFriend.user_id)) {
        setOtherIsTyping(typing);
      }
    };

    const handleMessagesRead = ({ sender_id }) => {
      if (Number(sender_id) === Number(currentUser?.user_id)) {
        setReadMessageIds(
          (prev) =>
            new Set([
              ...prev,
              ...messages
                .filter((m) => Number(m.sender_id) === Number(currentUser.user_id))
                .map((m) => m.id || m.message_id)
            ])
        );
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('presence_changed', handlePresenceChanged);
    socket.on('user_typing', handleUserTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('presence_changed', handlePresenceChanged);
      socket.off('user_typing', handleUserTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [currentUser, activeFriend, messages, fetchConversations]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherIsTyping]);

  // 5. Send message action
  const handleSendMessage = (contentToSend) => {
    const msgText = (contentToSend || text).trim();
    if (!msgText || !activeFriend || !currentUser) return;

    socket.emit('send_message', {
      sender_id: currentUser.user_id,
      receiver_id: activeFriend.user_id,
      message_text: msgText
    });

    setText('');
    setIsTyping(false);
    socket.emit('typing', {
      sender_id: currentUser.user_id,
      receiver_id: activeFriend.user_id,
      isTyping: false
    });
  };

  const isFriendOnline = (fId) => {
    return Boolean(onlineUsersMap.get(Number(fId)));
  };

  // Filter list by search query
  const filteredConversations = conversations.filter((c) =>
    (c.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFriends = friends.filter((f) =>
    (f.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If not logged in
  if (!currentUser) {
    return (
      <div className="app-shell">
        <div className="app-layout">
          <SidebarNav onCreatePost={() => setShowCreatePost(true)} />
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
            <div className="messages-login-card">
              <MessageCircle size={48} color="#6366f1" style={{ marginBottom: '12px' }} />
              <h2>Đăng nhập để nhắn tin</h2>
              <p>Kết nối và trò chuyện riêng tư với bạn bè của bạn.</p>
              <button
                type="button"
                className="btn-profile-primary"
                onClick={() => navigate('/login')}
                style={{ marginTop: '16px' }}
              >
                Đăng nhập ngay
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-layout">
        <SidebarNav onCreatePost={() => setShowCreatePost(true)} />

        <main className="messages-main-container">
          <div className="messages-layout-box">
            {/* ========================================================= */}
            {/* LEFT COLUMN: CONVERSATIONS & FRIENDS LIST                */}
            {/* ========================================================= */}
            <div
              className={`messages-sidebar-pane ${activeFriend ? 'mobile-hidden' : 'mobile-visible'}`}
            >
              {/* Header */}
              <div className="messages-sidebar-header">
                <div className="messages-user-headline">
                  <Avatar user={currentUser} size={36} />
                  <span className="messages-user-title">{currentUser.username}</span>
                </div>
                <div className="messages-header-badge">Direct</div>
              </div>

              {/* Search Bar */}
              <div className="messages-search-bar">
                <Search size={16} className="messages-search-icon" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm bạn bè, cuộc trò chuyện..."
                  aria-label="Tìm kiếm cuộc trò chuyện"
                />
              </div>

              {/* Tabs: Hộp thư / Bạn bè */}
              <div className="messages-tab-selector">
                <button
                  type="button"
                  className={`messages-tab-pill ${activeTab === 'inbox' ? 'active' : ''}`}
                  onClick={() => setActiveTab('inbox')}
                >
                  <MessageCircle size={15} />
                  <span>Hộp thư ({conversations.length})</span>
                </button>
                <button
                  type="button"
                  className={`messages-tab-pill ${activeTab === 'friends' ? 'active' : ''}`}
                  onClick={() => setActiveTab('friends')}
                >
                  <Users size={15} />
                  <span>Bạn bè ({friends.length})</span>
                </button>
              </div>

              {/* List Content */}
              <div className="messages-contacts-scroll no-scrollbar">
                {activeTab === 'inbox' ? (
                  filteredConversations.length > 0 ? (
                    filteredConversations.map((user) => {
                      const isSelected = activeFriend && Number(activeFriend.user_id) === Number(user.user_id);
                      const online = isFriendOnline(user.user_id);
                      return (
                        <div
                          key={user.user_id}
                          className={`messages-contact-item ${isSelected ? 'active' : ''}`}
                          onClick={() => setActiveFriend(user)}
                        >
                          <div className="messages-avatar-wrapper">
                            <Avatar user={user} size={46} />
                            <Circle
                              size={11}
                              className={`messages-online-badge ${online ? 'online' : 'offline'}`}
                            />
                          </div>
                          <div className="messages-contact-meta">
                            <div className="messages-contact-name">{user.username}</div>
                            <div className="messages-contact-preview">
                              {online ? 'Đang hoạt động' : 'Bấm để trò chuyện'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="messages-empty-notice">
                      <MessageCircle size={32} style={{ opacity: 0.35, marginBottom: '8px' }} />
                      <p>Chưa có cuộc trò chuyện nào.</p>
                      <button
                        type="button"
                        className="messages-btn-link"
                        onClick={() => setActiveTab('friends')}
                      >
                        Nhắn tin cho bạn bè ngay
                      </button>
                    </div>
                  )
                ) : (
                  filteredFriends.length > 0 ? (
                    filteredFriends.map((friend) => {
                      const isSelected = activeFriend && Number(activeFriend.user_id) === Number(friend.user_id);
                      const online = isFriendOnline(friend.user_id);
                      return (
                        <div
                          key={friend.user_id}
                          className={`messages-contact-item ${isSelected ? 'active' : ''}`}
                          onClick={() => setActiveFriend(friend)}
                        >
                          <div className="messages-avatar-wrapper">
                            <Avatar user={friend} size={46} />
                            <Circle
                              size={11}
                              className={`messages-online-badge ${online ? 'online' : 'offline'}`}
                            />
                          </div>
                          <div className="messages-contact-meta">
                            <div className="messages-contact-name">{friend.username}</div>
                            <div className="messages-contact-preview">
                              <UserCheck size={13} style={{ display: 'inline', marginRight: '4px' }} />
                              Bạn bè {online && '• Đang online'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="messages-empty-notice">
                      <Users size={32} style={{ opacity: 0.35, marginBottom: '8px' }} />
                      <p>Chưa có bạn bè nào trong danh sách.</p>
                      <button
                        type="button"
                        className="messages-btn-link"
                        onClick={() => navigate('/explore')}
                      >
                        Khám phá kết bạn ngay
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT COLUMN: ACTIVE DIRECT CHAT WINDOW                   */}
            {/* ========================================================= */}
            <div
              className={`messages-chat-pane ${!activeFriend ? 'mobile-hidden' : 'mobile-visible'}`}
            >
              {activeFriend ? (
                <div className="messages-active-chat-container">
                  {/* Chat Header */}
                  <div className="messages-chat-header">
                    <button
                      type="button"
                      className="messages-back-btn"
                      onClick={() => setActiveFriend(null)}
                      title="Quay lại danh sách"
                      aria-label="Quay lại danh sách"
                    >
                      <ArrowLeft size={20} />
                    </button>

                    <Link
                      to={`/profile/${activeFriend.username}`}
                      className="messages-chat-header-profile"
                      title="Xem trang cá nhân"
                    >
                      <div className="messages-avatar-wrapper">
                        <Avatar user={activeFriend} size={42} />
                        <Circle
                          size={10}
                          className={`messages-online-badge ${
                            isFriendOnline(activeFriend.user_id) ? 'online' : 'offline'
                          }`}
                        />
                      </div>
                      <div className="messages-chat-header-info">
                        <span className="messages-chat-header-name">{activeFriend.username}</span>
                        <span className="messages-chat-header-status">
                          {otherIsTyping
                            ? 'đang soạn tin...'
                            : isFriendOnline(activeFriend.user_id)
                            ? 'Đang hoạt động'
                            : 'Ngoại tuyến'}
                        </span>
                      </div>
                    </Link>
                  </div>

                  {/* Message History Area */}
                  <div className="messages-chat-body no-scrollbar">
                    {loadingMessages ? (
                      <div className="messages-chat-loading">Đang tải tin nhắn...</div>
                    ) : messages.length === 0 ? (
                      <div className="messages-chat-start-prompt">
                        <Avatar user={activeFriend} size={72} />
                        <h4 style={{ margin: '12px 0 4px', fontSize: '17px' }}>{activeFriend.username}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '300px' }}>
                          Gửi lời chào đầu tiên và bắt đầu cuộc trò chuyện thân thiết! 👋
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isMe = Number(msg.sender_id) === Number(currentUser.user_id);
                        const isLastFromMe =
                          isMe &&
                          index ===
                            messages.map((m) => Number(m.sender_id) === Number(currentUser.user_id)).lastIndexOf(true);
                        const isRead = readMessageIds.has(msg.id || msg.message_id) || msg.is_read;

                        return (
                          <div
                            key={msg.id || msg.message_id || index}
                            className={`messages-bubble-row ${isMe ? 'row-me' : 'row-them'}`}
                          >
                            {!isMe && (
                              <div className="messages-bubble-avatar">
                                <Avatar user={activeFriend} size={28} />
                              </div>
                            )}

                            <div className="messages-bubble-wrap">
                              <div className={`messages-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                                {msg.message_text}
                              </div>

                              {isMe && isLastFromMe && (
                                <div className="messages-read-status">
                                  {isRead ? (
                                    <>
                                      <CheckCheck size={12} color="#60a5fa" />
                                      <span>Đã xem</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check size={12} />
                                      <span>Đã gửi</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {otherIsTyping && (
                      <div className="messages-typing-row">
                        <div className="messages-bubble-avatar">
                          <Avatar user={activeFriend} size={28} />
                        </div>
                        <div className="messages-typing-bubble">
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Reactions Bar */}
                  <div className="messages-quick-reactions">
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="messages-reaction-btn"
                        onClick={() => handleSendMessage(emoji)}
                        title={`Gửi nhanh ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input Bar */}
                  <form
                    className="messages-input-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                  >
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onFocus={() => {
                        if (!isTyping) {
                          setIsTyping(true);
                          socket.emit('typing', {
                            sender_id: currentUser.user_id,
                            receiver_id: activeFriend.user_id,
                            isTyping: true
                          });
                        }
                      }}
                      onBlur={() => {
                        setIsTyping(false);
                        socket.emit('typing', {
                          sender_id: currentUser.user_id,
                          receiver_id: activeFriend.user_id,
                          isTyping: false
                        });
                      }}
                      placeholder={`Nhắn tin cho ${activeFriend.username}...`}
                      aria-label="Soạn tin nhắn"
                    />

                    <button
                      type="submit"
                      disabled={!text.trim()}
                      className={`messages-send-btn ${text.trim() ? 'active' : ''}`}
                      title="Gửi tin nhắn"
                      aria-label="Gửi tin nhắn"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              ) : (
                /* Empty Placeholder State (Instagram Direct Style) */
                <div className="messages-direct-placeholder">
                  <div className="messages-placeholder-circle">
                    <Send size={38} className="messages-placeholder-icon" />
                  </div>
                  <h3 className="messages-placeholder-title">Tin nhắn của bạn</h3>
                  <p className="messages-placeholder-sub">
                    Gửi ảnh, tin nhắn riêng tư hoặc bắt đầu trò chuyện với bạn bè của bạn.
                  </p>
                  <button
                    type="button"
                    className="btn-profile-primary"
                    onClick={() => setActiveTab('friends')}
                  >
                    Gửi tin nhắn ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* CREATE POST MODAL IF TRIGGERED */}
      {showCreatePost && currentUser && (
        <div className="modal-backdrop" onClick={() => setShowCreatePost(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <CreatePost onPostCreated={() => setShowCreatePost(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;
