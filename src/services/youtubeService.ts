const YOUTUBE_API_KEY = (import.meta as any).env.VITE_YOUTUBE_API_KEY || 'AIzaSyAlom__4hjOxCv6ln9L3J6i4_afjoM5Cl0';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

console.log('YouTube API Key status:', YOUTUBE_API_KEY ? 'Configured' : 'Missing');

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

export interface YouTubeVideosResponse {
  videos: YouTubeVideo[];
  nextPageToken: string | null;
}

export const fetchTrendingShorts = async (pageToken?: string, searchQuery: string = 'shorts'): Promise<YouTubeVideosResponse> => {
  const query = searchQuery.includes('shorts') ? searchQuery : `${searchQuery} shorts`;
  const cacheKey = `yt_cache_${query}_${pageToken || 'first_page'}`;
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) return JSON.parse(cachedData);

  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API Key is missing. Please configure VITE_YOUTUBE_API_KEY.');
    return { videos: [], nextPageToken: null };
  }

  try {
    // Searching for variable queries to simulate "Short Video" content variety
    const query = searchQuery.includes('shorts') ? searchQuery : `${searchQuery} shorts`;
    let url = `${BASE_URL}/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&videoDuration=short&key=${YOUTUBE_API_KEY}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      if (data.error.code === 403) {
        console.error('YouTube API Quota Exceeded');
      } else {
        console.error('YouTube API Error:', data.error.message);
      }
      return { videos: [], nextPageToken: null };
    }

    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));

    const result = {
      videos,
      nextPageToken: data.nextPageToken || null,
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Failed to fetch YouTube videos:', error);
    return { videos: [], nextPageToken: null };
  }
};

export const fetchVideoMetadata = async (videoId: string): Promise<YouTubeVideo | null> => {
  if (!YOUTUBE_API_KEY) return null;
  try {
    const response = await fetch(`${BASE_URL}/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        id: videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch video metadata:', error);
    return null;
  }
};
