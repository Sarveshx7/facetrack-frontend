import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import faceRecognitionService from '../services/faceRecognitionService';

interface Props {
  onClose?: () => void;
}

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  timestamp: Date;
  confidence: number;
  subject?: string;
}

interface SubjectCandidate {
  id: number;
  subjectCode: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  faculty?: string;
  classroom?: string;
  type?: string;
  batch?: string;
}

const SimpleFaceAttendance: React.FC<Props> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isActiveRef = useRef(false);
  const recognitionInFlightRef = useRef(false);
  const markedCooldownUntilRef = useRef<Map<string, number>>(new Map());
  const lastToastAtRef = useRef<Map<string, number>>(new Map());

  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [markedStudents, setMarkedStudents] = useState<Set<string>>(new Set());

  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
  const [subjectCandidates, setSubjectCandidates] = useState<SubjectCandidate[]>([]);
  const [pendingMark, setPendingMark] = useState<{ studentId: string; studentName: string; confidence: number } | null>(null);

  useEffect(() => {
    initialize();
    return () => stopCamera();
  }, []);

  const initialize = async () => {
    const loaded = await faceRecognitionService.initialize();
    if (!loaded) {
      toast.error('Failed to load AI models');
      return;
    }

    setIsReady(true);
    setStatus('Ready - click Start to begin');
    toast.success('System ready!');
  };

  const confirmSubjectSelection = async (candidate: SubjectCandidate) => {
    if (!pendingMark) return;
    try {
      setSubjectPickerOpen(false);
      const res = await faceRecognitionService.markAttendance(
        pendingMark.studentId,
        pendingMark.confidence,
        candidate.id,
        `${candidate.subjectCode} - ${candidate.subjectName}`
      );

      if (res.ok) {
        const record: AttendanceRecord = {
          studentId: pendingMark.studentId,
          studentName: pendingMark.studentName,
          timestamp: new Date(),
          confidence: pendingMark.confidence,
          subject: res.subject || `${candidate.subjectCode} - ${candidate.subjectName}`,
        };
        setRecords(prev => [record, ...prev]);
        setMarkedStudents(prev => new Set([...Array.from(prev), pendingMark.studentId]));
        markedCooldownUntilRef.current.set(pendingMark.studentId, Date.now() + 15000);
        setStatus(`✅ ${record.subject} — checked in. Please step aside.`);
        toast.success(`✅ ${record.subject} — check-in complete`);
      } else {
        toast.error('Failed to mark attendance');
      }
    } finally {
      setPendingMark(null);
      setSubjectCandidates([]);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await videoRef.current.play();
        
        // Small delay to ensure video is fully loaded
        setTimeout(() => {
          console.log('📹 Video loaded and playing');
          isActiveRef.current = true;
          setIsActive(true);
          setStatus('Recognition active - show your face');
          toast.success('Recognition started!');
          console.log('🎬 Calling startRecognition...');
          startRecognition();
        }, 500);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    isActiveRef.current = false;
    setIsActive(false);
  };

  const startRecognition = () => {
    console.log('🚀 Starting recognition loop...');
    const COOLDOWN_MS = 15000;
    const LOOP_INTERVAL_MS = 2000;
    const GLOBAL_TOAST_THROTTLE_MS = 4000;
    const DONE_STATUS_TEXT = '✅ Checked in — please step aside. Next student, step forward.';
    const DONE_TOAST_TEXT = '✅ Check-in complete — next student, please step forward.';
    
    const recognize = async () => {
      if (!videoRef.current || !canvasRef.current || !isActiveRef.current) {
        console.log('⚠️ Recognition stopped:', { hasVideo: !!videoRef.current, hasCanvas: !!canvasRef.current, isActive: isActiveRef.current });
        return;
      }

      if (recognitionInFlightRef.current) {
        setTimeout(recognize, LOOP_INTERVAL_MS);
        return;
      }

      recognitionInFlightRef.current = true;

      console.log('👁️ Attempting face detection...');
      const result = await faceRecognitionService.detectFace(videoRef.current);
      
      console.log('🔍 Detection result:', result ? { quality: result.quality.score, isGood: result.quality.isGood, reason: result.quality.reason, box: result.box } : 'No face');
      
      if (result && result.quality.score >= 0.5) {
        setStatus('👤 Face detected - analyzing...');
        
        console.log('🎯 Attempting recognition...');
        const match = await faceRecognitionService.recognizeStudent(result.descriptor, 0.6);
        console.log('🎯 Recognition result:', match);
        
        if (match) {
          const now = Date.now();
          const cooldownUntil = markedCooldownUntilRef.current.get(match.studentId) || 0;
          if (now < cooldownUntil) {
            setStatus(DONE_STATUS_TEXT);
            recognitionInFlightRef.current = false;
            setTimeout(recognize, LOOP_INTERVAL_MS);
            return;
          }

          // Check if already marked
          if (!markedStudents.has(match.studentId)) {
            // Mark attendance
            const result = await faceRecognitionService.markAttendance(match.studentId, match.confidence);
            
            if (result.ok) {
              const record: AttendanceRecord = {
                studentId: match.studentId,
                studentName: match.studentName,
                timestamp: new Date(),
                confidence: match.confidence,
                subject: result.subject,
              };
              
              setRecords(prev => [record, ...prev]);
              setMarkedStudents(prev => new Set([...Array.from(prev), match.studentId]));
              markedCooldownUntilRef.current.set(match.studentId, Date.now() + COOLDOWN_MS);
              
              drawSuccess(match.studentName);
              setStatus(result.subject ? `✅ ${result.subject} — checked in. Please step aside.` : DONE_STATUS_TEXT);

              const lastGlobalToast = lastToastAtRef.current.get('__global__') || 0;
              if (Date.now() - lastGlobalToast > GLOBAL_TOAST_THROTTLE_MS) {
                toast.success(result.subject ? `✅ ${result.subject} — check-in complete` : DONE_TOAST_TEXT);
                lastToastAtRef.current.set('__global__', Date.now());
              }
              
              setTimeout(() => clearOverlay(), 3000);
            } else if ((result as any).requiresSubjectSelection) {
              const r: any = result;
              setPendingMark({ studentId: match.studentId, studentName: match.studentName, confidence: match.confidence });
              setSubjectCandidates(Array.isArray(r.candidates) ? r.candidates : []);
              setSubjectPickerOpen(true);
              setStatus(r.message || 'Please select subject');
            } else {
              setStatus(DONE_STATUS_TEXT);
              markedCooldownUntilRef.current.set(match.studentId, Date.now() + COOLDOWN_MS);
            }
          } else {
            setStatus(DONE_STATUS_TEXT);
            markedCooldownUntilRef.current.set(match.studentId, Date.now() + COOLDOWN_MS);
          }
        } else {
          setStatus('❌ Face not recognized');
          drawOverlay('Not Recognized', '#ef4444', result.box);
        }
      } else if (result) {
        setStatus(`⚠️ ${result.quality.reason}`);
        drawOverlay(result.quality.reason, '#f59e0b', result.box);
      } else {
        setStatus('👤 No face detected');
        clearOverlay();
      }

      recognitionInFlightRef.current = false;
      setTimeout(recognize, LOOP_INTERVAL_MS); // Check every 2 seconds
    };

    recognize();
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
      ctx.fillText('Keep your face centered and look at camera', centerX, height - 25);
    } else if (quality) {
      if (quality.isGood) {
        ctx.fillStyle = '#22c55e';
        ctx.fillText('✓ Face detected - recognizing...', centerX, height - 50);
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(quality.reason, centerX, height - 50);
      }
    }
    ctx.shadowBlur = 0;
  };

  const drawSuccess = (name: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw guide
    drawFaceGuide();
    
    // Success message
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(`✅ ${name}`, canvas.width / 2, 100);
    ctx.shadowBlur = 0;
  };

  const drawOverlay = (text: string, color: string, faceBox?: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Always draw face guide with face box if available
    const quality = { isGood: color === '#22c55e', reason: text };
    drawFaceGuide(faceBox, quality);
    
    // Status text
    ctx.fillStyle = color;
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(text, 20, 50);
    ctx.shadowBlur = 0;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 p-6">
      {subjectPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Subject</h3>
              <button
                onClick={() => {
                  setSubjectPickerOpen(false);
                  setPendingMark(null);
                  setSubjectCandidates([]);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-2">
              {subjectCandidates.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">No candidates found.</div>
              ) : (
                subjectCandidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => confirmSubjectSelection(c)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {c.subjectCode} - {c.subjectName}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {String(c.startTime || '').slice(0, 5)}-{String(c.endTime || '').slice(0, 5)}
                      {c.classroom ? ` • ${c.classroom}` : ''}
                      {c.faculty ? ` • ${c.faculty}` : ''}
                      {c.batch ? ` • Batch ${c.batch}` : ''}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Eye className="w-8 h-8 text-green-600" />
              Face Attendance
            </h1>
            {onClose && (
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <XCircle className="w-8 h-8" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-600">{records.length}</p>
              <p className="text-sm text-green-700">Present Today</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-600">{isActive ? 'Active' : 'Stopped'}</p>
              <p className="text-sm text-blue-700">Status</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-purple-600">{markedStudents.size}</p>
              <p className="text-sm text-purple-700">Unique Students</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <h3 className="text-lg font-semibold mb-4">Live Camera Feed</h3>
            
            <div className="relative mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-96 bg-gray-900 rounded-lg object-cover"
              />
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="absolute top-0 left-0 w-full h-96 pointer-events-none"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
              <p className="text-lg font-semibold">{status}</p>
            </div>

            {!isActive ? (
              <button
                onClick={startCamera}
                disabled={!isReady}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Start Recognition
              </button>
            ) : (
              <button
                onClick={() => { stopCamera(); setStatus('Stopped'); }}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
              >
                Stop Recognition
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <h3 className="text-lg font-semibold mb-4">Today's Attendance ({records.length})</h3>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {records.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No attendance marked yet</p>
              ) : (
                records.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-200">
                        {record.studentName}
                      </p>
                      <p className="text-sm text-green-600">
                        {record.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        {(record.confidence * 100).toFixed(1)}%
                      </p>
                      <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleFaceAttendance;
