// Global camera cleanup utility
class CameraCleanupManager {
  private static instance: CameraCleanupManager;
  private activeStreams: Set<MediaStream> = new Set();
  private cleanupCallbacks: Set<() => void> = new Set();

  static getInstance(): CameraCleanupManager {
    if (!CameraCleanupManager.instance) {
      CameraCleanupManager.instance = new CameraCleanupManager();
    }
    return CameraCleanupManager.instance;
  }

  // Register a media stream for cleanup
  registerStream(stream: MediaStream): void {
    console.log('📹 Registering camera stream for cleanup');
    this.activeStreams.add(stream);
  }

  // Unregister a media stream
  unregisterStream(stream: MediaStream): void {
    console.log('📹 Unregistering camera stream');
    this.activeStreams.delete(stream);
  }

  // Register a cleanup callback
  registerCleanupCallback(callback: () => void): void {
    console.log('🧹 Registering cleanup callback');
    this.cleanupCallbacks.add(callback);
  }

  // Unregister a cleanup callback
  unregisterCleanupCallback(callback: () => void): void {
    console.log('🧹 Unregistering cleanup callback');
    this.cleanupCallbacks.delete(callback);
  }

  // Stop all active camera streams
  stopAllStreams(): void {
    console.log(`🛑 Stopping ${this.activeStreams.size} active camera streams`);
    
    this.activeStreams.forEach(stream => {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('📹 Camera track stopped:', track.kind);
      });
    });
    
    this.activeStreams.clear();
    console.log('✅ All camera streams stopped');
  }

  // Execute all cleanup callbacks
  executeCleanupCallbacks(): void {
    console.log(`🧹 Executing ${this.cleanupCallbacks.size} cleanup callbacks`);
    
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('❌ Error in cleanup callback:', error);
      }
    });
    
    console.log('✅ All cleanup callbacks executed');
  }

  // Full cleanup - stop streams and execute callbacks
  cleanup(): void {
    console.log('🧹 Performing full camera cleanup');
    this.stopAllStreams();
    this.executeCleanupCallbacks();
  }

  // Get active streams count
  getActiveStreamsCount(): number {
    return this.activeStreams.size;
  }

  // Get cleanup callbacks count
  getCleanupCallbacksCount(): number {
    return this.cleanupCallbacks.size;
  }
}

// Export singleton instance
export const cameraCleanupManager = CameraCleanupManager.getInstance();

// Utility functions
export const registerCameraStream = (stream: MediaStream) => {
  cameraCleanupManager.registerStream(stream);
};

export const unregisterCameraStream = (stream: MediaStream) => {
  cameraCleanupManager.unregisterStream(stream);
};

export const registerCleanupCallback = (callback: () => void) => {
  cameraCleanupManager.registerCleanupCallback(callback);
};

export const unregisterCleanupCallback = (callback: () => void) => {
  cameraCleanupManager.unregisterCleanupCallback(callback);
};

export const cleanupAllCameras = () => {
  cameraCleanupManager.cleanup();
};

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    console.log('🚪 Page unloading - cleaning up all cameras');
    cameraCleanupManager.cleanup();
  });

  window.addEventListener('pagehide', () => {
    console.log('📱 Page hidden - cleaning up all cameras');
    cameraCleanupManager.cleanup();
  });

  // Cleanup on visibility change (when tab becomes hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('👁️ Page hidden - cleaning up all cameras');
      cameraCleanupManager.cleanup();
    }
  });
}
