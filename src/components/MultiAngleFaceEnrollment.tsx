import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CheckCircle, XCircle, RotateCcw, User, AlertTriangle, Eye, Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import advancedFaceRecognitionService, { EnrollmentStep } from '../services/advancedFaceRecognitionService';

interface MultiAngleFaceEnrollmentProps {
  onEnrollmentComplete?: (success: boolean, studentId?: string) => void;
  onClose?: () => void;
}

const MultiAngleFaceEnrollment: React.FC<MultiAngleFaceEnrollmentProps> = ({
  onEnrollmentComplete,
  onClose
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // State management
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [enrollmentSteps, setEnrollmentSteps] = useState<EnrollmentStep[]>([]);
  const [currentFace, setCurrentFace] = useState<any>(null);
  
  // Student information
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  
  // Status and progress
  const [enrollmentStatus, setEnrollmentStatus] = useState('Loading AI models...');
  const [overallProgress, setOverallProgress] = useState(0);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // Initialize system on component mount
  useEffect(() => {
    initializeSystem();
    loadAvailableStudents();
    return () => {
      stopCamera();
    };
  }, []);

  // Real-time face detection for current step
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isVideoReady && isModelsLoaded && !showStudentForm && !isCapturing) {
      intervalId = setInterval(detectFaces, 500); // Detect faces every 500ms
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isVideoReady, isModelsLoaded, showStudentForm, isCapturing]);

  const initializeSystem = async () => {
    try {
      setEnrollmentStatus('Loading AI models...');
      
      // Load Face-API models
      const modelsLoaded = await advancedFaceRecognitionService.initializeModels();
      setIsModelsLoaded(modelsLoaded);
      
      if (modelsLoaded) {
        setEnrollmentStatus('AI models loaded - Ready for enrollment');
        toast.success('🤖 AI models loaded successfully!');
      } else {
        setEnrollmentStatus('Failed to load AI models');
        toast.error('Failed to load AI models');
      }
    } catch (error) {
      console.error('❌ System initialization error:', error);
      setEnrollmentStatus('Error loading AI models');
      toast.error('Failed to initialize face recognition system');
    }
  };

  const loadAvailableStudents = async () => {
    try {
      setLoadingStudents(true);
      console.log('🔄 Loading students from database...');
      
      const response = await fetch('http://localhost:8080/api/students');
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Response data:', data);
        
        if (data.success && data.data && Array.isArray(data.data.content)) {
          setAvailableStudents(data.data.content);
          console.log(`📚 Loaded ${data.data.content.length} students for enrollment:`, data.data.content);
          
          if (data.data.content.length === 0) {
            toast.error('No students found in database');
          } else {
            toast.success(`Loaded ${data.data.content.length} students`);
          }
        } else {
          console.error('❌ Invalid data format:', data);
          toast.error('Invalid student data format');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error loading students:', error);
      toast.error(`Failed to load students: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingStudents(false);
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
          setEnrollmentStatus('Camera ready - Follow the step instructions');
          toast.success('📹 Camera ready for multi-angle enrollment!');
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      setEnrollmentStatus('Camera error');
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
    setEnrollmentStatus('Camera stopped');
  };

  // Real-time face detection with overlay
  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !overlayCanvasRef.current || !isModelsLoaded) return;

    try {
      const face = await advancedFaceRecognitionService.detectFace(videoRef.current, {
        minConfidence: 0.5,  // Balanced - detects faces reliably
        inputSize: 512       // Higher resolution for better quality
      });
      
      setCurrentFace(face);
      
      // Provide real-time quality feedback
      if (face) {
        const quality = face.quality?.score || 0;
        if (quality >= 0.75) {
          setEnrollmentStatus(`✅ Perfect quality (${(quality * 100).toFixed(0)}%) - Ready to capture!`);
        } else if (quality >= 0.65) {
          setEnrollmentStatus(`⚠️ Good quality (${(quality * 100).toFixed(0)}%) - Can improve`);
        } else {
          setEnrollmentStatus(`❌ Low quality (${(quality * 100).toFixed(0)}%) - Improve lighting/position`);
        }
      } else {
        setEnrollmentStatus('👤 No face detected - Position yourself in frame');
      }
      
      drawFaceOverlay(face);
    } catch (error) {
      console.error('❌ Face detection error:', error);
    }
  }, [isModelsLoaded]);

  // Draw face detection overlay
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
      
      // Determine color based on quality thresholds
      let color = '#ef4444'; // red for low quality (< 65%)
      let status = '❌ Too Low';
      if (qualityScore >= 0.75) {
        color = '#22c55e'; // green for excellent quality
        status = '✅ Perfect!';
      } else if (qualityScore >= 0.65) {
        color = '#f59e0b'; // yellow for good quality
        status = '⚠️ Good';
      }

      // Draw bounding box with thicker lines
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      // Draw corner markers for better visibility
      const cornerLength = 20;
      ctx.lineWidth = 6;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(box.x, box.y + cornerLength);
      ctx.lineTo(box.x, box.y);
      ctx.lineTo(box.x + cornerLength, box.y);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(box.x + box.width - cornerLength, box.y);
      ctx.lineTo(box.x + box.width, box.y);
      ctx.lineTo(box.x + box.width, box.y + cornerLength);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(box.x, box.y + box.height - cornerLength);
      ctx.lineTo(box.x, box.y + box.height);
      ctx.lineTo(box.x + cornerLength, box.y + box.height);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(box.x + box.width - cornerLength, box.y + box.height);
      ctx.lineTo(box.x + box.width, box.y + box.height);
      ctx.lineTo(box.x + box.width, box.y + box.height - cornerLength);
      ctx.stroke();

      // Draw quality bar above the face
      const barWidth = box.width;
      const barHeight = 12;
      const barX = box.x;
      const barY = box.y - 30;
      
      // Bar background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Bar fill (quality level)
      ctx.fillStyle = color;
      ctx.fillRect(barX, barY, barWidth * qualityScore, barHeight);
      
      // Quality percentage text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(
        `${(qualityScore * 100).toFixed(0)}% ${status}`,
        barX + barWidth + 10,
        barY + 10
      );
      ctx.shadowBlur = 0;

      // Draw step instruction overlay at top
      if (enrollmentSteps[currentStepIndex]) {
        const currentStep = enrollmentSteps[currentStepIndex];
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(15, 15, canvas.width - 30, 100);
        
        // Border
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(15, 15, canvas.width - 30, 100);
        
        // Step number badge
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(60, 50, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${currentStepIndex + 1}`, 60, 58);
        
        // Step info
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.fillText(currentStep.name, 110, 45);
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#d1d5db';
        ctx.fillText(currentStep.instruction, 110, 70);
        
        ctx.font = '14px Arial';
        ctx.fillText(
          `Progress: ${currentStepIndex + 1}/${enrollmentSteps.length} angles`,
          110, 95
        );
      }
    } else {
      // No face detected - show guide frame
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const guideWidth = 300;
      const guideHeight = 400;
      
      // Dashed guide rectangle
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
      
      // Guide text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText('Position Your Face Here', centerX, centerY);
      ctx.font = '18px Arial';
      ctx.fillText('↑', centerX, centerY + 30);
      ctx.shadowBlur = 0;
    }
  };

  const startEnrollment = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student for enrollment');
      return;
    }
    
    try {
      // Start enrollment process
      const steps = await advancedFaceRecognitionService.startEnrollment(
        selectedStudent.id.toString(),
        `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        selectedStudent.department || selectedStudent.branch || 'Unknown'
      );
      
      setEnrollmentSteps(steps);
      setCurrentStepIndex(0);
      setShowStudentForm(false);
      setOverallProgress(0);
      
      // Start camera
      await startCamera();
      
      toast.success(`🎓 Starting multi-angle enrollment for ${selectedStudent.firstName} ${selectedStudent.lastName}`);
    } catch (error) {
      console.error('❌ Error starting enrollment:', error);
      toast.error('Failed to start enrollment process');
    }
  };

  const captureCurrentStep = async () => {
    if (!videoRef.current || !enrollmentSteps[currentStepIndex] || isCapturing) return;

    setIsCapturing(true);
    const currentStep = enrollmentSteps[currentStepIndex];
    
    try {
      setEnrollmentStatus(`Capturing ${currentStep.name}...`);
      
      const result = await advancedFaceRecognitionService.captureEnrollmentStep(
        videoRef.current,
        currentStep.id,
        0.75 // Minimum quality threshold
      );
      
      if (result.success) {
        // Update step as completed
        const updatedSteps = [...enrollmentSteps];
        updatedSteps[currentStepIndex] = {
          ...currentStep,
          completed: true,
          quality: result.quality,
          descriptor: result.descriptor
        };
        
        // Debug: Check if descriptor was saved
        console.log('🔍 Step captured:', {
          stepId: currentStep.id,
          quality: result.quality,
          hasDescriptor: !!result.descriptor,
          descriptorLength: result.descriptor?.length
        });
        
        setEnrollmentSteps(updatedSteps);
        
        // Update progress
        const completedCount = updatedSteps.filter(step => step.completed).length;
        setOverallProgress((completedCount / enrollmentSteps.length) * 100);
        
        toast.success(result.message);
        setEnrollmentStatus(result.message);
        
        // Move to next step or show save option
        if (currentStepIndex < enrollmentSteps.length - 1) {
          setTimeout(() => {
            setCurrentStepIndex(currentStepIndex + 1);
            setEnrollmentStatus(`Ready for ${updatedSteps[currentStepIndex + 1].name}`);
          }, 1500);
        } else {
          // All steps completed - show save button
          setEnrollmentStatus('All steps completed! Review and save enrollment.');
          toast.success('🎉 All face angles captured! Click "Save Enrollment" to complete.');
        }
      } else {
        toast.error(result.message);
        setEnrollmentStatus(result.message);
      }
    } catch (error) {
      console.error('❌ Capture error:', error);
      toast.error('Failed to capture face data');
      setEnrollmentStatus('Capture failed - Try again');
    } finally {
      setIsCapturing(false);
    }
  };

  const completeEnrollment = async (steps: EnrollmentStep[]) => {
    try {
      setEnrollmentStatus('Processing enrollment...');
      toast.loading('Processing multi-angle enrollment...', { id: 'enrollment' });
      
      // Debug: Check steps before sending
      console.log('🔍 Steps being sent to completeEnrollment:', steps);
      const completedSteps = steps.filter(step => step.completed && step.descriptor);
      console.log('🔍 Completed steps with descriptors:', completedSteps.length);
      
      if (completedSteps.length < 3) {
        toast.dismiss('enrollment');
        toast.error(`Need at least 3 completed steps. Currently have ${completedSteps.length}.`);
        setEnrollmentStatus(`Need at least 3 steps (have ${completedSteps.length})`);
        return;
      }
      
      const success = await advancedFaceRecognitionService.completeEnrollment(
        selectedStudent.id.toString(),
        `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        selectedStudent.department || selectedStudent.branch || 'Unknown',
        steps
      );
      
      toast.dismiss('enrollment');
      
      if (success) {
        setEnrollmentStatus('Enrollment completed successfully!');
        setOverallProgress(100);
        toast.success(`🎉 ${selectedStudent.firstName} ${selectedStudent.lastName} enrolled successfully with ${steps.filter(s => s.completed).length} face angles!`);
        
        // Notify parent component
        setTimeout(() => {
          onEnrollmentComplete?.(true, selectedStudent.id.toString());
        }, 2000);
      } else {
        setEnrollmentStatus('Enrollment failed');
        toast.error('Failed to save enrollment data');
        onEnrollmentComplete?.(false);
      }
    } catch (error) {
      console.error('❌ Enrollment completion error:', error);
      setEnrollmentStatus('Enrollment error');
      toast.error('Failed to complete enrollment');
      onEnrollmentComplete?.(false);
    }
  };

  const resetEnrollment = () => {
    setEnrollmentSteps([]);
    setCurrentStepIndex(0);
    setOverallProgress(0);
    setShowStudentForm(true);
    setCurrentFace(null);
    stopCamera();
    
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
    }
    
    toast('Enrollment reset. Starting over...', { icon: 'ℹ️' });
  };

  const skipStep = () => {
    if (currentStepIndex < enrollmentSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      toast('Step skipped', { icon: '⏭️' });
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      toast('Previous step', { icon: '⏮️' });
    }
  };

  const completedStepsCount = enrollmentSteps.filter(step => step.completed).length;
  const currentStep = enrollmentSteps[currentStepIndex];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <User className="w-8 h-8 mr-3 text-blue-600" />
                Multi-Angle Face Enrollment
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Advanced face recognition with multiple capture angles for maximum accuracy
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

          {/* Overall Progress Bar */}
          {!showStudentForm && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Overall Progress: {completedStepsCount}/{enrollmentSteps.length} steps completed
                </span>
                <span className="text-sm text-gray-500">
                  {overallProgress.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Student Selection */}
        {showStudentForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Select Student for Face Enrollment
            </h2>
            
            {loadingStudents ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Loading students from database...</p>
              </div>
            ) : availableStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">No students found. Please check your database connection.</p>
                <button
                  onClick={loadAvailableStudents}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry Loading Students
                </button>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search students by name, ID, or class..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Student List */}
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                  {availableStudents
                    .filter(student => 
                      !studentSearchTerm || 
                      `${student.firstName} ${student.lastName}`.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                      student.ienNumber?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                      student.department?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                      student.branch?.toLowerCase().includes(studentSearchTerm.toLowerCase())
                    )
                    .map(student => (
                      <div
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`p-4 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          selectedStudent?.id === student.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {student.firstName} {student.lastName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ID: {student.ienNumber || student.id} • Dept: {student.department || student.branch || 'N/A'} • Year: {student.year || 'N/A'}
                            </p>
                            {student.faceDescriptor && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                ⚠️ Already has face data - will be replaced
                              </p>
                            )}
                          </div>
                          {selectedStudent?.id === student.id && (
                            <CheckCircle className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Selected Student Info */}
                {selectedStudent && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Selected Student:</h4>
                    <p className="text-blue-700 dark:text-blue-300">
                      <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong><br />
                      ID: {selectedStudent.ienNumber || selectedStudent.id}<br />
                      Department: {selectedStudent.department || selectedStudent.branch || 'N/A'}<br />
                      Year: {selectedStudent.year || 'N/A'} • Semester: {selectedStudent.semester || 'N/A'}
                    </p>
                  </div>
                )}

                {/* Start Button */}
                <div className="mt-6">
                  <button
                    onClick={startEnrollment}
                    disabled={!isModelsLoaded || !selectedStudent}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                  >
                    <Camera className="w-5 h-5" />
                    Start Multi-Angle Enrollment
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Enrollment Interface */}
        {!showStudentForm && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Camera Feed */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Camera Feed
              </h3>
              
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-80 bg-gray-900 rounded-lg object-cover"
                />
                
                {/* Face detection overlay */}
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute top-0 left-0 w-full h-80 rounded-lg pointer-events-none"
                />
                
                {/* Hidden canvas for processing */}
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Status Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm">
                    {enrollmentStatus}
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
                ) : completedStepsCount < enrollmentSteps.length ? (
                  <>
                    <button
                      onClick={previousStep}
                      disabled={currentStepIndex === 0}
                      className="flex items-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Previous
                    </button>
                    
                    <button
                      onClick={captureCurrentStep}
                      disabled={isCapturing || !currentFace || currentFace.quality.score < 0.75}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex-1"
                    >
                      <Camera className="w-5 h-5" />
                      {isCapturing ? 'Capturing...' : `Capture ${currentStep?.name || 'Step'}`}
                    </button>
                    
                    <button
                      onClick={skipStep}
                      disabled={currentStepIndex >= enrollmentSteps.length - 1}
                      className="flex items-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                    >
                      Skip
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        console.log('🔍 Save button clicked. Current steps:', enrollmentSteps);
                        const stepsWithDescriptors = enrollmentSteps.filter(step => step.completed && step.descriptor);
                        console.log('🔍 Steps with descriptors:', stepsWithDescriptors.length);
                        setShowSaveConfirmation(true);
                      }}
                      disabled={isCapturing || completedStepsCount < 3}
                      className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex-1 text-lg"
                    >
                      <CheckCircle className="w-6 h-6" />
                      Save Enrollment ({completedStepsCount} angles)
                      {completedStepsCount < 3 && (
                        <span className="text-sm opacity-75">- Need {3 - completedStepsCount} more</span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setCurrentStepIndex(enrollmentSteps.length - 1)}
                      className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                      <Camera className="w-5 h-5" />
                      Add More
                    </button>
                  </>
                )}
                
                <button
                  onClick={resetEnrollment}
                  disabled={isCapturing}
                  className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Enrollment Steps Panel */}
            <div className="space-y-6">
              {/* Current Step Details */}
              {currentStep && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Current Step: {currentStep.name}
                  </h3>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <p className="text-blue-800 dark:text-blue-200 font-medium">
                      {currentStep.description}
                    </p>
                    <p className="text-blue-600 dark:text-blue-300 text-sm mt-2">
                      {currentStep.instruction}
                    </p>
                  </div>
                  
                  {/* Face Quality Indicator */}
                  {currentFace && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Face Quality: {(currentFace.quality.score * 100).toFixed(1)}%
                      </h4>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span>{(currentFace.quality.factors.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span>{(currentFace.quality.factors.size * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Position:</span>
                          <span>{(currentFace.quality.factors.position * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sharpness:</span>
                          <span>{(currentFace.quality.factors.sharpness * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Steps Progress */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Enrollment Steps
                  </h3>
                  {completedStepsCount >= 3 && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Ready to Save!</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {enrollmentSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        index === currentStepIndex
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : step.completed
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {step.completed ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : index === currentStepIndex ? (
                          <Eye className="w-6 h-6 text-blue-600" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {step.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {step.description}
                        </p>
                        {step.completed && (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Quality: {(step.quality * 100).toFixed(1)}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                  System Status
                </h3>
                
                <div className="space-y-2 text-sm">
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
                    <span>Steps Completed:</span>
                    <span className="text-blue-600">{completedStepsCount}/{enrollmentSteps.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Confirmation Dialog */}
        {showSaveConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
                Confirm Enrollment
              </h3>
              
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Ready to save face enrollment for <strong>{selectedStudent?.firstName} {selectedStudent?.lastName}</strong>?
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Enrollment Summary:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Student: {selectedStudent?.firstName} {selectedStudent?.lastName} (ID: {selectedStudent?.id})</li>
                    <li>• Department: {selectedStudent?.department || selectedStudent?.branch || 'N/A'}</li>
                    <li>• Face angles captured: {completedStepsCount}/{enrollmentSteps.length}</li>
                    <li>• Average quality: {enrollmentSteps.length > 0 ? 
                      ((enrollmentSteps.filter(s => s.completed).reduce((sum, s) => sum + (s.quality || 0), 0) / completedStepsCount) * 100).toFixed(1) 
                      : 0}%</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSaveConfirmation(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                >
                  Cancel
                </button>
                
                <button
                  onClick={() => {
                    setShowSaveConfirmation(false);
                    completeEnrollment(enrollmentSteps);
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  <CheckCircle className="w-5 h-5" />
                  Save to Database
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiAngleFaceEnrollment;
