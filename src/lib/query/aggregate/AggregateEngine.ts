import type { AggreeateFunction } from "../types"

export class AggregateEngine {
  /**
   * Flatten nested arrays and remove null/undefined values for pure calculation
   */
  private static flattenAndClean(values: unknown[]): unknown[] {
    const result: unknown[] = []
    const flatten = (arr: unknown[]) => {
      for (const item of arr) {
        if (Array.isArray(item)) {
          flatten(item)
        } else if (item !== null && item !== undefined) {
          result.push(item)
        }
      }
    }
    flatten(values)
    return result
  }

  private static toNumbers(values: unknown[]): number[] {
    const cleaned = this.flattenAndClean(values)
    const nums: number[] = []
    for (const val of cleaned) {
      if (typeof val === "number" && !Number.isNaN(val)) {
        nums.push(val)
      } else if (val instanceof Date) {
        nums.push(val.getTime())
      } else if (typeof val === "string" && val.trim() !== "") {
        const parsed = Number(val)
        if (!Number.isNaN(parsed)) {
          nums.push(parsed)
        }
      } else if (typeof val === "boolean") {
        nums.push(val ? 1 : 0)
      }
    }
    return nums
  }

  public static count(values: unknown[]): number {
    const cleaned = this.flattenAndClean(values)
    return cleaned.length
  }

  public static sum(values: unknown[]): number {
    const nums = this.toNumbers(values)
    return nums.reduce((acc, curr) => acc + curr, 0)
  }

  public static mean(values: unknown[]): number {
    const nums = this.toNumbers(values)
    if (nums.length === 0) return 0
    return this.sum(nums) / nums.length
  }

  public static median(values: unknown[]): number {
    const nums = this.toNumbers(values)
    if (nums.length === 0) return 0
    // Sort copy to preserve immutability
    const sorted = [...nums].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2
    }
    return sorted[mid]
  }

  public static min(values: unknown[]): unknown {
    const cleaned = this.flattenAndClean(values)
    if (cleaned.length === 0) return undefined

    // If all are numbers
    const nums = this.toNumbers(cleaned)
    if (nums.length === cleaned.length) {
      return Math.min(...nums)
    }

    // Generic comparison for strings/dates
    return cleaned.reduce<unknown>((minVal, curr) => {
      if (minVal === undefined) return curr
      return (curr as any) < (minVal as any) ? curr : minVal
    }, undefined)
  }

  public static max(values: unknown[]): unknown {
    const cleaned = this.flattenAndClean(values)
    if (cleaned.length === 0) return undefined

    const nums = this.toNumbers(cleaned)
    if (nums.length === cleaned.length) {
      return Math.max(...nums)
    }

    return cleaned.reduce<unknown>((maxVal, curr) => {
      if (maxVal === undefined) return curr
      return (curr as any) > (maxVal as any) ? curr : maxVal
    }, undefined)
  }

  public static aggregate(
    functionName: AggreeateFunction | string,
    values: unknown[]
  ): unknown {
    if (!Array.isArray(values)) {
      values = [values]
    }

    switch (functionName?.toUpperCase()) {
      case "SUM":
        return this.sum(values)
      case "COUNT":
        return this.count(values)
      case "MEAN":
        return this.mean(values)
      case "MEDIAN":
        return this.median(values)
      case "MIN":
        return this.min(values)
      case "MAX":
        return this.max(values)
      default:
        return values
    }
  }
}
