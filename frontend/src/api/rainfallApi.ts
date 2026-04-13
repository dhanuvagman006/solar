import { useQuery } from '@tanstack/react-query'
import api, { MOCK_MODE } from './axiosConfig'
import type { RainfallPrediction, ModelMetrics, ModelName } from '../types'
import rainfallMock from '../mocks/rainfall_mock.json'
import metricsMock from '../mocks/metrics_mock.json'

export function useRainfallPrediction(model: ModelName, days: number = 14) {
  return useQuery<RainfallPrediction[]>({
    queryKey: ['rainfall', model, days],
    queryFn: async () => {
      if (MOCK_MODE) {
        // Simulate network delay
        await new Promise((r) => setTimeout(r, 600))
        return rainfallMock.map((item) => ({ ...item, model })) as RainfallPrediction[]
      }
      const { data } = await api.get('/rainfall/predict', {
        params: { model, days },
      })
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useRainfallMetrics() {
  return useQuery<ModelMetrics[]>({
    queryKey: ['rainfallMetrics'],
    queryFn: async () => {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 400))
        return metricsMock.rainfall as ModelMetrics[]
      }
      const { data } = await api.get('/rainfall/metrics')
      return data
    },
    staleTime: 10 * 60 * 1000,
  })
}
