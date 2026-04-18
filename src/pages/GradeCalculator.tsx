import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  TrendingUp,
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const GradeCalculator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [examScore, setExamScore] = useState(75);
  const [targetGrade, setTargetGrade] = useState(60);
  
  const [predictedGrade, setPredictedGrade] = useState<any>(null);
  const [minimumReq, setMinimumReq] = useState<any>(null);
  const [whatIf, setWhatIf] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/students');
      const result = await response.json();
      // Handle paginated response: result.data.content
      const data = result.data?.content || result.content || result.data || result || [];
      setStudents(Array.isArray(data) ? data : []);
      if (data && data.length > 0) {
        setSelectedStudent(data[0].id.toString());
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    }
  };

  const calculateAll = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    setIsLoading(true);
    try {
      const [pred, min, wif, sug] = await Promise.all([
        fetch(`http://localhost:8080/api/grade-calculator/predicted/${selectedStudent}?examScore=${examScore}`).then(r => r.json()),
        fetch(`http://localhost:8080/api/grade-calculator/minimum/${selectedStudent}?examScore=${examScore}`).then(r => r.json()),
        fetch(`http://localhost:8080/api/grade-calculator/what-if/${selectedStudent}?targetGrade=${targetGrade}&examScore=${examScore}`).then(r => r.json()),
        fetch(`http://localhost:8080/api/grade-calculator/suggestions/${selectedStudent}`).then(r => r.json()),
      ]);

      setPredictedGrade(pred);
      setMinimumReq(min);
      setWhatIf(wif);
      setSuggestions(sug);
      
      toast.success('Calculations complete!');
    } catch (error) {
      toast.error('Error calculating grades');
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (letterGrade: string) => {
    if (letterGrade.startsWith('A')) return 'text-green-600 dark:text-green-400';
    if (letterGrade.startsWith('B')) return 'text-blue-600 dark:text-blue-400';
    if (letterGrade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
    if (letterGrade.startsWith('D')) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center space-x-3 mb-2">
          <Calculator className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Grade Calculator & Predictor</h1>
        </div>
        <p className="text-purple-100">
          Predict final grades based on attendance and plan your academic success
        </p>
      </motion.div>

      {/* Input Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Parameters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expected Exam Score: {examScore}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={examScore}
              onChange={(e) => setExamScore(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Grade: {targetGrade}%
            </label>
            <input
              type="range"
              min="40"
              max="100"
              value={targetGrade}
              onChange={(e) => setTargetGrade(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={calculateAll}
              disabled={isLoading || !selectedStudent}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <><LoadingSpinner size="sm" /><span>Calculating...</span></>
              ) : (
                <><Calculator className="w-4 h-4" /><span>Calculate</span></>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results Grid */}
      {(predictedGrade || minimumReq || whatIf) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Predicted Grade */}
          {predictedGrade && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800"
            >
              <div className="flex items-center justify-between mb-4">
                <Award className="w-8 h-8 text-green-600" />
                <span className={`text-4xl font-bold ${getGradeColor(predictedGrade.letterGrade)}`}>
                  {predictedGrade.letterGrade}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Predicted Final Grade
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Score:</strong> {predictedGrade.predictedGrade}%
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Attendance:</strong> {predictedGrade.attendanceRate}%
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Status:</strong> <span className={predictedGrade.status === 'PASS' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{predictedGrade.status}</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* Minimum Requirement */}
          {minimumReq && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center justify-between mb-4">
                <Target className="w-8 h-8 text-blue-600" />
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  minimumReq.status === 'ON_TRACK' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
                }`}>
                  {minimumReq.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Minimum to Pass
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Required:</strong> {minimumReq.minimumRequiredRate}% attendance
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Classes Needed:</strong> {minimumReq.moreClassesNeeded}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Grade at Min:</strong> {minimumReq.predictedGradeAtMinimum}%
                </p>
              </div>
            </motion.div>
          )}

          {/* What-If Scenario */}
          {whatIf && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                {whatIf.achievable ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                To Reach {targetGrade}%
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Classes Needed:</strong> {whatIf.classesNeeded}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Required Rate:</strong> {whatIf.requiredAttendanceRate}%
                </p>
                <p className={`font-semibold ${whatIf.achievable ? 'text-green-600' : 'text-red-600'}`}>
                  {whatIf.achievable ? '✅ Achievable!' : '❌ Not Achievable'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {whatIf.recommendation}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Improvement Suggestions */}
      {suggestions && suggestions.suggestions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800"
        >
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-6 h-6 text-amber-600 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Improvement Suggestions
              </h3>
              <div className="space-y-2">
                {suggestions.suggestions.map((suggestion: string, index: number) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Scenarios Table */}
      {suggestions && suggestions.scenarios && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Grade Improvement Scenarios
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Scenario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Target Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Classes Needed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Predicted Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Letter Grade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {suggestions.scenarios.map((scenario: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {scenario.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {scenario.targetRate}%
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {scenario.classesNeeded}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {scenario.predictedGrade}%
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${getGradeColor(scenario.letterGrade)}`}>
                        {scenario.letterGrade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GradeCalculator;
