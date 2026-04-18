import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CheckCircle, XCircle, Zap, User, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import advancedFaceRecognitionService from '../services/advancedFaceRecognitionService';

interface QuickFaceEnrollmentProps {
  onEnrollmentComplete?: (success: boolean, studentId?: string) => void;
  onClose?: () => void;
}

const QuickFaceEnrollment: React.FC<QuickFaceEnrollmentProps> = ({
  onEnrollmentComplete,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [currentFace, setCurrentFace] = useState<any>(null);
  const [faceQuality, setFaceQuality] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [showStudentSelection, setShowStudentSelection] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [status, setStatus] = useState('Initializing...');
  const [goodQualityFrames, setGoodQualityFrames] = useState(0);
  // Multi-sample averaging
  const [samples, setSamples] = useState<Float32Array[]>([]);
  const samplesTarget = 5;
  const lastSampleTimeRef = useRef<number>(0);

  useEffect(() => {
    initializeSystem();
    loadStudents();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isVideoReady && isModelsLoaded && !showStudentSelection && !isCapturing) {
      intervalId = setInterval(detectAndAnalyzeFace, 100);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isVideoReady, isModelsLoaded, showStudentSelection, isCapturing]);

  // Auto-capture countdown
  useEffect(() => {
    if (captureCountdown === null || captureCountdown === 0) return;
    
    const timer = setTimeout(() => {
      setCaptureCountdown(captureCountdown - 1);
      if (captureCountdown === 1) {
        captureNow();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [captureCountdown]);

  const initializeSystem = async () => {
    try {
      setStatus('Loading AI models...');
      const loaded = await advancedFaceRecognitionService.initializeModels();
      setIsModelsLoaded(loaded);
      
      if (loaded) {
        setStatus('✅ Ready to enroll!');
        toast.success('🤖 System ready!');
      } else {
        setStatus('❌ Failed to load AI models');
        toast.error('Failed to load models');
      }
    } catch (error) {
      console.error('Init error:', error);
      toast.error('Initialization failed');
    }
  };

  const loadStudents = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/students?page=0&size=100');
      const data = await response.json();
      
      if (data.success && data.data?.content) {
        setAvailableStudents(data.data.content);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
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
        videoRef.current.onloadedmetadata = async () => {
          try {
            // Explicitly play the video
            await videoRef.current?.play();
            setIsVideoReady(true);
            setStatus('📹 Camera ready - Show your face!');
            toast.success('📹 Camera started!');
          } catch (playError) {
            console.error('Video play error:', playError);
            toast.error('Failed to start video playback');
          }
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsVideoReady(false);
  };

  const detectAndAnalyzeFace = useCallback(async () => {
    if (!videoRef.current || !overlayCanvasRef.current || !isModelsLoaded || isCapturing) return;

    try {
      const face = await advancedFaceRecognitionService.detectFace(videoRef.current, {
        minConfidence: 0.5,
        inputSize: 416
      });
      
      setCurrentFace(face);
      
      if (face) {
        const quality = face.quality?.score || 0;
        setFaceQuality(quality);
        
        // Auto-capture logic: Need 2 consecutive good quality frames (lowered from 3)
        if (quality >= 0.55 && !captureCountdown && !isCapturing) {
          const newCount = goodQualityFrames + 1;
          setGoodQualityFrames(newCount);
          
          console.log(`Good quality frame ${newCount}/2`);
          
          if (newCount >= 2) {
            // Start auto-capture countdown
            console.log('Starting countdown!');
            setCaptureCountdown(3);
            setStatus('🎯 Perfect! Auto-capturing in 3...');
            toast.success('🎯 Hold steady! Auto-capturing...', { duration: 3000 });
          } else {
            setStatus(`✅ Good quality! Hold steady... (${newCount}/2)`);
          }
        } else if (quality < 0.55 && !captureCountdown) {
          if (goodQualityFrames > 0) {
            console.log('Quality dropped, resetting counter');
          }
          setGoodQualityFrames(0);
          
          if (quality >= 0.45) {
            setStatus(`⚠️ Almost there (${(quality * 100).toFixed(0)}%) - adjust slightly`);
          } else {
            setStatus('❌ Quality too low - improve lighting/position');
          }
        }

        // Multi-sample collection for averaging (quality gate 0.65)
        const now = Date.now();
        if (!isCapturing && quality >= 0.65 && samples.length < samplesTarget) {
          // Debounce sampling to ~500ms
          if (now - lastSampleTimeRef.current > 500) {
            lastSampleTimeRef.current = now;
            setSamples(prev => {
              const next = [...prev, face.descriptor];
              toast.success(`📸 Captured sample ${next.length}/${samplesTarget}`, { duration: 1000 });
              setStatus(`📈 Collecting high-quality samples: ${next.length}/${samplesTarget}`);
              return next;
            });
          }
        }

        // When enough samples collected, average and enroll automatically
        if (!isCapturing && samples.length >= samplesTarget) {
          setIsCapturing(true);
          setStatus('🧠 Averaging samples...');
          const averaged = averageDescriptors(samples);
          try {
            const success = await advancedFaceRecognitionService.enrollFace(
              selectedStudent.id.toString(),
              averaged,
              face.landmarks,
              quality
            );
            if (success) {
              toast.success('🎉 Enrollment complete with averaged descriptor');
              setStatus('✅ Enrollment successful!');
              setTimeout(() => {
                onEnrollmentComplete?.(true, selectedStudent.id.toString());
              }, 1500);
            } else {
              toast.error('Failed to save averaged enrollment');
              setStatus('❌ Save failed - try again');
              setIsCapturing(false);
              setSamples([]);
            }
          } catch (e) {
            console.error('Averaged enroll error:', e);
            toast.error('Enrollment failed');
            setIsCapturing(false);
            setSamples([]);
          }
        }
      } else {
        setGoodQualityFrames(0);
        setCaptureCountdown(null);
        setFaceQuality(0);
        setStatus('👤 No face detected - move into frame');
      }
      
      drawOverlay(face);
    } catch (error) {
      console.error('Detection error:', error);
    }
  }, [isModelsLoaded, isCapturing, goodQualityFrames, captureCountdown]);

  const drawOverlay = (face: any) => {
    if (!overlayCanvasRef.current || !videoRef.current) return;

    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (face) {
      const box = face.detection.box;
      const quality = face.quality?.score || 0;
      
      const color = quality >= 0.6 ? '#22c55e' : quality >= 0.5 ? '#f59e0b' : '#ef4444';
      
      // Draw box
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      
      // Quality bar
      const barWidth = box.width;
      const barHeight = 15;
      const barX = box.x;
      const barY = box.y - 25;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = color;
      ctx.fillRect(barX, barY, barWidth * quality, barHeight);
      
      // Quality text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(`${(quality * 100).toFixed(0)}%`, barX + barWidth + 10, barY + 12);
      ctx.shadowBlur = 0;
      
      // Countdown overlay
      if (captureCountdown !== null && captureCountdown > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 120px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(captureCountdown.toString(), canvas.width / 2, canvas.height / 2 + 40);
      }
    } else {
      // Guide frame
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const guideWidth = 300;
      const guideHeight = 400;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.setLineDash([15, 15]);
      ctx.strokeRect(
        centerX - guideWidth / 2,
        centerY - guideHeight / 2,
        guideWidth,
        guideHeight
      );
      ctx.setLineDash([]);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText('Position Your Face Here', centerX, centerY);
      ctx.shadowBlur = 0;
    }
  };

  // Helper: average descriptors
  const averageDescriptors = (descs: Float32Array[]) => {
    const len = descs[0].length;
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      let sum = 0;
      for (const d of descs) sum += d[i];
      out[i] = sum / descs.length;
    }
    return out;
  };

  const captureNow = async () => {
    if (!currentFace || !selectedStudent) return;

    setIsCapturing(true);
    setStatus('📸 Capturing face data...');

    try {
      // If we already have some samples, include this and average; else single-shot
      let descriptorToSave: Float32Array;
      if (samples.length > 0) {
        const combined = [...samples, currentFace.descriptor].slice(0, samplesTarget);
        descriptorToSave = averageDescriptors(combined);
      } else {
        descriptorToSave = currentFace.descriptor;
      }

      const success = await advancedFaceRecognitionService.enrollFace(
        selectedStudent.id.toString(),
        descriptorToSave,
        currentFace.landmarks,
        faceQuality
      );

      if (success) {
        toast.success(`🎉 Enrollment complete! Quality: ${(faceQuality * 100).toFixed(0)}%`);
        setStatus('✅ Enrollment successful!');
        
        setTimeout(() => {
          onEnrollmentComplete?.(true, selectedStudent.id.toString());
        }, 2000);
      } else {
        toast.error('Failed to save enrollment');
        setStatus('❌ Save failed - try again');
        setIsCapturing(false);
        setCaptureCountdown(null);
        setSamples([]);
      }
    } catch (error) {
      console.error('Capture error:', error);
      toast.error('Capture failed');
      setIsCapturing(false);
      setCaptureCountdown(null);
      setSamples([]);
    }
  };

  const startEnrollment = () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }
    
    setShowStudentSelection(false);
    startCamera();
  };

  const filteredStudents = availableStudents.filter(student =>
    `${student.firstName} ${student.lastName} ${student.ienNumber} ${student.rollNumber}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Student Selection Screen
  if (showStudentSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Camera className="w-8 h-8 text-blue-600" />
                  Face Enrollment
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Fast and reliable face enrollment with auto-capture (65-85% confidence)
                </p>
              </div>
              {onClose && (
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                  <XCircle className="w-8 h-8" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Fast (30 sec)</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <Camera className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Auto & Manual</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">High Quality</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                {isModelsLoaded ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
                <span className="text-gray-900 dark:text-white font-medium">{status}</span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Student for Face Enrollment
              </label>
              
              <input
                type="text"
                placeholder="Search by name, IEN, or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                {filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      selectedStudent?.id === student.id
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className={`text-sm ${
                          selectedStudent?.id === student.id ? 'text-green-100' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {student.ienNumber} • {student.department}
                        </p>
                      </div>
                      {student.faceEnrolled && (
                        <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                          Re-enrolling
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startEnrollment}
              disabled={!selectedStudent || !isModelsLoaded}
              className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg disabled:from-gray-400 disabled:to-gray-400 hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-6 h-6" />
              Start Face Enrollment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Enrollment Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Enrolling: {selectedStudent?.firstName} {selectedStudent?.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedStudent?.ienNumber} • {selectedStudent?.department} • Auto & manual capture
              </p>
            </div>
            <button
              onClick={() => {
                stopCamera();
                setShowStudentSelection(true);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-8 h-8" />
            </button>
          </div>

          <div className="relative mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-[500px] bg-gray-900 rounded-lg object-cover"
            />
            
            <canvas
              ref={overlayCanvasRef}
              className="absolute top-0 left-0 w-full h-[500px] rounded-lg pointer-events-none"
            />

            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black bg-opacity-80 text-white p-4 rounded-lg">
                <p className="text-lg font-medium">{status}</p>
                {goodQualityFrames > 0 && !captureCountdown && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full ${
                            i <= goodQualityFrames ? 'bg-green-500' : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm">Hold steady...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Manual Capture Button */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => {
                if (currentFace && faceQuality >= 0.5) {
                  setCaptureCountdown(3);
                  toast.success('Starting capture!');
                } else if (!currentFace) {
                  toast.error('No face detected!');
                } else {
                  toast.error(`Quality too low (${(faceQuality * 100).toFixed(0)}%) - need ≥50%`);
                }
              }}
              disabled={isCapturing || captureCountdown !== null}
              className="flex-1 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <Camera className="w-6 h-6" />
              {isCapturing ? 'Capturing...' : captureCountdown ? `Capturing in ${captureCountdown}...` : 'Capture Now (Manual)'}
            </button>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              How It Works
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">1.</span>
                <span>Position your face in the frame</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">2.</span>
                <span>System detects face automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">3.</span>
                <span>When quality is good (2 frames), countdown auto-starts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">4.</span>
                <span>OR click "Capture Now" button anytime when face is detected</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">5.</span>
                <span>Hold steady during 3-second countdown!</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickFaceEnrollment;
