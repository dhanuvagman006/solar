import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, Download } from 'lucide-react'
import {
  useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import ModelSelector from '../components/shared/ModelSelector'
import CropStatusCard from '../components/cards/CropStatusCard'
import IrrigationHeatmap from '../components/charts/IrrigationHeatmap'
import ErrorBoundary from '../components/shared/ErrorBoundary'
import { ChartSkeleton } from '../components/shared/LoadingSpinner'
import { useIrrigationPrediction } from '../api/irrigationApi'
import { formatDate, exportToCSV, DECISION_COLORS } from '../utils/formatters'
import type { ModelName, CropType, IrrigationPlan } from '../types'
import irrigationMock from '../mocks/irrigation_mock.json'

const columnHelper = createColumnHelper<IrrigationPlan>()

export default function IrrigationPage() {
  const [model, setModel] = useState<ModelName>('LSTM')
  const [soilMoisture, setSoilMoisture] = useState(0.35)
  const [selectedCrops, setSelectedCrops] = useState<CropType[]>(['Arecanut', 'Coconut', 'Pepper'])
  const [sorting, setSorting] = useState<SortingState>([])

  const mutation = useIrrigationPrediction()
  const plans = (mutation.data ?? irrigationMock) as IrrigationPlan[]

  const handleGenerate = () => {
    mutation.mutate({
      soil_moisture: soilMoisture,
      crop_types: selectedCrops,
      model,
    })
  }

  const toggleCrop = (crop: CropType) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    )
  }

  // Today's status per crop
  const todayStatus = useMemo(() => {
    const today = plans.length > 0 ? plans[0].date : ''
    return (['Arecanut', 'Coconut', 'Pepper'] as CropType[]).map((crop) => {
      const plan = plans.find((p) => p.date === today && p.crop === crop)
      return {
        crop,
        decision: plan?.decision ?? 'No Irrigate' as const,
        waterLiters: plan?.water_liters ?? 0,
      }
    })
  }, [plans])

  const columns = useMemo(() => [
    columnHelper.accessor('date', {
      header: 'Date',
      cell: (info) => <span className="text-sm font-medium">{formatDate(info.getValue(), 'MMM dd')}</span>,
    }),
    columnHelper.accessor('crop', {
      header: 'Crop',
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('decision', {
      header: 'Decision',
      cell: (info) => {
        const d = info.getValue()
        const colorClass = d === 'Irrigate' ? 'badge-success' : d === 'Monitor' ? 'badge-warning' : 'badge-neutral'
        return <span className={colorClass}>{d}</span>
      },
    }),
    columnHelper.accessor('water_liters', {
      header: 'Water (L)',
      cell: (info) => (
        <span className="font-mono text-sm">{info.getValue() > 0 ? `${info.getValue()}L` : '—'}</span>
      ),
    }),
    columnHelper.accessor('soil_moisture', {
      header: 'Soil Moisture',
      cell: (info) => (
        <span className="font-mono text-sm">{(info.getValue() * 100).toFixed(0)}%</span>
      ),
    }),
    columnHelper.accessor('reason', {
      header: 'Reason',
      cell: (info) => (
        <span className="text-xs text-text-muted dark:text-text-dark-muted max-w-[200px] truncate block">
          {info.getValue()}
        </span>
      ),
    }),
  ], [])

  const table = useReactTable({
    data: plans,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Controls bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 flex flex-wrap items-end gap-4"
        >
          {/* Soil moisture slider */}
          <div className="min-w-[200px]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted dark:text-text-dark-muted font-medium">Soil Moisture</span>
              <span className="font-mono font-semibold text-text-primary dark:text-white">{soilMoisture.toFixed(2)}</span>
            </div>
            <input
              type="range" min="0" max="1" step="0.01" value={soilMoisture}
              onChange={(e) => setSoilMoisture(Number(e.target.value))}
              className="w-full accent-primary h-1.5"
            />
          </div>

          {/* Crop selection */}
          <div>
            <span className="text-xs text-text-muted dark:text-text-dark-muted font-medium block mb-1.5">Crops</span>
            <div className="flex gap-2">
              {(['Arecanut', 'Coconut', 'Pepper'] as CropType[]).map((crop) => (
                <label
                  key={crop}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all
                    ${selectedCrops.includes(crop)
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-gray-50 dark:bg-gray-800 text-text-muted dark:text-text-dark-muted border border-transparent'}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCrops.includes(crop)}
                    onChange={() => toggleCrop(crop)}
                    className="sr-only"
                  />
                  {crop}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted dark:text-text-dark-muted font-medium block mb-1.5">Model</label>
            <ModelSelector value={model} onChange={setModel} />
          </div>

          <button onClick={handleGenerate} className="btn-primary" disabled={mutation.isPending}>
            <Play className="w-4 h-4" />
            Generate 14-Day Plan
          </button>
        </motion.div>

        {/* Crop status cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {todayStatus.map((s) => (
            <CropStatusCard key={s.crop} {...s} />
          ))}
        </div>

        {/* Heatmap */}
        {mutation.isPending ? <ChartSkeleton /> : <IrrigationHeatmap data={plans} />}

        {/* Schedule table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary dark:text-white">14-Day Schedule</h3>
            <button
              onClick={() => exportToCSV(plans as any, 'irrigation_schedule')}
              className="btn-secondary text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-gray-100 dark:border-gray-800">
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="text-xs font-semibold text-text-muted dark:text-text-dark-muted uppercase tracking-wider py-3 px-3 cursor-pointer hover:text-text-primary dark:hover:text-white"
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted() as string] ?? ''}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-2.5 px-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </ErrorBoundary>
  )
}
