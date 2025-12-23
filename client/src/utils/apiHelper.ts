// Centralized API helper to ensure all fetch calls use the correct backend URL
import { getApiUrl } from '../config/api';

// Helper to make API calls with automatic URL resolution
export const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = getApiUrl(endpoint);
  return fetch(url, options);
};

// Helper for GET requests
export const apiGet = async (endpoint: string, token?: string): Promise<Response> => {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiCall(endpoint, { method: 'GET', headers });
};

// Helper for POST requests
export const apiPost = async (endpoint: string, data: any, token?: string): Promise<Response> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiCall(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
};

// Helper for PUT requests
export const apiPut = async (endpoint: string, data: any, token?: string): Promise<Response> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiCall(endpoint, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
};

// Helper for DELETE requests
export const apiDelete = async (endpoint: string, token?: string): Promise<Response> => {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiCall(endpoint, { method: 'DELETE', headers });
};

