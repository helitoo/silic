import * as React from "react"
import {
  BarChart3,
  Percent,
  Play,
  RotateCcw,
  Sparkles,
  X,
  Info,
  Layers,
  Sigma,
  TrendingUp,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import { useAnalysis } from "@/contexts/AnalysisContext"
import { useEntity } from "@/contexts/EntityContext"
import { useTemplate } from "@/contexts/TemplateContext"
import { useQuery } from "@/contexts/QueryContext"
import { useLang } from "@/contexts/LangContext"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { RecordSelect } from "@/components/main/queryBlocks/components/RecordSelect"
import type { Type } from "@/lib/types"

const ALLOWED_TYPES: Type[] = ["shortText", "boolean", "color", "number"]

interface DataPoint {
  name: string
  rawKey: string | number
  value: number
  proportion: number
  count: number
  percentage: string
  color?: string
}

interface NumberStats {
  mean: number
  median: number
  min: number
  max: number
  total: number
  distinctCount: number
}

const chartConfig = {
  value: {
    label: "Số lượng",
    color: "var(--primary)",
  },
  proportion: {
    label: "Tỷ trọng (%)",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function AnalysisPage() {
  const { isAnalysisOpen, setIsAnalysisOpen } = useAnalysis()
  const { entities: allEntities } = useEntity()
  const { currentEntities } = useQuery()
  const { templates } = useTemplate()
  const { t } = useLang()

  // Use currently active (or filtered) entities
  const entities = currentEntities || allEntities

  const [selectedRecord, setSelectedRecord] = React.useState<string>("")
  const [isPercentage, setIsPercentage] = React.useState<boolean>(false)
  const [analyzedRecord, setAnalyzedRecord] = React.useState<string>("")
  const [recordType, setRecordType] = React.useState<Type | null>(null)
  const [chartData, setChartData] = React.useState<DataPoint[]>([])
  const [numberStats, setNumberStats] = React.useState<NumberStats | null>(null)
  const [hasRun, setHasRun] = React.useState<boolean>(false)

  // Determine the Type of a given record name
  const getRecordType = React.useCallback(
    (recName: string): Type | null => {
      if (!recName) return null
      for (const ent of entities) {
        if (Array.isArray(ent.records)) {
          const r = ent.records.find((rec) => rec.name === recName)
          if (r && r.type) return r.type
        }
      }
      for (const tpl of templates) {
        if (Array.isArray(tpl.records)) {
          const r = tpl.records.find((rec) => rec.name === recName)
          if (r && r.type) return r.type
        }
      }
      return null
    },
    [entities, templates]
  )

  const isAnalyzedNumber = recordType === "number"

  // Handle analysis computation
  const handleAnalyze = React.useCallback(() => {
    if (!selectedRecord) return

    const type = getRecordType(selectedRecord) || "shortText"
    setRecordType(type)
    setAnalyzedRecord(selectedRecord)
    setHasRun(true)

    // Collect and unnest values across entities
    const rawValues: any[] = []

    for (const ent of entities) {
      if (!Array.isArray(ent.records)) continue
      const rec = ent.records.find((r) => r.name === selectedRecord)
      if (!rec || rec.value === undefined || rec.value === null) continue

      if (Array.isArray(rec.value)) {
        for (const item of rec.value) {
          if (item !== undefined && item !== null && item !== "") {
            rawValues.push(item)
          }
        }
      } else if (rec.value !== "") {
        rawValues.push(rec.value)
      }
    }

    const totalCount = rawValues.length
    if (totalCount === 0) {
      setChartData([])
      setNumberStats(null)
      return
    }

    if (type === "number") {
      // Process numeric data
      const numbers = rawValues
        .map((v) => (typeof v === "number" ? v : Number(v)))
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b)

      const numTotal = numbers.length
      if (numTotal === 0) {
        setChartData([])
        setNumberStats(null)
        return
      }

      const sum = numbers.reduce((acc, curr) => acc + curr, 0)
      const mean = sum / numTotal
      const mid = Math.floor(numTotal / 2)
      const median =
        numTotal % 2 !== 0
          ? numbers[mid]
          : (numbers[mid - 1] + numbers[mid]) / 2
      const min = numbers[0]
      const max = numbers[numTotal - 1]

      // Frequency map of distinct numbers
      const freqMap = new Map<number, number>()
      for (const num of numbers) {
        freqMap.set(num, (freqMap.get(num) || 0) + 1)
      }

      const sortedEntries = Array.from(freqMap.entries()).sort(
        (a, b) => a[0] - b[0]
      )

      const points: DataPoint[] = sortedEntries.map(([numKey, count]) => {
        const prop = (count / numTotal) * 100
        return {
          name: String(numKey),
          rawKey: numKey,
          value: count,
          proportion: Number(prop.toFixed(2)),
          count: count,
          percentage: prop.toFixed(1) + "%",
        }
      })

      setNumberStats({
        mean,
        median,
        min,
        max,
        total: numTotal,
        distinctCount: sortedEntries.length,
      })
      setChartData(points)
    } else {
      // Process shortText, boolean, color
      setNumberStats(null)
      const freqMap = new Map<string, number>()

      for (const val of rawValues) {
        let label = String(val).trim()
        if (type === "boolean") {
          label = val === true || val === "true" ? "true" : "false"
        }
        freqMap.set(label, (freqMap.get(label) || 0) + 1)
      }

      // Sort by count ascending (if equal count, sort by category name alphabetically)
      const sortedEntries = Array.from(freqMap.entries()).sort(
        (a, b) => a[1] - b[1] || a[0].localeCompare(b[0])
      )

      const points: DataPoint[] = sortedEntries.map(([catKey, count]) => {
        const prop = (count / totalCount) * 100
        return {
          name: catKey,
          rawKey: catKey,
          value: count,
          proportion: Number(prop.toFixed(2)),
          count: count,
          percentage: prop.toFixed(1) + "%",
          color: type === "color" ? catKey : undefined,
        }
      })

      setChartData(points)
    }
  }, [selectedRecord, entities, getRecordType])

  const handleReset = React.useCallback(() => {
    setSelectedRecord("")
    setAnalyzedRecord("")
    setRecordType(null)
    setChartData([])
    setNumberStats(null)
    setIsPercentage(false)
    setHasRun(false)
  }, [])

  // Auto-run analysis when opened with existing selection
  React.useEffect(() => {
    if (isAnalysisOpen && selectedRecord && !hasRun) {
      handleAnalyze()
    }
  }, [isAnalysisOpen, selectedRecord, hasRun, handleAnalyze])

  // Determine active key for rendering (supports proportion for all types)
  const activeKey: "value" | "proportion" = isPercentage ? "proportion" : "value"
  const isAreaChart = chartData.length > 20

  const totalSamples = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData])

  return (
    <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
      <DialogContent
        showCloseButton={false}
        className="fixed top-1/2 left-1/2 z-50 flex h-[100dvh] max-h-full w-[100vw] max-w-full -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-none border border-border bg-card p-0 shadow-2xl md:h-[85vh] md:max-h-[90vh] md:w-[90vw] md:max-w-5xl md:rounded-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
              <BarChart3 className="size-4.5" />
            </div>
            <div className="flex min-w-0 flex-col">
              <DialogTitle className="truncate text-sm font-bold text-foreground sm:text-base">
                {t("analysisPage.title") || "Phân tích dữ liệu"}
              </DialogTitle>
              {analyzedRecord && (
                <span className="truncate text-xs text-muted-foreground">
                  {analyzedRecord} ({recordType})
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {hasRun && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                title="Đặt lại phân tích"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Đặt lại</span>
              </Button>
            )}

            {/* Close Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsAnalysisOpen(false)}
              className="ml-1 size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Đóng dialog"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Toolbar: Record selection, Proportion checkbox, Analyze button */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-2.5 sm:px-6">
          <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[240px]">
            {/* Record Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                {t("analysisPage.selectRecord") || "Thông tin"}:
              </span>
              <RecordSelect
                value={selectedRecord}
                onChange={(val) => {
                  setSelectedRecord(val)
                }}
                allowedTypes={ALLOWED_TYPES}
                placeholder={
                  t("analysisPage.selectRecordPlaceholder") ||
                  "Chọn trường thông tin..."
                }
                className="h-8 min-w-[160px] sm:min-w-[200px]"
              />
            </div>

            {/* Checkbox: Xem tỷ trọng (enabled for all types including number) */}
            <div
              className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors ${
                !selectedRecord
                  ? "cursor-not-allowed border-transparent opacity-45"
                  : "border-border/60 bg-background/60 hover:bg-muted/50"
              }`}
              title="Hiển thị tỷ lệ % thay vì số lượng tuyệt đối"
            >
              <Checkbox
                id="proportion-toggle"
                checked={isPercentage}
                disabled={!selectedRecord}
                onCheckedChange={(checked) => setIsPercentage(Boolean(checked))}
              />
              <label
                htmlFor="proportion-toggle"
                className={`flex cursor-pointer items-center gap-1 text-xs font-medium ${
                  !selectedRecord
                    ? "cursor-not-allowed text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                <Percent className="size-3 text-primary" />
                <span>{t("analysisPage.seeProportion") || "Xem tỷ trọng"}</span>
              </label>
            </div>
          </div>

          {/* Analyze Button */}
          <Button
            type="button"
            size="sm"
            onClick={handleAnalyze}
            disabled={!selectedRecord}
            className="h-8 gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            <Play className="size-3.5 fill-current" />
            <span>{t("analysisPage.analyze") || "Phân tích"}</span>
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-background p-4 sm:p-6">
          {!hasRun || !analyzedRecord ? (
            // Initial Empty State
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-inner">
                <BarChart3 className="size-7 stroke-[1.5]" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {t("analysisPage.noRecordSelected") ||
                    "Chưa chọn trường thông tin"}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("analysisPage.noRecordSelectedDesc") ||
                    "Vui lòng chọn một trường thông tin (shortText, boolean, color, number) và nhấn Phân tích để trực quan hóa biểu đồ phân phối."}
                </p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            // No Data Found State
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <Info className="size-7 stroke-[1.5]" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {t("analysisPage.noData") || "Không có dữ liệu"}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("analysisPage.noDataDesc") ||
                    `Không tìm thấy giá trị nào cho trường "${analyzedRecord}" trong tập dữ liệu hiện tại.`}
                </p>
              </div>
            </div>
          ) : (
            // Chart and Statistics Display
            <div className="flex flex-1 flex-col gap-5">
              {/* Summary Stats Badges */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
                {/* Total Samples */}
                <div className="flex flex-col gap-0.5 rounded-xl border border-border/70 bg-card p-2.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Layers className="size-3 text-primary" />
                    <span>
                      {t("analysisPage.totalSamples") || "Tổng mẫu"}
                    </span>
                  </div>
                  <span className="text-base font-bold text-foreground">
                    {totalSamples.toLocaleString()}
                  </span>
                </div>

                {/* Unique Categories / Values */}
                <div className="flex flex-col gap-0.5 rounded-xl border border-border/70 bg-card p-2.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Sparkles className="size-3 text-primary" />
                    <span>
                      {t("analysisPage.uniqueValues") || "Giá trị riêng biệt"}
                    </span>
                  </div>
                  <span className="text-base font-bold text-foreground">
                    {chartData.length.toLocaleString()}
                  </span>
                </div>

                {/* Numeric specific stats: Mean, Median, Min, Max */}
                {isAnalyzedNumber && numberStats && (
                  <>
                    {/* Mean */}
                    <div className="flex flex-col gap-0.5 rounded-xl border border-red-500/20 bg-red-500/5 p-2.5 shadow-2xs dark:border-red-500/30">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400">
                        <Sigma className="size-3" />
                        <span>{t("analysisPage.mean") || "Trung bình"}</span>
                      </div>
                      <span className="text-base font-bold text-red-600 dark:text-red-400">
                        {numberStats.mean.toFixed(2)}
                      </span>
                    </div>

                    {/* Median */}
                    <div className="flex flex-col gap-0.5 rounded-xl border border-purple-500/20 bg-purple-500/5 p-2.5 shadow-2xs dark:border-purple-500/30">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                        <TrendingUp className="size-3" />
                        <span>{t("analysisPage.median") || "Trung vị"}</span>
                      </div>
                      <span className="text-base font-bold text-purple-600 dark:text-purple-400">
                        {numberStats.median.toLocaleString()}
                      </span>
                    </div>

                    {/* Min */}
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border/70 bg-card p-2.5 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <span>{t("analysisPage.min") || "Nhỏ nhất"}</span>
                      </div>
                      <span className="text-base font-bold text-foreground">
                        {numberStats.min.toLocaleString()}
                      </span>
                    </div>

                    {/* Max */}
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border/70 bg-card p-2.5 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <span>{t("analysisPage.max") || "Lớn nhất"}</span>
                      </div>
                      <span className="text-base font-bold text-foreground">
                        {numberStats.max.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Chart Container */}
              <div className="flex min-h-[300px] flex-1 flex-col rounded-xl border border-border/70 bg-card p-4 shadow-xs sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {isAreaChart
                        ? "Area Chart (Phân phối liên tục)"
                        : "Bar Chart (Histogram)"}
                    </span>
                    {activeKey === "proportion" && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        % Tỷ trọng
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {chartData.length} cột / điểm dữ liệu
                  </span>
                </div>

                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-[280px] w-full sm:h-[320px]"
                >
                  {isAreaChart ? (
                    // Area Chart when items > 20
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="fillPrimary"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--primary)"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--primary)"
                            stopOpacity={0.08}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        className="stroke-border/40"
                      />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={24}
                        className="text-[11px]"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(val) =>
                          activeKey === "proportion" ? `${val}%` : String(val)
                        }
                        className="text-[11px]"
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            indicator="dot"
                            formatter={(value, _name, item) => (
                              <div className="flex items-center justify-between gap-4 font-medium">
                                <span className="text-muted-foreground">
                                  {activeKey === "proportion"
                                    ? "Tỷ trọng"
                                    : "Số lượng"}
                                  :
                                </span>
                                <span className="font-mono text-foreground font-bold">
                                  {activeKey === "proportion"
                                    ? `${value}% (${item.payload.count} mẫu)`
                                    : `${value} mẫu (${item.payload.percentage})`}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Area
                        dataKey={activeKey}
                        type="monotone"
                        fill="url(#fillPrimary)"
                        stroke="var(--primary)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  ) : (
                    // Bar Chart when items <= 20
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        className="stroke-border/40"
                      />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={16}
                        className="text-[11px]"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(val) =>
                          activeKey === "proportion" ? `${val}%` : String(val)
                        }
                        className="text-[11px]"
                      />
                      <ChartTooltip
                        cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                        content={
                          <ChartTooltipContent
                            indicator="dot"
                            formatter={(value, _name, item) => (
                              <div className="flex items-center justify-between gap-4 font-medium">
                                <span className="text-muted-foreground">
                                  {activeKey === "proportion"
                                    ? "Tỷ trọng"
                                    : "Số lượng"}
                                  :
                                </span>
                                <span className="font-mono text-foreground font-bold">
                                  {activeKey === "proportion"
                                    ? `${value}% (${item.payload.count} mẫu)`
                                    : `${value} mẫu (${item.payload.percentage})`}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Bar
                        dataKey={activeKey}
                        fill="var(--primary)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ChartContainer>
              </div>

              {/* Legend with Counts for non-numeric records (shortText, boolean, color) */}
              {!isAnalyzedNumber && chartData.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="text-xs font-semibold text-foreground">
                      Chú thích &amp; Thống kê chi tiết
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {chartData.length} phân loại
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1 max-h-[160px] overflow-y-auto">
                    {chartData.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/60"
                      >
                        {item.color ? (
                          <span
                            className="size-3 shrink-0 rounded-full border border-black/20 shadow-2xs"
                            style={{ backgroundColor: item.color }}
                          />
                        ) : (
                          <span className="size-2 shrink-0 rounded-full bg-primary" />
                        )}
                        <span className="max-w-[150px] truncate font-medium text-foreground">
                          {item.name}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-primary">
                          {item.count} ({item.percentage})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AnalysisPage
