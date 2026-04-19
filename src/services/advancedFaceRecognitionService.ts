import * as faceapi from 'face-api.js';
// Fix for browser environment
const fs = null;
// Enhanced interfaces for comprehensive face recognition
export interface FaceDetection {
  detection: faceapi.FaceDetection;
  landmarks: faceapi.FaceLandmarks68;
  descriptor: Float32Array;
  confidence: number;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  quality: {
    score: number;
    factors: {
      confidence: number;
      size: number;
      position: number;
      sharpness: number;
      lighting: number;
    };
  };
}

export interface EnrollmentStep {
  id: string;
  name: string;
  description: string;
  instruction: string;
  completed: boolean;
  quality: number;
  descriptor?: Float32Array;
  image?: string;
}

export interface StudentEnrollment {
  studentId: string;
  studentName: string;
  className: string;
  descriptors: Float32Array[];
  enrollmentSteps: EnrollmentStep[];
  averageDescriptor: Float32Array;
  enrollmentDate: Date;
  qualityScore: number;
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  className: string;
  timestamp: Date;
  confidence: number;
  status: 'present' | 'duplicate' | 'low_confidence';
}

class AdvancedFaceRecognitionService {
  private modelsLoaded = false;
  private modelLoadingPromise: Promise<void> | null = null;
  private enrolledStudents: Map<string, StudentEnrollment> = new Map();
  private attendanceSession: Map<string, AttendanceRecord> = new Map();
  private recognitionActive = false;

  // Enhanced enrollment steps for multi-angle capture
  private readonly enrollmentSteps: Omit<EnrollmentStep, 'completed' | 'quality' | 'descriptor' | 'image'>[] = [
    {
      id: 'front',
      name: 'Front View',
      description: 'Look straight at the camera',
      instruction: 'Position your face directly facing the camera. Keep your head straight and look directly into the lens.'
    },
    {
      id: 'left',
      name: 'Left Profile',
      description: 'Turn your head slightly left',
      instruction: 'Turn your head about 15-20 degrees to the left while keeping your eyes on the camera.'
    },
    {
      id: 'right',
      name: 'Right Profile', 
      description: 'Turn your head slightly right',
      instruction: 'Turn your head about 15-20 degrees to the right while keeping your eyes on the camera.'
    },
    {
      id: 'tilt_up',
      name: 'Slight Tilt Up',
      description: 'Tilt your head slightly upward',
      instruction: 'Tilt your chin up slightly (about 10 degrees) while looking at the camera.'
    },
    {
      id: 'tilt_down',
      name: 'Slight Tilt Down',
      description: 'Tilt your head slightly downward', 
      instruction: 'Tilt your chin down slightly (about 10 degrees) while looking at the camera.'
    }
  ];

  constructor() {
    this.loadEnrollmentData();
  }

  // Initialize Face-API.js models with TensorFlow.js backend
  async initializeModels(): Promise<boolean> {
    console.log('🔧 initializeModels() called, current state:', {
      modelsLoaded: this.modelsLoaded,
      hasLoadingPromise: !!this.modelLoadingPromise
    });
    
    if (this.modelsLoaded) {
      console.log('✅ Models already loaded, returning true');
      return true;
    }
    
    if (this.modelLoadingPromise) {
      console.log('⏳ Models currently loading, waiting...');
      await this.modelLoadingPromise;
      return this.modelsLoaded;
    }

    console.log('🚀 Starting model loading process...');
    this.modelLoadingPromise = this.loadModelsInternal();
    await this.modelLoadingPromise;
    console.log('🏁 Model loading completed, result:', this.modelsLoaded);
    return this.modelsLoaded;
  }

