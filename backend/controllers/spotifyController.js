let cachedToken = null;
let tokenExpiresAt = 0;

const getSpotifyToken = async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

    try {
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });
        if (!response.ok) return null;

        const data = await response.json();
        cachedToken = data.access_token;
        tokenExpiresAt = Date.now() + Math.max(0, (data.expires_in - 60) * 1000);
        return cachedToken;
    } catch {
        return null;
    }
};

const searchSpotifyTracks = async (req, res) => {
    const query = String(req.query.q || '').trim();
    if (query.length < 2) {
        return res.status(400).json({ message: 'Nhập ít nhất 2 ký tự để tìm nhạc.' });
    }

    let tracks = [];

    // 1. Thử tìm kiếm qua Spotify Web API nếu đã có cấu hình và token
    try {
        const token = await getSpotifyToken();
        if (token) {
            const response = await fetch(
                `https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(query)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.ok) {
                const data = await response.json();
                tracks = (data.tracks?.items || []).map(track => ({
                    id: track.id,
                    name: track.name,
                    artists: track.artists.map(artist => artist.name).join(', '),
                    album: track.album?.name || '',
                    imageUrl: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || null,
                    externalUrl: track.external_urls?.spotify || null,
                    previewUrl: track.preview_url || null,
                    source: 'spotify'
                }));
            } else if (response.status === 401) {
                cachedToken = null;
                tokenExpiresAt = 0;
            }
        }
    } catch (spotifyErr) {
        console.warn('Lỗi kết nối Spotify:', spotifyErr.message);
    }

    // 2. Dự phòng thông minh qua Apple Music / iTunes Search API
    // (Miễn phí 100%, không bị lỗi 403 Forbidden do tài khoản Spotify thiếu Premium, hỗ trợ nhạc Việt và có sẵn 30s preview audio)
    if (tracks.length === 0) {
        try {
            const itunesRes = await fetch(
                `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15&country=VN`
            );
            if (itunesRes.ok) {
                const itunesData = await itunesRes.json();
                tracks = (itunesData.results || []).map(track => ({
                    id: String(track.trackId),
                    name: track.trackName,
                    artists: track.artistName,
                    album: track.collectionName || '',
                    imageUrl: track.artworkUrl100?.replace('100x100bb.jpg', '300x300bb.jpg') || track.artworkUrl100 || null,
                    externalUrl: track.trackViewUrl || null,
                    previewUrl: track.previewUrl || null,
                    source: 'itunes'
                }));
            }
        } catch (itunesErr) {
            console.error('Lỗi tìm nhạc iTunes fallback:', itunesErr.message);
        }
    }

    return res.json({
        tracks,
        message: tracks.length === 0 ? 'Không tìm thấy bài hát phù hợp.' : undefined
    });
};

module.exports = { searchSpotifyTracks };
