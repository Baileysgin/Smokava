import { create } from 'zustand';
import api from '@/lib/api';

export interface Post {
  _id: string;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
    phoneNumber: string;
    // Legacy fields
    name?: string;
    avatar?: string;
  };
  restaurant: {
    _id: string;
    nameFa: string;
    addressFa: string;
  };
  flavor?: string;
  caption: string;
  imageUrl: string;
  likes: Array<{
    user: string;
    likedAt: string;
  }>;
  comments: Array<{
    _id: string;
    user: {
      _id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      photoUrl?: string;
      phoneNumber: string;
      // Legacy fields
      name?: string;
      avatar?: string;
    };
    text: string;
    commentedAt: string;
  }>;
  createdAt: string;
}

interface FeedState {
  posts: Post[];
  loading: boolean;
  showFollowingOnly: boolean;
  fetchPosts: (followingOnly?: boolean, userId?: string) => Promise<void>;
  createPost: (restaurantId: string, flavor: string, caption: string, imageUrl: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  setShowFollowingOnly: (value: boolean) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  loading: false,
  showFollowingOnly: false,

  fetchPosts: async (followingOnly = false, userId?: string) => {
    try {
      set({ loading: true });
      let params = '';
      if (userId && !followingOnly) {
        // Fetch posts for a specific user
        params = `?userId=${userId}`;
      } else if (followingOnly && userId) {
        // Fetch posts from users being followed by the current user
        params = `?followingOnly=true&userId=${userId}`;
      }
      const response = await api.get(`/feed${params}`);
      set({ posts: response.data, loading: false, showFollowingOnly: followingOnly });
    } catch (error) {
      console.error('Fetch posts error:', error);
      set({ loading: false });
    }
  },

  setShowFollowingOnly: (value: boolean) => {
    set({ showFollowingOnly: value });
  },

  createPost: async (restaurantId: string, flavor: string, caption: string, imageUrl: string) => {
    try {
      const response = await api.post('/feed', { restaurantId, flavor, caption, imageUrl });
      const newPost = response.data;
      set({ posts: [newPost, ...get().posts] });
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  },

  toggleLike: async (postId: string) => {
    try {
      await api.post(`/feed/${postId}/like`);
      await get().fetchPosts();
    } catch (error) {
      console.error('Toggle like error:', error);
    }
  },

  addComment: async (postId: string, text: string) => {
    try {
      await api.post(`/feed/${postId}/comment`, { text });
      await get().fetchPosts();
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  },

  deletePost: async (postId: string) => {
    try {
      await api.delete(`/feed/${postId}`);
      // Remove post from local state
      set({ posts: get().posts.filter(post => post._id !== postId) });
    } catch (error) {
      console.error('Delete post error:', error);
      throw error;
    }
  },
}));
