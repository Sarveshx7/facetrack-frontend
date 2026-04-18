import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import faceRecognitionService from '../services/faceRecognitionService';

interface Props {
  onClose?: () => void;
  onComplete?: () => void;
}

const SimpleFaceEnrollment: React.FC<Props> = ({ onClose, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isReady, setIsReady] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [samples, setSamples] = useState<Float32Array[]>([]);
  const [status, setStatus] = useState('Initializing...');
  const [currentQuality, setCurrentQuality] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const REQUIRED_SAMPLES = 5; // Increased from 3 to 5 for better quality
  const MIN_QUALITY_SCORE = 0.90; // Ultra-strict: 90% quality required

  useEffect(() => {
    initialize();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (selectedStudent && isReady) {
      startCamera();
    }
  }, [selectedStudent, isReady]);

  const initialize = async () => {
    // Load models
    const loaded = await faceRecognitionService.initialize();
    if (!loaded) {
      toast.error('Failed to load AI models');
      return;
    }

    // Load students
    try {
      console.log('📡 Fetching students from API...');
      const response = await fetch('http://localhost:8080/api/students');
      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📡 Response data:', data);
      
      // Handle different response formats
      let studentList = [];
      if (Array.isArray(data)) {
        // Direct array
        studentList = data;
      } else if (data.success && data.data && data.data.content && Array.isArray(data.data.content)) {
        // Paginated response: data.data.content
        studentList = data.data.content;
      } else if (data.success && Array.isArray(data.data)) {
        // Simple success wrapper: data.data
        studentList = data.data;
      } else if (data.data && Array.isArray(data.data)) {
        // Just data.data
        studentList = data.data;
      }
      
      setStudents(studentList);
      console.log('✅ Loaded students:', studentList.length);
      
      if (studentList.length === 0) {
        toast.error('No students found in database');
      } else {
        toast.success(`Loaded ${studentList.length} students`);
      }
    } catch (error) {
      console.error('❌ Failed to load students:', error);
      toast.error('Failed to load students - check backend');
      setStudents([]);
    }

    setIsReady(true);
    setStatus('Ready - select a student');
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setStatus('Camera ready - hold still for capture');
          startDetection();
        };
      }
    } catch (error) {
      toast.error('Camera access denied');
      setStatus('Camera error');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startDetection = () => {
    const detect = async () => {
      if (!videoRef.current || !canvasRef.current || samples.length >= REQUIRED_SAMPLES || isProcessing) {
        return;
      }

      const result = await faceRecognitionService.detectFace(videoRef.current);
      
      if (result) {
        setCurrentQuality(result.quality);
        
        // Get face box for visual feedback
        drawOverlay(result.quality, result.box);

        // Stricter quality check - must be above MIN_QUALITY_SCORE
        const isHighQuality = result.quality.score >= MIN_QUALITY_SCORE;
        
        if (isHighQuality && samples.length < REQUIRED_SAMPLES) {
          setSamples(prev => {
            const next = [...prev, result.descriptor];
            toast.success(`✅ Sample ${next.length}/${REQUIRED_SAMPLES} captured - Quality: ${(result.quality.score * 100).toFixed(0)}%`, { duration: 1500 });
            setStatus(`Captured ${next.length}/${REQUIRED_SAMPLES} samples - Quality: ${(result.quality.score * 100).toFixed(0)}%`);
            
            if (next.length === REQUIRED_SAMPLES) {
              enrollNow(next);
            }
            
            return next;
          });
          
          // Wait 1 second before capturing next sample to ensure different angle
          setTimeout(detect, 1000);
          return;
        } else if (!isHighQuality) {
          const qualityPercent = (result.quality.score * 100).toFixed(0);
          setStatus(`⚠️ Quality: ${qualityPercent}% (need 90%+) - ${result.quality.reason}`);
        }
      } else {
        setCurrentQuality(null);
        setStatus('👤 No face detected - Position your face in the frame');
        clearOverlay();
      }

      setTimeout(detect, 300); // Check faster for better responsiveness
    };

    detect();
  };

  const enrollNow = async (sampleList: Float32Array[]) => {
    setIsProcessing(true);
    setStatus('Processing enrollment...');

    const result = await faceRecognitionService.enrollStudent(selectedStudent.id, sampleList);

    if (result.success) {
      toast.success('🎉 Enrollment successful!');
      setStatus('✅ Enrollment complete');
      setTimeout(() => {
        onComplete?.();
      }, 1500);
    } else {
      toast.error(result.message);
      setStatus('❌ Enrollment failed');
      setSamples([]);
      setIsProcessing(false);
    }
  };

  const drawFaceGuide = (faceBox?: any, quality?: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Ideal face position
    const guideWidth = width * 0.30;
    const guideHeight = height * 0.40;
    const guideX = centerX - guideWidth / 2;
    const guideY = centerY - guideHeight / 2;
    
    // Draw corner guides (4 corners)
    const cornerSize = 40;
    const cornerThickness = 4;
    const guideColor = quality && quality.isGood ? '#22c55e' : '#60a5fa';
    
    ctx.strokeStyle = guideColor;
    ctx.lineWidth = cornerThickness;
    ctx.lineCap = 'round';
    
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(guideX, guideY + cornerSize);
    ctx.lineTo(guideX, guideY);
    ctx.lineTo(guideX + cornerSize, guideY);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(guideX + guideWidth - cornerSize, guideY);
    ctx.lineTo(guideX + guideWidth, guideY);
    ctx.lineTo(guideX + guideWidth, guideY + cornerSize);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(guideX, guideY + guideHeight - cornerSize);
    ctx.lineTo(guideX, guideY + guideHeight);
    ctx.lineTo(guideX + cornerSize, guideY + guideHeight);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(guideX + guideWidth - cornerSize, guideY + guideHeight);
    ctx.lineTo(guideX + guideWidth, guideY + guideHeight);
    ctx.lineTo(guideX + guideWidth, guideY + guideHeight - cornerSize);
    ctx.stroke();
    
    // Draw dotted lines connecting corners
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = guideColor + '80'; // Semi-transparent
    ctx.strokeRect(guideX, guideY, guideWidth, guideHeight);
    ctx.setLineDash([]);
    
    // If face detected, draw detection box
    if (faceBox) {
      ctx.strokeStyle = quality && quality.isGood ? '#22c55e' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);
      
      // Draw face center point
      const faceCenterX = faceBox.x + faceBox.width / 2;
      const faceCenterY = faceBox.y + faceBox.height / 2;
      ctx.fillStyle = quality && quality.isGood ? '#22c55e' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(faceCenterX, faceCenterY, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Draw alignment guides
    ctx.strokeStyle = '#ffffff40';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Instructions
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    
    if (!faceBox) {
      ctx.fillText('👤 Position your face inside the frame', centerX, height - 50);
      ctx.font = '14px Arial';
      ctx.fillText('Center your face and fill the guide area', centerX, height - 25);
    } else if (quality) {
      if (quality.isGood) {
        ctx.fillStyle = '#22c55e';
        ctx.fillText('✓ Perfect! Hold steady...', centerX, height - 50);
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(quality.reason, centerX, height - 50);
      }
    }
    ctx.shadowBlur = 0;
  };

  const drawOverlay = (quality: any, faceBox: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Always draw face guide first with face box
    drawFaceGuide(faceBox, quality);

    // Quality indicator at top left
    const color = quality.isGood ? '#22c55e' : '#ef4444';
    ctx.fillStyle = color;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(quality.reason, 20, 40);
    ctx.shadowBlur = 0;
    
    // Progress indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    const progressText = `Sample ${samples.length}/${REQUIRED_SAMPLES}`;
    ctx.fillText(progressText, 20, 75);
    
    // Quality percentage
    ctx.font = '18px Arial';
    const qualityPercent = `Quality: ${(quality.score * 100).toFixed(0)}%`;
    ctx.fillText(qualityPercent, 20, 100);
  };

  const clearOverlay = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Show face guide even when no face detected
    drawFaceGuide(null, null);
  };

  const filteredStudents = Array.isArray(students) 
    ? students.filter(s => {
        const searchString = `${s.firstName} ${s.lastName} ${s.ienNumber} ${s.department} ${s.branch || ''}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
      })
    : [];

  if (!selectedStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-1">Face Enrollment</h1>
                  <p className="text-white/80 text-lg">Select a student to begin enrollment</p>
                </div>
              </div>
              {onClose && (
                <button 
                  onClick={onClose} 
                  className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <XCircle className="w-8 h-8 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Search & Students Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
            {/* Search Bar */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="🔍 Search by name, IEN, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-white/30 focus:border-white focus:outline-none text-gray-800 text-lg placeholder-gray-500 transition-all duration-200 shadow-lg"
              />
            </div>

            {/* Students Grid */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-white/70">
                  <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">No students found</p>
                </div>
              ) : (
                filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className="w-full text-left p-6 bg-white/20 backdrop-blur-sm rounded-2xl hover:bg-white/30 transition-all duration-200 border border-white/20 hover:border-white/40 hover:scale-[1.02] hover:shadow-xl group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-white mb-1 group-hover:text-yellow-200 transition-colors">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-white/80 text-sm">
                          <span className="font-semibold">{student.ienNumber}</span> • {student.department} • Year {student.year}
                        </p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-all">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h2>
                <p className="text-white/80 text-lg">
                  {selectedStudent.ienNumber} • {selectedStudent.department} • Year {selectedStudent.year}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedStudent(null)} 
              className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200"
            >
              <XCircle className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Card - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20">
              <div className="relative rounded-2xl overflow-hidden bg-black/50">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-[500px] object-cover"
                />
                <canvas
                  ref={canvasRef}
                  width={1280}
                  height={720}
                  className="absolute top-0 left-0 w-full h-[500px] pointer-events-none"
                />
                
                {/* Quality Badge Overlay */}
                {currentQuality && (
                  <div className="absolute top-6 right-6">
                    <div className={`px-6 py-3 rounded-2xl backdrop-blur-md border-2 ${
                      currentQuality.isGood 
                        ? 'bg-green-500/30 border-green-400 text-green-100' 
                        : 'bg-orange-500/30 border-orange-400 text-orange-100'
                    }`}>
                      <p className="font-bold text-lg">{(currentQuality.score * 100).toFixed(0)}% Quality</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Info & Progress */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20">
              <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                <Camera className="w-6 h-6" />
                Capture Progress
              </h3>
              
              <div className="space-y-4">
                {/* Circular Progress */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#22c55e"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(samples.length / REQUIRED_SAMPLES) * 351.86} 351.86`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-white">{samples.length}</p>
                        <p className="text-white/70 text-sm">of {REQUIRED_SAMPLES}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sample Pills */}
                <div className="space-y-2">
                  {[...Array(REQUIRED_SAMPLES)].map((_, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-2xl transition-all duration-300 ${
                        i < samples.length 
                          ? 'bg-green-500/30 border-2 border-green-400 scale-100' 
                          : 'bg-white/5 border-2 border-white/20 scale-95'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {i < samples.length ? (
                          <CheckCircle className="w-6 h-6 text-green-300" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-white/40" />
                        )}
                        <span className="text-white font-semibold">
                          Sample {i + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20">
              <h3 className="text-white font-bold text-xl mb-4">Status</h3>
              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-white text-center font-semibold">{status}</p>
              </div>
            </div>

            {/* Instructions Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20">
              <h3 className="text-white font-bold text-xl mb-4">📋 Instructions</h3>
              <ul className="space-y-3 text-white/90">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span>Good lighting on face</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span>Look directly at camera</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span>Keep face centered</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span>Hold still for capture</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span>90%+ quality required</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleFaceEnrollment;
