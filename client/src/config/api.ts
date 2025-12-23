// API Configuration
// In production, this will use the Vercel backend URL
// In development, it will use the local proxy

const getApiBaseUrl = (): string => {
  // Check if we're in production (Vercel)
  if (import.meta.env.PROD) {
    // Use environment variable if set, otherwise use the production backend URL
    return import.meta.env.VITE_API_URL || 'https://cargomatch-talv.vercel.app';
  }
  
  // Development: use relative URLs (Vite proxy will handle it)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  if (API_BASE_URL) {
    return `${API_BASE_URL}/${cleanEndpoint}`;
  }
  
  // Development: use relative URL
  return `/${cleanEndpoint}`;
};

// Wrapper for fetch that automatically uses the correct API URL
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = getApiUrl(endpoint);
  return fetch(url, options);
};

// Helper function for file URLs (for PDF viewing)
export const getFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  
  // If it's already a full URL (Cloudinary or http/https), return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // If it's a Cloudinary URL (without protocol), add https
  if (filePath.includes('cloudinary.com')) {
    return `https://${filePath}`;
  }
  
  // For local file paths in production, they should be Cloudinary URLs
  // In development, use localhost
  if (import.meta.env.PROD) {
    // In production, files should be in Cloudinary
    // If we get a local path, it's an error - return empty or log warning
    console.warn('Local file path in production:', filePath);
    return '';
  }
  
  // Development: use localhost for local files
  const cleanPath = filePath.replace(/\\\\/g, '/').replace(/\\/g, '/');
  if (cleanPath.startsWith('/uploads/') || cleanPath.startsWith('uploads/')) {
    return `http://localhost:5000/${cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath}`;
  }
  
  return `http://localhost:5000/${cleanPath}`;
};

