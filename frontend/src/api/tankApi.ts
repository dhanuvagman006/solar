import { useQuery, useMutation } from '@tanstack/react-query'
import api, { MOCK_MODE } from './axiosConfig'
import type { TankPrediction, ModelMetrics, TankInput } from '../types'
import tankMock from '../mocks/tank_mock.json'
import metricsMock from '../mocks/metrics_mock.json'

export function useTankPrediction() {
  return useMutation<TankPrediction[], Error, TankInput>({
    mutationFn: async (input) => {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 800))
        return tankMock.map((item) => ({ ...item, model: input.model })) as TankPrediction[]
      }
      const { data } = await api.post('/tank/predict', input)
      return data
    },
  })
}

export function useTankMetrics() {
  return useQuery<ModelMetrics[]>({
    queryKey: ['tankMetrics'],
    queryFn: async () => {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 400))
        return metricsMock.tank as ModelMetrics[]
      }
      const { data } = await api.get('/tank/metrics')
      return data
    },
    staleTime: 10 * 60 * 1000,
  })
}
