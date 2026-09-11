
import React, { useState, useEffect } from 'react';
import { safeFetch } from '../utils/api';
import Avatar from '../components/Avatar.jsx';
import '../styles/ShareModal.css';
import {
  X,
  Search,
  Send,
  Check,
  Link2,
  Share2,
  MessageCircle,
  Repeat,
  PlusCircle
} from 'lucide-react';

export default function ShareModal({ post, currentUser, onClose, onPostUpdated }) {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [sentFriendIds, setSentFriendIds] = useState(new Set());
  const [copied, setCopied] = useState(false);
  const [isSharingPost, setIsSharingPost] = useState(false);

  const postUrl = typeof window !== 'undefined'
    ? window.location.origin + '/post/' + (post?.post_id || post?.id)
    : '';

  useEffect(() => {
    let isMounted = true;
    const fetchFriends = async () => {
      if (!currentUser?.user_id) {
        setLoadingFriends(false);
        return;
      }
      try {
        const res = await safeFetch('/friends/' + currentUser.user_id + '/list');
        if (res.ok) {
          const list = await res.json();
          if (isMounted) setFriends(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('Lỗi tải bạn bè để chia sẻ:', err);
      } finally {
        if (isMounted) setLoadingFriends(false);
      }
    };
    fetchFriends();
    return () => { isMounted = false; };
  }, [currentUser]);

  // 1. Sao chép liên kết bài viết
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(postUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = postUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Lỗi sao chép liên kết:', err);
      alert('Không thể sao chép liên kết.');
    }
  };

  // 2. Chia sẻ qua Native Share Sheet của thiết bị di động / browser
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bài viết của @' + (post?.author || post?.username || 'SocialHub'),
          text: post?.content ? (post.content.slice(0, 100) + '...') : 'Xem bài viết này trên SocialHub!',
          url: postUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Lỗi mở share sheet:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // 3. Gửi bài viết qua tin nhắn cho bạn bè
  const handleSendMessageToFriend = async (friend) => {
    if (!currentUser?.user_id) return alert('Vui lòng đăng nhập để gửi tin nhắn!');
    const targetId = Number(friend.user_id || friend.id);
    if (sentFriendIds.has(targetId)) return;

    setSentFriendIds(prev => new Set(prev).add(targetId));

    const authorName = post?.author || post?.username || 'người dùng';
    const postSnippet = post?.content ? ' "' + post.content.slice(0, 60) + (post.content.length > 60 ? '...' : '') + '"' : '';
    const messageText = '[Đã chia sẻ bài viết của @' + authorName + ']' + postSnippet + '\n👉 Xem tại: ' + postUrl;

    try {
      const res = await safeFetch('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUser.user_id,
          receiver_id: targetId,
          message_text: messageText
        })
      });

      if (!res.ok) {
        setSentFriendIds(prev => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
        alert('Không thể gửi tin nhắn.');
      }
    } catch (err) {
      setSentFriendIds(prev => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      console.error('Lỗi khi gửi tin nhắn bài viết:', err);
      alert('Không thể kết nối máy chủ.');
    }
  };

  // Mở trực tiếp khung chat với bạn bè
  const handleOpenChatWithFriend = (friend) => {
    localStorage.setItem('activeChatUser', JSON.stringify({
      user_id: friend.user_id || friend.id,
      username: friend.username
    }));
    window.dispatchEvent(new Event('open-chat'));
    onClose();
  };

  // 4. Chia sẻ lên Story
  const handleShareToStory = () => {
    onClose();
    if (window.innerWidth > 768) {
      alert('Tính năng chia sẻ và đăng Story chỉ hỗ trợ trên thiết bị di động.');
      return;
    }
    window.dispatchEvent(new CustomEvent('open-story-with-post', { detail: post }));
  };

  // 5. Đăng lại lên bảng tin (Repost)
  const handleRepost = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Vui lòng đăng nhập để đăng lại bài viết.');

    const userCaption = window.prompt("Nhập nội dung chia sẻ của bạn (Có thể để trống):");
    if (userCaption === null) return;

    try {
      setIsSharingPost(true);
      const res = await safeFetch('/posts/' + (post.post_id || post.id) + '/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ caption: userCaption })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return alert(errData.message || 'Có lỗi xảy ra khi đăng lại bài viết');
      }

      alert('Đăng lại bài viết lên bảng tin thành công!');
      if (onPostUpdated) onPostUpdated();
      onClose();
    } catch (err) {
      console.error("Lỗi khi đăng lại bài viết:", err);
      alert('Không thể kết nối máy chủ.');
    } finally {
      setIsSharingPost(false);
    }
  };

  const filteredFriends = friends.filter(f =>
    f.username?.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-modal-header">
          <h3 className="share-modal-title">Chia sẻ bài viết</h3>
          <button type="button" className="share-modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Thanh tìm kiếm bạn bè */}
        <div className="share-modal-search-wrap">
          <Search size={16} className="share-search-icon" />
          <input
            type="text"
            className="share-search-input"
            placeholder="Tìm kiếm bạn bè để gửi tin nhắn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Danh sách bạn bè gửi qua tin nhắn Direct */}
        <div className="share-friends-section">
          <span className="share-section-label">Gửi qua tin nhắn cho bạn bè</span>
          <div className="share-friends-list no-scrollbar">
            {loadingFriends ? (
              <div className="share-loading-state">Đang tải danh sách bạn bè...</div>
            ) : filteredFriends.length > 0 ? (
              filteredFriends.map(friend => {
                const friendId = Number(friend.user_id || friend.id);
                const isSent = sentFriendIds.has(friendId);
                return (
                  <div key={friendId} className="share-friend-row">
                    <div className="share-friend-info" onClick={() => handleOpenChatWithFriend(friend)}>
                      <Avatar user={friend} size={42} />
                      <div className="share-friend-meta">
                        <span className="share-friend-name">
                          {friend.username}
                          {friend.is_verified && (
                            <svg className="verified-badge-icon" viewBox="0 0 24 24" width="12" height="12" fill="#0095f6">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          )}
                        </span>
                        <span className="share-friend-sub">Bạn bè</span>
                      </div>
                    </div>
                    <div className="share-friend-actions">
                      <button
                        type="button"
                        className={'btn-share-send' + (isSent ? ' sent' : '')}
                        onClick={() => handleSendMessageToFriend(friend)}
                        disabled={isSent}
                      >
                        {isSent ? (
                          <>
                            <Check size={14} />
                            <span>Đã gửi</span>
                          </>
                        ) : (
                          <>
                            <Send size={13} />
                            <span>Gửi</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn-share-chat-icon"
                        onClick={() => handleOpenChatWithFriend(friend)}
                        title="Mở cuộc trò chuyện"
                      >
                        <MessageCircle size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="share-empty-friends">
                {searchQuery ? 'Không tìm thấy bạn bè phù hợp' : 'Chưa có bạn bè nào trong danh sách'}
              </div>
            )}
          </div>
        </div>

        {/* Các nút tùy chọn chia sẻ nhanh */}
        <div className="share-quick-actions-bar">
          {/* Sao chép liên kết */}
          <button
            type="button"
            className={'share-action-item' + (copied ? ' copied' : '')}
            onClick={handleCopyLink}
          >
            <div className="share-action-icon-circle">
              {copied ? <Check size={18} color="#10b981" /> : <Link2 size={18} />}
            </div>
            <span>{copied ? 'Đã sao chép!' : 'Sao chép link'}</span>
          </button>

          {/* Chia sẻ qua ứng dụng khác / Native share */}
          <button
            type="button"
            className="share-action-item"
            onClick={handleNativeShare}
          >
            <div className="share-action-icon-circle">
              <Share2 size={18} />
            </div>
            <span>Chia sẻ qua...</span>
          </button>

          {/* Chia sẻ lên Story */}
          <button
            type="button"
            className="share-action-item"
            onClick={handleShareToStory}
          >
            <div className="share-action-icon-circle story-icon-bg">
              <PlusCircle size={18} color="#0095f6" />
            </div>
            <span>Lên Story</span>
          </button>

          {/* Đăng lại lên bảng tin */}
          <button
            type="button"
            className="share-action-item"
            onClick={handleRepost}
            disabled={isSharingPost}
          >
            <div className="share-action-icon-circle">
              <Repeat size={18} />
            </div>
            <span>{isSharingPost ? 'Đang đăng...' : 'Đăng lại'}</span>
          </button>
        </div>

        {/* Chia sẻ tới các nền tảng mạng xã hội khác */}
        <div className="share-social-platforms-section">
          <span className="share-section-label">Chia sẻ lên nền tảng khác</span>
          <div className="share-social-buttons-grid">
            {/* Facebook */}
            <a
              href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(postUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="share-social-btn fb"
              title="Chia sẻ lên Facebook"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </a>

            {/* Messenger */}
            <a
              href={'fb-messenger://share/?link=' + encodeURIComponent(postUrl)}
              onClick={(e) => {
                if (!navigator.userAgent.match(/Android|iPhone|iPad/i)) {
                  e.preventDefault();
                  window.open('https://www.facebook.com/dialog/send?link=' + encodeURIComponent(postUrl) + '&app_id=246402793740&redirect_uri=' + encodeURIComponent(postUrl), '_blank');
                }
              }}
              className="share-social-btn messenger"
              title="Chia sẻ qua Messenger"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.082.3 2.23.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.056-3.26-5.963 3.26 6.559-6.963 3.13 3.26 5.89-3.26-6.56 6.963z"/>
              </svg>
              <span>Messenger</span>
            </a>

            {/* Telegram */}
            <a
              href={'https://t.me/share/url?url=' + encodeURIComponent(postUrl) + '&text=' + encodeURIComponent(post?.content ? post.content.slice(0, 100) : 'Xem bài viết này!')}
              target="_blank"
              rel="noopener noreferrer"
              className="share-social-btn telegram"
              title="Chia sẻ qua Telegram"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.892-1.026 4.908-1.464 6.994-.185.882-.544 1.178-.888 1.206-.749.062-1.316-.492-2.042-.968-1.137-.745-1.78-1.209-2.885-1.936-1.277-.841-.449-1.303.278-2.059.19-.197 3.494-3.204 3.558-3.478.008-.035.015-.164-.062-.233-.077-.069-.192-.046-.275-.027-.118.027-1.996 1.27-5.635 3.729-.533.366-1.016.545-1.449.535-.478-.01-1.398-.27-2.083-.493-.84-.274-1.509-.419-1.451-.885.03-.243.365-.492 1.004-.748 3.931-1.712 6.555-2.842 7.871-3.39 3.748-1.56 4.527-1.831 5.036-1.84.112-.002.362.026.524.158.137.111.175.261.193.367.019.106.012.339.003.407z"/>
              </svg>
              <span>Telegram</span>
            </a>

            {/* WhatsApp */}
            <a
              href={'https://api.whatsapp.com/send?text=' + encodeURIComponent(postUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="share-social-btn whatsapp"
              title="Chia sẻ qua WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.176.2-.351.226-.653.075s-1.274-.469-2.427-1.498c-.898-.8-1.504-1.789-1.68-2.09-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.502.1-.2.05-.376-.025-.527s-.678-1.635-.93-2.239c-.244-.588-.493-.509-.678-.518l-.578-.01c-.2 0-.527.075-.803.376s-1.054 1.03-1.054 2.511c0 1.481 1.079 2.912 1.23 3.113.15.2 2.124 3.243 5.145 4.549.719.311 1.281.497 1.719.636.722.23 1.38.197 1.9-.12.578-.352 1.78-1.079 2.031-1.78.251-.702.251-1.305.176-1.43-.075-.125-.276-.201-.577-.351zm-5.452 7.493c-1.92 0-3.803-.516-5.45-1.494l-.391-.232-4.053 1.063 1.082-3.952-.255-.406c-1.074-1.711-1.641-3.69-1.641-5.727 0-5.999 4.881-10.88 10.88-10.88 2.908 0 5.641 1.133 7.697 3.19 2.056 2.056 3.188 4.79 3.188 7.697 0 6.002-4.881 10.882-10.88 10.882z"/>
              </svg>
              <span>WhatsApp</span>
            </a>

            {/* X / Twitter */}
            <a
              href={'https://twitter.com/intent/tweet?url=' + encodeURIComponent(postUrl) + '&text=' + encodeURIComponent(post?.content ? post.content.slice(0, 100) : 'Khám phá bài viết trên SocialHub!')}
              target="_blank"
              rel="noopener noreferrer"
              className="share-social-btn twitter"
              title="Chia sẻ lên X (Twitter)"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>X</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