  private async loadModelsInternal(): Promise<void> {
    try {
      const MODEL_URL = '/models';
      
      console.log('🤖 Loading Face-API.js models with TensorFlow.js backend...');
      console.log('📂 Model URL:', MODEL_URL);
      
      // Test if models are accessible
      try {
        const testResponse = await fetch(`${MODEL_URL}/face_landmark_68_model-weights_manifest.json`);
        if (!testResponse.ok) {
          throw new Error(`Models not accessible: ${testResponse.status}`);
        }
        console.log('✅ Models directory is accessible');
      } catch (fetchError) {
        console.error('❌ Cannot access models directory:', fetchError);
        throw new Error('Models directory not accessible');
      }
      
      // Load models one by one with better error reporting
      console.log('📥 Loading SSD MobileNet v1...');
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      console.log('✅ SSD MobileNet v1 loaded');
      
      console.log('📥 Loading Tiny Face Detector...');
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      console.log('✅ Tiny Face Detector loaded');
      
      console.log('📥 Loading Face Landmark 68...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log('✅ Face Landmark 68 loaded');
      
      console.log('📥 Loading Face Recognition Net...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      console.log('✅ Face Recognition Net loaded');

      this.modelsLoaded = true;
      console.log('🎉 ALL FACE-API.JS MODELS LOADED SUCCESSFULLY!');
      console.log('🧠 TensorFlow.js backend initialized and ready');
    } catch (error) {
      console.error('❌ CRITICAL ERROR loading face detection models:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';
      console.error('📋 Error details:', {
        message: errorMessage,
        stack: errorStack,
        modelUrl: '/models'
      });
      this.modelsLoaded = false;
      this.modelLoadingPromise = null;
      throw new Error(`Face Recognition Service Unavailable: ${errorMessage}`);
    }
  }

  // Enhanced face detection with comprehensive quality assessment
  async detectFace(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    options: {
      minConfidence?: number;
      inputSize?: number;
      scoreThreshold?: number;
    } = {}
  ): Promise<FaceDetection | null> {
    if (!this.modelsLoaded) {
      console.warn('Models not loaded. Call initializeModels() first.');
      return null;
    }

    const { minConfidence = 0.5, inputSize = 512, scoreThreshold = 0.5 } = options;

    try {
      // Use SSD MobileNet for better accuracy
      const detection = await faceapi
        .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({
          minConfidence,
          maxResults: 1
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return null;

      const box = detection.detection.box;
      const confidence = detection.detection.score;
      
      // Calculate comprehensive quality metrics
      const quality = this.calculateFaceQuality(detection, input);

      return {
        detection: detection.detection,
        landmarks: detection.landmarks,
        descriptor: detection.descriptor,
        confidence,
        box: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height
        },
        quality
      };
    } catch (error) {
      console.error('❌ Error detecting faces:', error);
      return null;
    }
  }

  // Comprehensive face quality assessment
  private calculateFaceQuality(
    detection: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{
      detection: faceapi.FaceDetection;
    }, faceapi.FaceLandmarks68>>,
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): FaceDetection['quality'] {
    const confidence = detection.detection.score;
    const box = detection.detection.box;
    
    // Get input dimensions
    const inputWidth = input instanceof HTMLVideoElement ? input.videoWidth : input.width;
    const inputHeight = input instanceof HTMLVideoElement ? input.videoHeight : input.height;
    
    // Size factor (prefer medium to large faces)
    const faceArea = box.width * box.height;
    const inputArea = inputWidth * inputHeight;
    const faceRatio = faceArea / inputArea;
    const idealRatio = 0.15; // Face should occupy about 15% of the frame
    const sizeFactor = Math.min(1, Math.sqrt(faceRatio / idealRatio));
    
    // Position factor (prefer centered faces)
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const idealCenterX = inputWidth / 2;
    const idealCenterY = inputHeight / 2;
    
    const xDeviation = Math.abs(centerX - idealCenterX) / (inputWidth / 2);
    const yDeviation = Math.abs(centerY - idealCenterY) / (inputHeight / 2);
    const positionFactor = Math.max(0, 1 - (xDeviation + yDeviation) / 2);
    
    // Sharpness factor (based on landmark detection quality)
    const landmarks = detection.landmarks;
    const sharpnessFactor = landmarks ? Math.min(1, faceArea / 8000) : 0.3;
    
    // Lighting factor (estimate based on face area and detection confidence)
    const lightingFactor = Math.min(1, confidence * 1.5);
    
    const factors = {
      confidence: confidence,
      size: sizeFactor,
      position: positionFactor,
      sharpness: sharpnessFactor,
      lighting: lightingFactor
    };
    
    // Weighted combination for overall quality score
    const score = (
      factors.confidence * 0.3 + 
      factors.size * 0.25 + 
      factors.position * 0.2 + 
      factors.sharpness * 0.15 +
      factors.lighting * 0.1
    );
    
    return {
      score: Math.min(1, Math.max(0, score)),
      factors
    };
  }

  // Get enrollment steps for multi-angle capture
  getEnrollmentSteps(): EnrollmentStep[] {
    return this.enrollmentSteps.map(step => ({
      ...step,
      completed: false,
      quality: 0
    }));
  }

  // Start new enrollment process (clears previous data)
  async startEnrollment(studentId: string, studentName: string, className: string): Promise<EnrollmentStep[]> {
    // Clear any existing enrollment data for this student
    await this.clearStudentEnrollment(studentId);
    
    console.log(`🎓 Starting multi-angle enrollment for ${studentName} (ID: ${studentId})`);
    
    return this.getEnrollmentSteps();
  }

  // Capture face for specific enrollment step
  async captureEnrollmentStep(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    stepId: string,
    minQuality: number = 0.75
  ): Promise<{
    success: boolean;
    quality: number;
    descriptor?: Float32Array;
    message: string;
  }> {
    try {
      const face = await this.detectFace(input, {
        minConfidence: 0.6,
        inputSize: 512
      });

      if (!face) {
        return {
          success: false,
          quality: 0,
          message: 'No face detected. Please position your face clearly in the camera.'
        };
      }

      const quality = face.quality.score;

      if (quality < minQuality) {
        return {
          success: false,
          quality,
          message: `Face quality too low (${(quality * 100).toFixed(1)}%). Please improve lighting and positioning.`
        };
      }

      // Capture was successful
      console.log(`✅ Step '${stepId}' captured with quality: ${(quality * 100).toFixed(1)}%`);
      
      return {
        success: true,
        quality,
        descriptor: face.descriptor,
        message: `Excellent! Step captured with ${(quality * 100).toFixed(1)}% quality.`
      };
    } catch (error) {
      console.error(`❌ Error capturing enrollment step '${stepId}':`, error);
      return {
        success: false,
        quality: 0,
        message: 'Error capturing face data. Please try again.'
      };
    }
  }

  // Complete enrollment process and save to backend
  async completeEnrollment(
    studentId: string,
    studentName: string,
    className: string,
    enrollmentSteps: EnrollmentStep[]
  ): Promise<boolean> {
    try {
      // Validate all steps are completed
      const completedSteps = enrollmentSteps.filter(step => step.completed && step.descriptor);
      
      if (completedSteps.length < 3) {
        throw new Error('At least 3 enrollment steps must be completed');
      }

      // Calculate average descriptor from all completed steps
      const descriptors = completedSteps.map(step => step.descriptor!);
      const averageDescriptor = this.calculateAverageDescriptor(descriptors);
      
      // Calculate overall quality score
      const qualityScore = completedSteps.reduce((sum, step) => sum + step.quality, 0) / completedSteps.length;

      // Create enrollment record
      const enrollment: StudentEnrollment = {
        studentId,
        studentName,
        className,
        descriptors,
        enrollmentSteps: enrollmentSteps,
        averageDescriptor,
        enrollmentDate: new Date(),
        qualityScore
      };

      // Save to backend database
      const success = await this.saveEnrollmentToBackend(enrollment);
      
      if (success) {
        // Store locally for immediate use
        this.enrolledStudents.set(studentId, enrollment);
        this.saveEnrollmentData();
        
        console.log(`🎉 Enrollment completed for ${studentName} with ${completedSteps.length} steps and ${(qualityScore * 100).toFixed(1)}% quality`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error completing enrollment:', error);
      return false;
    }
  }

  // Calculate average descriptor from multiple face descriptors
  private calculateAverageDescriptor(descriptors: Float32Array[]): Float32Array {
    if (descriptors.length === 0) {
      throw new Error('No descriptors provided for averaging');
    }

    const descriptorLength = descriptors[0].length;
    const averageDescriptor = new Float32Array(descriptorLength);

    // Calculate average for each dimension
    for (let i = 0; i < descriptorLength; i++) {
      let sum = 0;
      for (const descriptor of descriptors) {
        sum += descriptor[i];
      }
      averageDescriptor[i] = sum / descriptors.length;
    }

    return averageDescriptor;
  }

  // Save enrollment to backend database
  private async saveEnrollmentToBackend(enrollment: StudentEnrollment): Promise<boolean> {
    try {
      const enrollmentData = {
        studentId: enrollment.studentId,
        studentName: enrollment.studentName,
        className: enrollment.className,
        faceDescriptor: JSON.stringify(Array.from(enrollment.averageDescriptor)),
        enrollmentSteps: enrollment.enrollmentSteps.length,
        qualityScore: enrollment.qualityScore,
        enrollmentDate: enrollment.enrollmentDate.toISOString()
      };

      console.log(`💾 Saving enrollment to backend for student ${enrollment.studentId}...`);
      console.log('📊 Enrollment data being sent:', {
        studentId: enrollmentData.studentId,
        studentName: enrollmentData.studentName,
        descriptorLength: enrollment.averageDescriptor.length,
        qualityScore: enrollmentData.qualityScore,
        enrollmentSteps: enrollmentData.enrollmentSteps
      });
      
      const response = await fetch(`http://localhost:8080/api/students/${enrollment.studentId}/face-enrollment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrollmentData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Enrollment saved to backend:', result);
        return true;
      } else {
        const error = await response.json();
        console.error('❌ Backend enrollment failed:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving enrollment to backend:', error);
      return false;
    }
  }

  // Quick single-angle enrollment
  async enrollFace(
    studentId: string,
    faceDescriptor: Float32Array,
    landmarks: any,
    qualityScore: number
  ): Promise<boolean> {
    try {
      const enrollmentData = {
        studentId: parseInt(studentId),
        faceDescriptor: JSON.stringify(Array.from(faceDescriptor)),
        enrollmentType: 'SINGLE_ANGLE',
        qualityScore: qualityScore
      };

      console.log(`💾 Quick enrollment for student ${studentId}...`);
      
      const response = await fetch(`http://localhost:8080/api/students/${studentId}/face-enrollment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrollmentData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Quick enrollment saved:', result);
        return true;
      } else {
        const error = await response.json();
        console.error('❌ Quick enrollment failed:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error in quick enrollment:', error);
      return false;
    }
  }

  // Real-time face recognition for attendance
  async recognizeFace(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    confidenceThreshold: number = 0.7  // Production-ready threshold
  ): Promise<{
    studentId: string;
    studentName: string;
    className: string;
    confidence: number;
    distance: number;
  } | null> {
    console.log('🔍 Starting face recognition...');
    
    const face = await this.detectFace(input, {
      minConfidence: 0.7,  // Production-ready detection confidence
      inputSize: 512       // Higher resolution for better accuracy
    });
    
    if (!face) {
      console.log('❌ No face detected in recognition');
      return null;
    }
    
    console.log('✅ Face detected for recognition:', {
      confidence: face.confidence,
      qualityScore: face.quality.score,
      descriptorLength: face.descriptor.length
    });
    
    if (face.quality.score < 0.7) {  // High quality requirement for production
      console.log('❌ Face quality too low:', face.quality.score, '(need >= 0.7)');
      return null;
    }

    try {
      // Get enrolled faces from backend
      console.log('📡 Fetching enrolled faces from backend...');
      const enrolledFaces = await this.getEnrolledFacesFromBackend();
      console.log(`📊 Found ${enrolledFaces.length} enrolled faces in database`);
      
      if (enrolledFaces.length === 0) {
        console.log('❌ No enrolled faces found in database');
        return null;
      }
      
      let bestMatch: {
        studentId: string;
        studentName: string;
        className: string;
        confidence: number;
        distance: number;
      } | null = null;

      // Compare against all enrolled faces
      for (const student of enrolledFaces) {
        console.log(`🔍 Checking student: ${student.firstName} ${student.lastName}`, {
          hasDescriptor: !!student.faceDescriptor,
          descriptorLength: student.faceDescriptor?.length || 0
        });
        
        if (!student.faceDescriptor) {
          console.log(`⏭️ Skipping ${student.firstName} ${student.lastName} - no face descriptor`);
          continue;
        }

        try {
          const enrolledDescriptor = new Float32Array(JSON.parse(student.faceDescriptor));
          console.log(`📐 Parsed descriptor for ${student.firstName} ${student.lastName}:`, {
            length: enrolledDescriptor.length,
            sample: Array.from(enrolledDescriptor.slice(0, 5))
          });
          
          const distance = faceapi.euclideanDistance(face.descriptor, enrolledDescriptor);
          
          // Production-ready confidence calculation
          // Standard formula: confidence = 1 - (distance / maxDistance)
          // Tightened mapping to reduce optimistic scores
          const maxDistance = 0.5;
          const confidence = Math.max(0, Math.min(1, 1 - (distance / maxDistance)));
          
          console.log(`🔍 Comparing with ${student.firstName} ${student.lastName}:`, {
            distance: distance.toFixed(4),
            confidence: (confidence * 100).toFixed(1) + '%',
            threshold: (confidenceThreshold * 100).toFixed(1) + '%',
            meetsThreshold: confidence >= confidenceThreshold ? '✅' : '❌'
          });

          // Production-ready matching criteria (temporarily relaxed for debugging):
          // - Distance must be < 0.60 (was 0.45, then 0.50)
          // - Confidence must meet the threshold
          if (distance < 0.60 && confidence >= confidenceThreshold && 
              (!bestMatch || confidence > bestMatch.confidence)) {
            bestMatch = {
              studentId: student.id.toString(),
              studentName: `${student.firstName} ${student.lastName}`,
              className: student.department || student.branch || 'Unknown',
              confidence,
              distance
            };
            console.log(`✅ NEW BEST MATCH: ${student.firstName} ${student.lastName}`, {
              confidence: (confidence * 100).toFixed(1) + '%',
              distance: distance.toFixed(4)
            });
          } else {
            const reasons = [];
            if (distance >= 0.60) reasons.push(`distance too high (${distance.toFixed(4)} >= 0.60)`);
            if (confidence < confidenceThreshold) reasons.push(`confidence too low (${(confidence * 100).toFixed(1)}% < ${(confidenceThreshold * 100).toFixed(1)}%)`);
            
            console.log(`❌ Rejected: ${student.firstName} ${student.lastName}`, {
              reasons: reasons.join(', '),
              distance: distance.toFixed(4),
              confidence: (confidence * 100).toFixed(1) + '%',
              required: (confidenceThreshold * 100).toFixed(1) + '%'
            });
          }
        } catch (error) {
          console.error(`❌ Error parsing descriptor for ${student.firstName} ${student.lastName}:`, error);
        }
      }

      if (bestMatch) {
        console.log('🎉 FINAL RESULT: Match found!', {
          student: bestMatch.studentName,
          confidence: (bestMatch.confidence * 100).toFixed(1) + '%',
          distance: bestMatch.distance.toFixed(4)
        });
      } else {
        console.log('😞 FINAL RESULT: No match found among enrolled students');
        console.log('💡 TIP: If this is your face, you may need to enroll it first!');
      }

      return bestMatch;
    } catch (error) {
      console.error('❌ Recognition error:', error);
      return null;
    }
  }

  // Get enrolled faces from backend
  private async getEnrolledFacesFromBackend(): Promise<any[]> {
    try {
      const response = await fetch('http://localhost:8080/api/students/enrolled-faces');
      if (!response.ok) {
        throw new Error('Failed to fetch enrolled faces');
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('❌ Error fetching enrolled faces:', error);
      return [];
    }
  }

  // Mark attendance in backend
  async markAttendance(
    studentId: string,
    studentName: string,
    className: string,
    confidence: number
  ): Promise<boolean> {
    // Check for duplicate attendance in current session
    if (this.attendanceSession.has(studentId)) {
      console.log(`⚠️ Duplicate attendance prevented for ${studentName}`);
      return false;
    }

    try {
      const attendanceData = {
        studentId: parseInt(studentId),
        confidence: confidence,
        timestamp: new Date().toISOString(),
        status: 'present'
      };

      console.log(`📝 Marking attendance for ${studentName}...`);
      
      const response = await fetch('http://localhost:8080/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: parseInt(studentId),
          recognitionConfidence: confidence,
          method: 'FACE_RECOGNITION'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Add to session to prevent duplicates
        const attendanceRecord: AttendanceRecord = {
          studentId,
          studentName,
          className,
          timestamp: new Date(),
          confidence,
          status: 'present'
        };
        
        this.attendanceSession.set(studentId, attendanceRecord);
        
        console.log('✅ Attendance marked successfully:', result);
        console.log('📊 Current session size:', this.attendanceSession.size);
        console.log('📊 Session records:', Array.from(this.attendanceSession.values()));
        return true;
      } else {
        const error = await response.json();
        console.error('❌ Attendance marking failed:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error marking attendance:', error);
      return false;
    }
  }

  // Clear previous enrollment data for student
  async clearStudentEnrollment(studentId: string): Promise<boolean> {
    try {
      // Remove from local storage
      this.enrolledStudents.delete(studentId);
      this.saveEnrollmentData();
      
      // Clear from backend (optional - you might want to keep history)
      console.log(`🗑️ Cleared previous enrollment data for student ${studentId}`);
      return true;
    } catch (error) {
      console.error('❌ Error clearing student enrollment:', error);
      return false;
    }
  }

  // Get current attendance session
  getAttendanceSession(): AttendanceRecord[] {
    return Array.from(this.attendanceSession.values());
  }

  // Clear attendance session
  clearAttendanceSession(): void {
    this.attendanceSession.clear();
    console.log('🔄 Attendance session cleared');
  }

  // Get enrolled students count
  getEnrolledStudentsCount(): number {
    return this.enrolledStudents.size;
  }

  // Check if models are loaded
  areModelsLoaded(): boolean {
    return this.modelsLoaded;
  }

  // Local storage management
  private saveEnrollmentData(): void {
    try {
      const data = Array.from(this.enrolledStudents.entries()).map(([id, enrollment]) => ({
        id,
        enrollment: {
          ...enrollment,
          descriptors: enrollment.descriptors.map(desc => Array.from(desc)),
          averageDescriptor: Array.from(enrollment.averageDescriptor),
          enrollmentDate: enrollment.enrollmentDate.toISOString()
        }
      }));
      
      localStorage.setItem('faceEnrollmentData', JSON.stringify(data));
    } catch (error) {
      console.error('❌ Error saving enrollment data to localStorage:', error);
    }
  }

  private loadEnrollmentData(): void {
    try {
      const data = localStorage.getItem('faceEnrollmentData');
      if (data) {
        const enrollments = JSON.parse(data);
        
        for (const { id, enrollment } of enrollments) {
          const restoredEnrollment: StudentEnrollment = {
            ...enrollment,
            descriptors: enrollment.descriptors.map((desc: number[]) => new Float32Array(desc)),
            averageDescriptor: new Float32Array(enrollment.averageDescriptor),
            enrollmentDate: new Date(enrollment.enrollmentDate)
          };
          
          this.enrolledStudents.set(id, restoredEnrollment);
        }
        
        console.log(`📂 Loaded ${this.enrolledStudents.size} enrolled students from localStorage`);
      }
    } catch (error) {
      console.error('❌ Error loading enrollment data from localStorage:', error);
    }
  }
}

export default new AdvancedFaceRecognitionService();
