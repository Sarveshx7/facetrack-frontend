import * as faceapi from 'face-api.js';

/**
 * Professional Face Recognition Service
 * Built with best practices for high accuracy
 */

interface FaceQuality {
  score: number;
  isGood: boolean;
  reason: string;
}

interface EnrollmentResult {
  success: boolean;
  message: string;
  quality?: number;
}

interface RecognitionResult {
  studentId: string;
  studentName: string;
  confidence: number;
  distance: number;
}

export interface TimetableCandidate {
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

export type MarkAttendanceResult =
  | { ok: true; subject?: string }
  | { ok: false; alreadyMarked?: boolean }
  | { ok: false; requiresSubjectSelection: true; candidates: TimetableCandidate[]; message?: string };

class FaceRecognitionService {
  private modelsLoaded = false;
  private modelPath = '/models';

  /**
   * Initialize face detection models
   */
  async initialize(): Promise<boolean> {
    if (this.modelsLoaded) return true;

    try {
      console.log('🚀 Loading Face Recognition Models...');
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.modelPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.modelPath),
      ]);

      this.modelsLoaded = true;
      console.log('✅ Models loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load models:', error);
      return false;
    }
  }

  /**
   * Detect and extract face with quality check
   */
  async detectFace(
    input: HTMLVideoElement | HTMLImageElement
  ): Promise<{
    descriptor: Float32Array;
    landmarks: faceapi.FaceLandmarks68;
    quality: FaceQuality;
    box: { x: number; y: number; width: number; height: number };
  } | null> {
    if (!this.modelsLoaded) {
      console.error('Models not loaded');
      return null;
    }

    try {
      // Detect face with landmarks and descriptor
      const detection = await faceapi
        .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return null;
      }

      // Calculate quality
      const quality = this.assessQuality(detection, input);
      
      // Get face box
      const box = detection.detection.box;

      return {
        descriptor: detection.descriptor,
        landmarks: detection.landmarks,
        quality,
        box: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height
        }
      };
    } catch (error) {
      console.error('Face detection error:', error);
      return null;
    }
  }

  /**
   * Assess face quality (strict for enrollment)
   */
  private assessQuality(
    detection: any,
    input: HTMLVideoElement | HTMLImageElement
  ): FaceQuality {
    const { detection: det, landmarks } = detection;
    const box = det.box;
    
    // Get dimensions
    const width = input instanceof HTMLVideoElement ? input.videoWidth : input.width;
    const height = input instanceof HTMLVideoElement ? input.videoHeight : input.height;

    // Check detection confidence (ultra-strict for enrollment)
    const confidence = det.score;
    if (confidence < 0.90) {
      return {
        score: confidence,
        isGood: false,
        reason: `Confidence ${(confidence * 100).toFixed(0)}% (need 90%+) - improve lighting`,
      };
    }

    // Check face size (should be 15-35% of frame for optimal quality)
    const faceArea = box.width * box.height;
    const frameArea = width * height;
    const areaRatio = faceArea / frameArea;
    
    if (areaRatio < 0.15) {
      return {
        score: confidence * 0.5,
        isGood: false,
        reason: 'Face too small - move closer to camera',
      };
    }
    
    if (areaRatio > 0.40) {
      return {
        score: confidence * 0.6,
        isGood: false,
        reason: 'Face too close - move back slightly',
      };
    }

    // Check if face is well-centered (stricter)
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const frameCenter = { x: width / 2, y: height / 2 };
    
    const xOffset = Math.abs(centerX - frameCenter.x) / width;
    const yOffset = Math.abs(centerY - frameCenter.y) / height;
    
    if (xOffset > 0.25 || yOffset > 0.25) {
      return {
        score: confidence * 0.7,
        isGood: false,
        reason: 'Face not centered - center your face in frame',
      };
    }

    // Check face rotation (using eye landmarks)
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    const leftEyeCenter = leftEye.reduce((acc: any, p: any) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    leftEyeCenter.x /= leftEye.length;
    leftEyeCenter.y /= leftEye.length;
    
    const rightEyeCenter = rightEye.reduce((acc: any, p: any) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    rightEyeCenter.x /= rightEye.length;
    rightEyeCenter.y /= rightEye.length;
    
    const eyeAngle = Math.abs(Math.atan2(
      rightEyeCenter.y - leftEyeCenter.y,
      rightEyeCenter.x - leftEyeCenter.x
    ));
    
    if (eyeAngle > 0.2) {
      return {
        score: confidence * 0.8,
        isGood: false,
        reason: 'Head tilted - keep straight',
      };
    }

    // All checks passed - calculate final quality score
    // Factor in: confidence, face size, and centering
    const sizeScore = areaRatio >= 0.20 && areaRatio <= 0.35 ? 1.0 : 0.9;
    const centerScore = (xOffset < 0.15 && yOffset < 0.15) ? 1.0 : 0.95;
    const qualityScore = confidence * sizeScore * centerScore;
    
    return {
      score: qualityScore,
      isGood: qualityScore >= 0.90,
      reason: qualityScore >= 0.92 ? '⭐ Perfect quality!' : 
              qualityScore >= 0.90 ? '✓ Excellent quality' : 
              qualityScore >= 0.85 ? 'Good, but need 90%+' :
              'Quality too low',
    };
  }

  /**
   * Align face using eye landmarks for better descriptor consistency
   */
  private alignFace(
    canvas: HTMLCanvasElement,
    detection: any,
    input: HTMLVideoElement | HTMLImageElement
  ): HTMLCanvasElement {
    const ctx = canvas.getContext('2d')!;
    const landmarks = detection.landmarks;
    
    // Get eye positions
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    const leftEyeCenter = leftEye.reduce((acc: any, p: any) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    leftEyeCenter.x /= leftEye.length;
    leftEyeCenter.y /= leftEye.length;
    
    const rightEyeCenter = rightEye.reduce((acc: any, p: any) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    rightEyeCenter.x /= rightEye.length;
    rightEyeCenter.y /= rightEye.length;
    
    // Calculate rotation angle
    const angle = Math.atan2(
      rightEyeCenter.y - leftEyeCenter.y,
      rightEyeCenter.x - leftEyeCenter.x
    );
    
    // Rotate and crop face
    const box = detection.detection.box;
    const size = Math.max(box.width, box.height) * 1.2;
    
    canvas.width = size;
    canvas.height = size;
    
    ctx.translate(size / 2, size / 2);
    ctx.rotate(angle);
    ctx.drawImage(
      input,
      box.x - size / 2 + box.width / 2,
      box.y - size / 2 + box.height / 2,
      size,
      size,
      -size / 2,
      -size / 2,
      size,
      size
    );
    
    return canvas;
  }

  /**
   * Average multiple descriptors for robust enrollment
   */
  private averageDescriptors(descriptors: Float32Array[]): Float32Array {
    const len = descriptors[0].length;
    const avg = new Float32Array(len);
    
    for (let i = 0; i < len; i++) {
      let sum = 0;
      for (const desc of descriptors) {
        sum += desc[i];
      }
      avg[i] = sum / descriptors.length;
    }
    
    return avg;
  }

  /**
   * Enroll student with 5 high-quality samples
   */
  async enrollStudent(
    studentId: number,
    samples: Float32Array[]
  ): Promise<EnrollmentResult> {
    if (samples.length < 5) {
      return {
        success: false,
        message: 'Need at least 5 high-quality samples',
      };
    }

    try {
      // Average the samples
      const averagedDescriptor = this.averageDescriptors(samples);
      
      // Save to backend
      const response = await fetch(`http://localhost:8080/api/students/${studentId}/face-enrollment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          faceDescriptor: JSON.stringify(Array.from(averagedDescriptor)),
          enrollmentType: 'MULTI_SAMPLE_AVG',
          qualityScore: 0.95,
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Enrollment successful',
          quality: 0.95,
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          message: error.message || 'Failed to save enrollment',
        };
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  }

  /**
   * Recognize face against enrolled students
   */
  async recognizeStudent(
    descriptor: Float32Array,
    threshold: number = 0.6
  ): Promise<RecognitionResult | null> {
    try {
      // Get enrolled students from backend
      console.log('📡 Fetching enrolled faces...');
      const response = await fetch('http://localhost:8080/api/students/enrolled-faces');
      if (!response.ok) {
        console.error('❌ Failed to fetch enrolled faces, status:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('📡 Enrolled faces response:', data);
      
      const students = (data.success && Array.isArray(data.data)) ? data.data : [];
      console.log(`📊 Found ${students.length} enrolled students`);

      if (students.length === 0) {
        console.log('⚠️ No enrolled students found');
        return null;
      }

      let bestMatch: RecognitionResult | null = null;
      let bestDistance = Infinity;

      for (const student of students) {
        if (!student.faceDescriptor) continue;

        try {
          const enrolledDesc = new Float32Array(JSON.parse(student.faceDescriptor));
          const distance = faceapi.euclideanDistance(descriptor, enrolledDesc);
          
          // Use stricter threshold (lower distance = better match)
          if (distance < threshold && distance < bestDistance) {
            bestDistance = distance;
            // More generous confidence calculation (0.8 instead of 0.6)
            const confidence = Math.max(0, Math.min(1, 1 - distance / 0.8));
            
            bestMatch = {
              studentId: student.id.toString(),
              studentName: `${student.firstName} ${student.lastName}`,
              confidence,
              distance,
            };
          }

          console.log(`📊 ${student.firstName} ${student.lastName}: distance=${distance.toFixed(3)}`);
        } catch (e) {
          console.error('Error comparing with student:', student.id, e);
        }
      }

      if (bestMatch) {
        console.log(`✅ Match: ${bestMatch.studentName}, distance=${bestMatch.distance.toFixed(3)}, confidence=${(bestMatch.confidence * 100).toFixed(1)}%`);
      } else {
        console.log('❌ No match found');
      }

      return bestMatch;
    } catch (error) {
      console.error('Recognition error:', error);
      return null;
    }
  }

  /**
   * Mark attendance
   */
  async markAttendance(studentId: string, confidence: number, slotId?: number, subject?: string): Promise<MarkAttendanceResult> {
    try {
      const response = await fetch('http://localhost:8080/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: parseInt(studentId),
          confidence,
          method: 'FACE_RECOGNITION',
          slotId: slotId ?? null,
          subject: subject ?? null,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (payload?.requiresSubjectSelection) {
        return {
          ok: false,
          requiresSubjectSelection: true,
          candidates: Array.isArray(payload.candidates) ? payload.candidates : [],
          message: payload.message,
        };
      }

      if (payload?.alreadyMarked) {
        return { ok: false, alreadyMarked: true };
      }

      if (response.ok && payload?.success) {
        return { ok: true, subject: payload?.data?.subject };
      }

      return { ok: false };
    } catch (error) {
      console.error('Attendance marking error:', error);
      return { ok: false };
    }
  }
}

export default new FaceRecognitionService();
