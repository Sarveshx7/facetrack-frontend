import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Square, CheckCircle, XCircle, Users, Eye, AlertTriangle, Target, Settings, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import advancedFaceRecognitionService, { AttendanceRecord } from '../services/advancedFaceRecognitionService';

interface RealTimeAttendanceProps {
  onClose?: () => void;
  onAttendanceMarked?: (student: any) => void;
}

const RealTimeAttendance: React.FC<RealTimeAttendanceProps> = ({ 
  onClose, 
  onAttendanceMarked 
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // State management
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const [currentFace, setCurrentFace] = useState<any>(null);
  const [lastRecognitionResult, setLastRecognitionResult] = useState<any>(null);
  
  // Settings - Production-ready values (temporarily relaxed for debugging)
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.50); // 50% confidence for debugging (was 75%)
  const [recognitionInterval, setRecognitionInterval] = useState(2000); // 2 seconds for stability
  
  // Status and statistics
  const [recognitionStatus, setRecognitionStatus] = useState('Loading AI models...');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [enrolledStudentsCount, setEnrolledStudentsCount] = useState(0);
  const [recognitionAttempts, setRecognitionAttempts] = useState(0);
  const [successfulRecognitions, setSuccessfulRecognitions] = useState(0);
  // Majority voting buffer (last 3 recognition results)
  const [recentResults, setRecentResults] = useState<Array<{ studentId: string; studentName: string; className: string; confidence: number; distance: number }>>([]);
  // Diagnostic info
  const [diagnosticInfo, setDiagnosticInfo] = useState<string>('');

  // Initialize system on component mount
  useEffect(() => {
    initializeSystem();
    return () => {
      stopCamera();
      stopRecognition();
    };
  }, []);

  // Real-time face detection
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isVideoReady && isModelsLoaded) {
      intervalId = setInterval(detectFaces, 500); // Detect faces every 500ms
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isVideoReady, isModelsLoaded]);

  // Real-time recognition - moved after performRecognition function

  const initializeSystem = async () => {
    try {
      setRecognitionStatus('Loading AI models...');
      
      // Load Face-API models
      const modelsLoaded = await advancedFaceRecognitionService.initializeModels();
      setIsModelsLoaded(modelsLoaded);
      
      if (modelsLoaded) {
        // Get enrolled students count
        const count = advancedFaceRecognitionService.getEnrolledStudentsCount();
        setEnrolledStudentsCount(count);
        
        // Load current attendance session
        const currentSession = advancedFaceRecognitionService.getAttendanceSession();
        setAttendanceRecords(currentSession);
        
        setRecognitionStatus(`AI models loaded - ${count} students enrolled`);
        toast.success('🤖 Real-time attendance system ready!');
      } else {
        setRecognitionStatus('Failed to load AI models');
        toast.error('Failed to load AI models');
      }
    } catch (error) {
      console.error('❌ System initialization error:', error);
      setRecognitionStatus('Error loading AI models');
      toast.error('Failed to initialize attendance system');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsVideoReady(true);
          setRecognitionStatus('Camera ready - Start recognition to begin attendance');
          toast.success('📹 Camera ready for attendance!');
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      setRecognitionStatus('Camera error');
      toast.error('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsVideoReady(false);
    setRecognitionStatus('Camera stopped');
  };

  // Real-time face detection with overlay
  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !overlayCanvasRef.current || !isModelsLoaded) return;

    try {
      const face = await advancedFaceRecognitionService.detectFace(videoRef.current, {
        minConfidence: 0.5,
        inputSize: 416
      });
      
      if (face) {
        setRecognitionStatus(`👤 Face detected (${(face.confidence * 100).toFixed(0)}%) - Analyzing...`);
      } else {
        if (isRecognitionActive) {
          setRecognitionStatus('⚠️ No face detected - Please face the camera');
        }
      }
      
      setCurrentFace(face);
      drawFaceOverlay(face);
    } catch (error) {
      console.error('❌ Face detection error:', error);
    }
  }, [isModelsLoaded, lastRecognitionResult, isRecognitionActive]);

  // Draw face detection overlay with recognition results
  const drawFaceOverlay = (face: any) => {
    if (!overlayCanvasRef.current || !videoRef.current) return;

    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (face) {
      const { box, quality } = face;
      const qualityScore = quality.score;
      
      // Determine color based on recognition status
      let color = '#ef4444'; // red for unknown/low quality
      let status = 'Unknown';
      
      if (lastRecognitionResult) {
        color = '#22c55e'; // green for recognized
        status = `${lastRecognitionResult.studentName} (${(lastRecognitionResult.confidence * 100).toFixed(1)}%)`;
      } else if (qualityScore > 0.7) {
        color = '#f59e0b'; // yellow for good quality but not recognized
        status = 'Analyzing...';
      } else {
        status = `Low Quality (${(qualityScore * 100).toFixed(1)}%)`;
      }

      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      // Draw recognition result
      ctx.fillStyle = color;
      ctx.font = 'bold 18px Arial';
      const textWidth = ctx.measureText(status).width;
      
      // Background for text
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(box.x, box.y - 35, Math.max(textWidth + 20, box.width), 30);
      
      // Text
      ctx.fillStyle = color;
      ctx.fillText(status, box.x + 10, box.y - 10);

      // Draw quality indicators
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 300, 120);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('Face Quality Analysis', 20, 30);
      
      ctx.font = '14px Arial';
      ctx.fillText(`Overall: ${(qualityScore * 100).toFixed(1)}%`, 20, 50);
      ctx.fillText(`Confidence: ${(quality.factors.confidence * 100).toFixed(1)}%`, 20, 70);
      ctx.fillText(`Position: ${(quality.factors.position * 100).toFixed(1)}%`, 20, 90);
      ctx.fillText(`Size: ${(quality.factors.size * 100).toFixed(1)}%`, 20, 110);
    }

    // Draw recognition status
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(canvas.width - 350, 10, 340, 60);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Recognition Status', canvas.width - 340, 30);
    
    ctx.font = '14px Arial';
    ctx.fillText(recognitionStatus, canvas.width - 340, 50);
  };

  // Perform real-time recognition
  const performRecognition = useCallback(async () => {
    if (!videoRef.current || !isModelsLoaded || !currentFace) {
      return;
    }

    setRecognitionAttempts(prev => prev + 1);
    
    try {
      setRecognitionStatus('🔍 Analyzing face... Please wait');
      
      console.log('🎯 Starting recognition with threshold:', confidenceThreshold);
      const result = await advancedFaceRecognitionService.recognizeFace(
        videoRef.current,
        confidenceThreshold  // Use configurable threshold
      );
      console.log('🎯 Recognition result:', result);
      
      if (result) {
        // Update recent results buffer (size 3)
        setRecentResults(prev => {
          const next = [...prev, result].slice(-3);
          return next;
        });

        // Compute 2/3 majority and average distance
        const buffer = [...recentResults, result].slice(-3);
        const counts: Record<string, { count: number; distances: number[]; last: typeof result }> = {};
        for (const r of buffer) {
          if (!counts[r.studentId]) counts[r.studentId] = { count: 0, distances: [], last: r };
          counts[r.studentId].count += 1;
          counts[r.studentId].distances.push(r.distance);
          counts[r.studentId].last = r;
        }
        let bestId: string | null = null;
        let bestCount = 0;
        for (const id of Object.keys(counts)) {
          if (counts[id].count > bestCount) {
            bestCount = counts[id].count;
            bestId = id;
          }
        }

        if (bestId && bestCount >= 2) {
          const { distances, last } = counts[bestId];
          const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
          if (avgDistance < 0.60) {
            // Accept and mark attendance once
            setLastRecognitionResult(last);
            setSuccessfulRecognitions(prev => prev + 1);

            const attendanceMarked = await advancedFaceRecognitionService.markAttendance(
              last.studentId,
              last.studentName,
              last.className,
              last.confidence
            );

            if (attendanceMarked) {
              const updatedRecords = advancedFaceRecognitionService.getAttendanceSession();
              setAttendanceRecords(updatedRecords);
              setRecognitionStatus(`✅ Attendance marked for ${last.studentName}`);
              toast.success(`✅ ${last.studentName} - Attendance Marked! (${(last.confidence * 100).toFixed(1)}%)`, { duration: 4000 });
              onAttendanceMarked?.(last);
              // Reset buffer after success to avoid double marking
              setRecentResults([]);
              setTimeout(() => {
                setLastRecognitionResult(null);
                setRecognitionStatus('Ready for next student...');
              }, 1500);
            } else {
              setRecognitionStatus(`⚠️ ${last.studentName} - Already marked today`);
              toast(`⚠️ ${last.studentName} already marked attendance today`, { icon: '⚠️', duration: 3000 });
              setTimeout(() => {
                setLastRecognitionResult(null);
                setRecognitionStatus('Ready for next student...');
              }, 1000);
            }
          } else {
            setRecognitionStatus(`ℹ️ Consistency detected but distance too high (avg ${(avgDistance).toFixed(3)})`);
          }
        } else {
          setRecognitionStatus('Analyzing multiple frames for consistency...');
        }
      } else {
        setLastRecognitionResult(null);
        setRecognitionStatus('❌ Face not recognized - Check browser console (F12) for distance details');
        setDiagnosticInfo('💡 Open console to see exact distances for debugging');
        console.log('⚠️ No match found - face may not be enrolled');
        console.log('💡 DEBUGGING TIP: Check the distance values above. If they are 0.45-0.55, you are close but need re-enrollment.');
      }
    } catch (error) {
      console.error('❌ Recognition error:', error);
      setRecognitionStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Recognition error - check console');
    }
  }, [isModelsLoaded, currentFace, confidenceThreshold, onAttendanceMarked]);

  // Real-time recognition loop
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isRecognitionActive && isVideoReady && isModelsLoaded) {
      console.log('✅ Starting recognition interval (every', recognitionInterval, 'ms)');
      // Call once immediately
      performRecognition();
      // Then set up interval
      intervalId = setInterval(() => {
        console.log('⏰ Recognition interval tick');
        performRecognition();
      }, recognitionInterval);
    }
    
    return () => {
      if (intervalId) {
        console.log('🛑 Stopping recognition interval');
        clearInterval(intervalId);
      }
    };
  }, [isRecognitionActive, isVideoReady, isModelsLoaded, recognitionInterval]);

  const startRecognition = () => {
    if (!isModelsLoaded) {
      toast.error('AI models not loaded yet. Please wait...');
      return;
    }
    
    if (!isVideoReady) {
      toast.error('Please start the camera first');
      return;
    }
    
    if (enrolledStudentsCount === 0) {
      toast.error('No enrolled students found. Please enroll faces first.');
      return;
    }
    
    setIsRecognitionActive(true);
    setRecognitionStatus('Real-time recognition started');
    toast.success('🎯 Real-time attendance recognition started!');
  };

  const stopRecognition = () => {
    setIsRecognitionActive(false);
    setLastRecognitionResult(null);
    setRecognitionStatus('Recognition stopped');
    toast('⏹️ Face recognition stopped', { icon: 'ℹ️' });
  };

  const clearAttendanceSession = () => {
    advancedFaceRecognitionService.clearAttendanceSession();
    setAttendanceRecords([]);
    setRecognitionAttempts(0);
    setSuccessfulRecognitions(0);
    toast.success('🔄 Attendance session cleared');
  };

  const recognitionAccuracy = recognitionAttempts > 0 ? (successfulRecognitions / recognitionAttempts) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Target className="w-8 h-8 mr-3 text-green-600" />
                Real-Time Attendance Recognition
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                AI-powered face recognition for automatic attendance marking
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-8 h-8" />
              </button>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{enrolledStudentsCount}</p>
                  <p className="text-sm text-blue-600">Enrolled Students</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{attendanceRecords.length}</p>
                  <p className="text-sm text-green-600">Present Today</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <Eye className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">{recognitionAttempts}</p>
                  <p className="text-sm text-purple-600">Recognition Attempts</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{recognitionAccuracy.toFixed(1)}%</p>
                  <p className="text-sm text-yellow-600">Accuracy Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Live Camera Feed
            </h3>
            
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-96 bg-gray-900 rounded-lg object-cover"
              />
              
              {/* Face detection and recognition overlay */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-0 w-full h-96 rounded-lg pointer-events-none"
              />
              
              {/* BIG CENTER STATUS - So you can see what's happening! */}
              {isRecognitionActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black bg-opacity-80 text-white px-8 py-6 rounded-2xl text-center max-w-md">
                    {currentFace ? (
                      <>
                        <div className="text-6xl mb-2">👤</div>
                        <div className="text-2xl font-bold mb-2">Face Detected!</div>
                        <div className="text-lg text-green-400">Analyzing...</div>
                        {recognitionAttempts > 0 && (
                          <div className="text-sm mt-2 text-gray-300">
                            Attempt #{recognitionAttempts}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-6xl mb-2">🔍</div>
                        <div className="text-2xl font-bold mb-2">Looking for face...</div>
                        <div className="text-sm text-yellow-400">Please face the camera</div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Success/Failure Message */}
              {lastRecognitionResult && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-green-600 bg-opacity-95 text-white px-8 py-6 rounded-2xl text-center max-w-md">
                    <div className="text-6xl mb-4">✅</div>
                    <div className="text-3xl font-bold mb-2">{lastRecognitionResult.studentName}</div>
                    <div className="text-xl">Attendance Marked!</div>
                    <div className="text-sm mt-2">
                      Confidence: {(lastRecognitionResult.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}
              
              {/* Status Overlay - Bottom */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{recognitionStatus}</span>
                    <div className="flex items-center gap-2">
                      {isRecognitionActive && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      )}
                      <span className="text-xs">
                        Threshold: {(confidenceThreshold * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Camera Controls */}
            <div className="flex gap-3 mt-4">
              {!isVideoReady ? (
                <button
                  onClick={startCamera}
                  disabled={!isModelsLoaded}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex-1"
                >
                  <Camera className="w-5 h-5" />
                  Start Camera
                </button>
              ) : !isRecognitionActive ? (
                <button
                  onClick={startRecognition}
                  disabled={!isModelsLoaded || enrolledStudentsCount === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex-1"
                >
                  <Target className="w-5 h-5" />
                  Start Recognition
                </button>
              ) : (
                <button
                  onClick={stopRecognition}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex-1"
                >
                  <Square className="w-5 h-5" />
                  Stop Recognition
                </button>
              )}
              
              <button
                onClick={clearAttendanceSession}
                disabled={attendanceRecords.length === 0}
                className="flex items-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
              >
                Clear Session
              </button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Recognition Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Recognition Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confidence Threshold: {(confidenceThreshold * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Less Strict (50%)</span>
                    <span>More Strict (95%)</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recognition Interval: {recognitionInterval / 1000}s
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="5000"
                    step="500"
                    value={recognitionInterval}
                    onChange={(e) => setRecognitionInterval(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Fast (1s)</span>
                    <span>Slow (5s)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Info */}
            {diagnosticInfo && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl shadow-lg p-6 border-2 border-yellow-400">
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Debugging Info
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                  {diagnosticInfo}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Press <kbd className="px-2 py-1 bg-yellow-200 dark:bg-yellow-800 rounded">F12</kbd> → Console tab to see detailed distance logs
                </p>
              </div>
            )}

            {/* System Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                System Status
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>AI Models:</span>
                  <span className={isModelsLoaded ? 'text-green-600' : 'text-gray-500'}>
                    {isModelsLoaded ? '✅ Loaded' : '⏳ Loading'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Camera:</span>
                  <span className={isVideoReady ? 'text-green-600' : 'text-gray-500'}>
                    {isVideoReady ? '✅ Ready' : '❌ Not Ready'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Face Detection:</span>
                  <span className={currentFace ? 'text-green-600' : 'text-gray-500'}>
                    {currentFace ? '✅ Active' : '❌ No Face'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Recognition:</span>
                  <span className={isRecognitionActive ? 'text-green-600' : 'text-gray-500'}>
                    {isRecognitionActive ? '✅ Running' : '⏹️ Stopped'}
                  </span>
                </div>
              </div>
            </div>

            {/* Today's Attendance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Today's Attendance ({attendanceRecords.length})
              </h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {attendanceRecords.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                    No attendance marked yet
                  </p>
                ) : (
                  attendanceRecords.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          {record.studentName}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {record.className} • {record.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          {(record.confidence * 100).toFixed(1)}%
                        </p>
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeAttendance;
