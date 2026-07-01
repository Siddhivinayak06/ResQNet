import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use 10.0.2.2 for Android emulator, localhost for iOS simulator
const LOCAL_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001/api/v1' : 'http://localhost:5001/api/v1';
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || LOCAL_API_URL).replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or unauthorized
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      // Additional logic to navigate to login if needed can be handled in a global event emitter
    }
    
    const message = error.response?.data?.error 
      || error.response?.data?.message 
      || error.response?.data?.errors?.[0] 
      || error.message;

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
