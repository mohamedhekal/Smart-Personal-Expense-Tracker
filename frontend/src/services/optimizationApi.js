import { api } from './apiService';

export const fetchRecommendations = async (params = undefined) => api.get('/optimization/recommendations', params);

export default { fetchRecommendations };
