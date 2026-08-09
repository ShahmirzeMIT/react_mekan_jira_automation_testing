// API Configuration
const API_BASE_URL = "https://nodejsjirataskautomation-production.up.railway.app";

// ============================================
// CUSTOM API CALL FUNCTION - REUSABLE
// ============================================

/**
 * Custom API call function that handles all API requests
 * @param endpoint - The API endpoint (e.g., '/github/repos', '/github/branches')
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param body - Request body (optional)
 * @param headers - Additional headers (optional)
 * @returns Promise with the API response
 */
export const apiCall = async <T = any>(
  endpoint: string,
  method: string = "GET",
  body?: any,
  headers?: Record<string, string>
): Promise<T> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
};