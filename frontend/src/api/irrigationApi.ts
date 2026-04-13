import { useQuery, useMutation } from '@tanstack/react-query'
import api, { MOCK_MODE } from './axiosConfig'
import type { IrrigationPlan, ModelMetrics, IrrigationInput } from '../types'
import irrigationMock from '../mocks/irrigation_mock.json'
import metricsMock from '../mocks/metrics_mock.json'

export function useIrrigationPrediction() {
  return useMutation<IrrigationPlan[], Error, IrrigationInput>({
    mutationFn: async (input) => {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 800))
        const filtered = irrigationMock.filter((item) =>
          input.crop_types.includes(item.crop as IrrigationPlan['crop'])
        )
        return filtered as IrrigationPlan[]
      }
      const { data } = await api.post('/irrigation/predict', input)
      return data
    },
  })
}

export function useIrrigationMetrics() {
  return useQuery<ModelMetrics[]>({
    queryKey: ['irrigationMetrics'],
    queryFn: async () => {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 400))
        return metricsMock.irrigation as ModelMetrics[]
      }
      const { data } = await api.get('/irrigation/metrics')
      return data
    },
    staleTime: 10 * 60 * 1000,
  })
}
