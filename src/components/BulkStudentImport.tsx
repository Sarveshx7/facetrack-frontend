import React, { useState, useRef } from 'react';
import { Upload, Download, Users, AlertCircle, CheckCircle, X, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BulkImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const BulkStudentImport: React.FC<BulkImportProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setImportResult(null);
      } else {
        toast.error('Please select a CSV file');
      }
    }
  };

  const downloadTemplate = () => {
    const csvContent = `ienNumber,rollNumber,firstName,lastName,email,phoneNumber,department,branch,year,semester
12217001,001,John,Doe,john.doe@example.com,9876543210,CSE,CSE,3,5
12217002,002,Jane,Smith,jane.smith@example.com,9876543211,ECE,ECE,2,3
12217003,003,Mike,Johnson,mike.johnson@example.com,9876543212,CSD,CSD,4,7`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully!');
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const student: any = {};
      
      headers.forEach((header, i) => {
        student[header] = values[i] || '';
      });
      
      // Convert numeric fields
      if (student.year) student.year = parseInt(student.year) || 1;
      if (student.semester) student.semester = parseInt(student.semester) || 1;
      
      return student;
    });
  };

  const validateStudent = (student: any): string[] => {
    const errors: string[] = [];
    
    if (!student.ienNumber) errors.push('IEN Number is required');
    if (!student.rollNumber) errors.push('Roll Number is required');
    if (!student.firstName) errors.push('First Name is required');
    if (!student.lastName) errors.push('Last Name is required');
    if (!student.email) errors.push('Email is required');
    if (!student.phoneNumber) errors.push('Phone Number is required');
    if (!student.department) errors.push('Department is required');
    if (!student.branch) errors.push('Branch is required');
    
    // Validate email format
    if (student.email && !/\S+@\S+\.\S+/.test(student.email)) {
      errors.push('Invalid email format');
    }
    
    // Validate phone number
    if (student.phoneNumber && !/^\d{10}$/.test(student.phoneNumber)) {
      errors.push('Phone number must be 10 digits');
    }
    
    return errors;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    
    try {
      const csvText = await file.text();
      const students = parseCSV(csvText);
      
      let successCount = 0;
      let failedCount = 0;
      const allErrors: string[] = [];
      
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const validationErrors = validateStudent(student);
        
        if (validationErrors.length > 0) {
          failedCount++;
          allErrors.push(`Row ${i + 2}: ${validationErrors.join(', ')}`);
          continue;
        }
        
        try {
          const response = await fetch('http://localhost:8080/api/students', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(student),
          });
          
          const data = await response.json();
          
          if (data.success) {
            successCount++;
          } else {
            failedCount++;
            allErrors.push(`Row ${i + 2}: ${data.message || 'Failed to create student'}`);
          }
        } catch (error) {
          failedCount++;
          allErrors.push(`Row ${i + 2}: Network error`);
        }
      }
      
      setImportResult({
        success: successCount,
        failed: failedCount,
        errors: allErrors
      });
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} students!`);
        onImportComplete();
      }
      
      if (failedCount > 0) {
        toast.error(`${failedCount} students failed to import`);
      }
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to process CSV file');
    } finally {
      setIsUploading(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Upload className="w-6 h-6 mr-2 text-blue-600" />
            Bulk Student Import
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!importResult ? (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                How to import students:
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200 text-sm">
                <li>Download the CSV template below</li>
                <li>Fill in your student data following the template format</li>
                <li>Upload the completed CSV file</li>
                <li>Review and confirm the import</li>
              </ol>
            </div>

            {/* Template Download */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Download Template
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get the CSV template with the correct format and sample data
              </p>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </button>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Upload CSV File
                </h3>
                {file ? (
                  <div className="mb-4">
                    <p className="text-green-600 dark:text-green-400 mb-2">
                      ✅ Selected: {file.name}
                    </p>
                    <button
                      onClick={resetImport}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Select a CSV file with student data
                  </p>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!file && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </button>
                )}
              </div>
            </div>

            {/* Import Button */}
            {file && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={resetImport}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isUploading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors flex items-center"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Import Students
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Import Results */
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-lg font-semibold text-green-600">
                    {importResult.success} Successful
                  </span>
                </div>
                {importResult.failed > 0 && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <span className="text-lg font-semibold text-red-600">
                      {importResult.failed} Failed
                    </span>
                  </div>
                )}
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Import Errors:
                </h4>
                <div className="max-h-40 overflow-y-auto">
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={resetImport}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Import More
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkStudentImport;
