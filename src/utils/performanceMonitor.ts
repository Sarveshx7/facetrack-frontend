// Performance monitoring utility for face recognition system
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start timing an operation
  startTimer(operation: string): void {
    this.startTimes.set(operation, performance.now());
  }

  // End timing an operation and record the duration
  endTimer(operation: string): number {
    const startTime = this.startTimes.get(operation);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operation}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(operation);

    // Store the metric
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);

    // Keep only last 100 measurements
    const measurements = this.metrics.get(operation)!;
    if (measurements.length > 100) {
      measurements.shift();
    }

    console.log(`⏱️ ${operation}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  // Get average performance for an operation
  getAverageTime(operation: string): number {
    const measurements = this.metrics.get(operation);
    if (!measurements || measurements.length === 0) return 0;

    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  // Get performance statistics
  getStats(operation: string): { avg: number; min: number; max: number; count: number } {
    const measurements = this.metrics.get(operation);
    if (!measurements || measurements.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    return {
      avg: this.getAverageTime(operation),
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      count: measurements.length
    };
  }

  // Get all performance data
  getAllStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const stats: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    this.metrics.forEach((measurements, operation) => {
      stats[operation] = this.getStats(operation);
    });

    return stats;
  }

  // Log performance summary
  logSummary(): void {
    console.group('📊 Performance Summary');
    
    this.metrics.forEach((measurements, operation) => {
      if (measurements.length > 0) {
        const stats = this.getStats(operation);
        console.log(`${operation}:`, {
          average: `${stats.avg.toFixed(2)}ms`,
          min: `${stats.min.toFixed(2)}ms`,
          max: `${stats.max.toFixed(2)}ms`,
          samples: stats.count
        });
      }
    });
    
    console.groupEnd();
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
    console.log('🧹 Performance metrics cleared');
  }

  // Monitor memory usage
  getMemoryUsage(): any {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      };
    }
    return null;
  }

  // Log memory usage
  logMemoryUsage(): void {
    const memory = this.getMemoryUsage();
    if (memory) {
      console.log('💾 Memory Usage:', memory);
    }
  }

  // Check if performance is degrading
  isPerformanceDegrading(operation: string, threshold: number = 1000): boolean {
    const measurements = this.metrics.get(operation);
    if (!measurements || measurements.length < 10) return false;

    const recent = measurements.slice(-5);
    const older = measurements.slice(-15, -5);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    return recentAvg > olderAvg * 1.5 || recentAvg > threshold;
  }

  // Auto-log performance warnings
  checkPerformance(): void {
    const criticalOperations = ['face-detection', 'face-recognition', 'model-loading'];
    
    for (const operation of criticalOperations) {
      if (this.isPerformanceDegrading(operation)) {
        console.warn(`⚠️ Performance degradation detected for: ${operation}`);
        const stats = this.getStats(operation);
        console.warn(`Average time: ${stats.avg.toFixed(2)}ms (recent measurements)`);
      }
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export const startTimer = (operation: string) => performanceMonitor.startTimer(operation);
export const endTimer = (operation: string) => performanceMonitor.endTimer(operation);
export const logPerformanceSummary = () => performanceMonitor.logSummary();
export const logMemoryUsage = () => performanceMonitor.logMemoryUsage();

// Auto-check performance every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    performanceMonitor.checkPerformance();
  }, 30000);
}
