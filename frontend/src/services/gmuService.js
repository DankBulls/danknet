const API_BASE_URL = '/api/gmu';

export const gmuService = {
  async listGMUs(region = null) {
    const url = region 
      ? `${API_BASE_URL}/list?region=${encodeURIComponent(region)}`
      : `${API_BASE_URL}/list`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch GMU list');
    return response.json();
  },

  async getGMUAnalysis(gmuId) {
    const response = await fetch(`${API_BASE_URL}/${gmuId}/analysis`);
    if (!response.ok) throw new Error('Failed to fetch GMU analysis');
    return response.json();
  },

  async getGMUByLocation(lat, lon) {
    const response = await fetch(
      `${API_BASE_URL}/location?lat=${lat}&lon=${lon}`
    );
    if (!response.ok) throw new Error('Failed to fetch GMU by location');
    return response.json();
  }
};
