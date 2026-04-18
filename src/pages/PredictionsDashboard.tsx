import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Brain,
  Target,
  Users,
  Activity,
  ArrowRight,
  CheckCircle,
  XCircle,
  Lightbulb,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

interface PredictionData {
  absentStudents: any[];
  bestDays: any;
  forecast: any;
  insights: any;
}

const PredictionsDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/api/predictions/all');
      const data = await response.json();

      if (data.success) {
        setPredictions(data.data);
      } else {
        console.error('Prediction error:', data.message);
        // Set empty predictions to show UI
        setPredictions({
          absentStudents: [],
          bestDays: { recommendations: [] },
          forecast: { trend: 'stable', predictions: [] },
          insights: { summary: 'No data available yet' }
        });
        toast.error('No prediction data available. Add more attendance records.');
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
      // Set empty predictions to show UI
      setPredictions({
        absentStudents: [],
        bestDays: { recommendations: [] },
        forecast: { trend: 'stable', predictions: [] },
        insights: { summary: 'No data available yet' }
      });
      toast.error('Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Analyzing attendance patterns with AI...
          </p>
        </div>
      </div>
    );
  }

  if (!predictions) {
    return <div>No predictions available</div>;
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Brain className="w-8 h-8" />
              <h1 className="text-2xl font-bold">AI Predictions & Insights</h1>
            </div>
            <p className="text-purple-100">
              Machine learning powered attendance analysis and forecasting
            </p>
          </div>
          <button
            onClick={loadPredictions}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">At-Risk Students</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {predictions.absentStudents.length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Forecast Trend</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {predictions.forecast.trend === 'increasing' ? '↗' : 
                 predictions.forecast.trend === 'decreasing' ? '↘' : '→'}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Best Day</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {predictions.bestDays.bestDays?.[0]?.day.substring(0, 3) || 'N/A'}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {predictions.forecast.confidence}
              </p>
            </div>
            <Target className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>
      </div>

      {/* AI Insights */}
      {predictions.insights.aiInsights && predictions.insights.aiInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                AI-Generated Insights
              </h3>
              <div className="space-y-2">
                {predictions.insights.aiInsights.map((insight: string, index: number) => (
                  <div key={index} className="flex items-start space-x-2">
                    <ArrowRight className="w-4 h-4 text-blue-500 mt-1" />
                    <p className="text-gray-700 dark:text-gray-300">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Forecast */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Attendance Trend Forecast
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={predictions.forecast.historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Next Week Forecast:</strong> {predictions.forecast.forecastedNextWeek} students
              {' '}({predictions.forecast.trendPercentage > 0 ? '+' : ''}
              {predictions.forecast.trendPercentage}%)
            </p>
          </div>
        </motion.div>

        {/* Best Days Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Best Days for Important Lectures
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={predictions.bestDays.allDays}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="percentage" fill="#10B981" name="Attendance %" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Recommendation:</strong> {predictions.bestDays.recommendation}
            </p>
          </div>
        </motion.div>
      </div>

      {/* At-Risk Students Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Students Predicted to be Absent ({predictions.absentStudents.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            AI-powered predictions based on attendance patterns
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Probability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recommendation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {predictions.absentStudents.map((student: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.studentName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {student.ienNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {student.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(student.riskLevel)}`}>
                      {student.riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <span className="font-semibold">{student.absentProbability}%</span>
                      {student.absentProbability > 80 ? (
                        <TrendingUp className="w-4 h-4 text-red-500 ml-2" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-yellow-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      student.trend === 'improving' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      student.trend === 'declining' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {student.trend}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {student.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default PredictionsDashboard;
