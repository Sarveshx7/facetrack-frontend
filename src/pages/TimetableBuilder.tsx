import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Save,
  AlertTriangle,
  BookOpen,
  MapPin,
  User,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { DEPARTMENTS, Department, CLASS_TYPE, ClassType } from '../config/api';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  subject?: string;
  faculty?: string;
  classroom?: string;
  type?: ClassType;
  department: Department;
  year: number;
  semester: number;
  section?: string;
}

interface TimetableEntry {
  id: string;
  day: string;
  timeSlots: TimeSlot[];
}

const TimetableBuilder: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<Department>('CE');
  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedSection, setSelectedSection] = useState('A');
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '09:15-10:15',
    '10:15-11:15',
    '11:30-12:30',
    '12:30-13:30',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00',
  ];

  const [formData, setFormData] = useState({
    subject: '',
    faculty: '',
    classroom: '',
    type: 'LECTURE' as ClassType,
  });

  // Sample subjects by department
  const subjectsByDepartment = {
    CE: ['Data Structures', 'Computer Networks', 'Database Systems', 'Software Engineering', 'Operating Systems'],
    CSD: ['Data Warehousing & Mining', 'Cloud Computing & Big Data', 'Artificial Intelligence & Machine Learning', 'Information & Network Security', 'Blockchain Technology', 'Industry 4.0 & Smart Manufacturing', 'Digital Image Processing', 'Natural Language Processing'],
    AIDS: ['Artificial Intelligence', 'Data Mining', 'Big Data Analytics', 'IoT', 'Robotics'],
    MECHATRONICS: ['Control Systems', 'Robotics', 'Automation', 'Sensors', 'Actuators'],
    CIVIL: ['Structural Engineering', 'Geotechnical', 'Transportation', 'Environmental', 'Construction'],
    IT: ['Web Development', 'Mobile Computing', 'Cloud Computing', 'Cybersecurity', 'DevOps'],
  };

  const faculties = [
    'Dr. S. N. Gupte', 'Dr. V. K. Pansare', 'Dr. S. D. Madhe', 'Prof. M. B. Patil',
    'Prof. S. P. Joshi', 'Dr. R. R. Manthalkar', 'Prof. A. A. Jadhav', 'Prof. S. R. Suralkar',
    'Dr. Mrs. S. R. Suryawanshi', 'Prof. V. A. Jagtap', 'Prof. S. P. Raut', 'Prof. N. B. Dhawale',
    'Dr. Mrs. V. A. Chakkarwar', 'Prof. S. A. Ladhake', 'Dr. R. A. Thakare', 'Dr. S. T. Ghuge',
    'Prof. S. R. Jadhav', 'Prof. M. S. Wagh', 'Prof. S. M. Sangale', 'Prof. V. M. Magar'
  ];

  const classrooms = [
    'Lab 1', 'Lab 2', 'Lab 3', 'Lab 4', 'Lab 5', 'Lab 6', 'Lab 7', 'Lab 8',
    'Lab 9', 'Lab 10', 'Lab 11', 'Lab 12', 'Lab 13', 'Lab 14', 'Lab 15', 'Lab 16',
    'Lab 17', 'Lab 18', 'Lab 19', 'Lab 20', 'Lab 21', 'Lab 22', 'Lab 23', 'Lab 24'
  ];

  useEffect(() => {
    loadTimetable();
  }, [selectedDepartment, selectedYear, selectedSemester, selectedSection]);

  const loadTimetable = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get<{ success: boolean; data: any[] }>(
        `/timetable/schedule/weekly?department=${encodeURIComponent(selectedDepartment)}` +
          `&year=${selectedYear}&semester=${selectedSemester}&section=${encodeURIComponent(selectedSection)}`
      );

      const slots = (response as any)?.data || [];

      const byDay = new Map<string, TimeSlot[]>();
      for (const day of days) byDay.set(day, []);

      for (const slot of slots) {
        const dayName = String(slot.dayOfWeek || '').toLowerCase();
        const normalizedDay = days.find(d => d.toLowerCase() === dayName) ||
          (dayName === 'monday' ? 'Monday' :
          dayName === 'tuesday' ? 'Tuesday' :
          dayName === 'wednesday' ? 'Wednesday' :
          dayName === 'thursday' ? 'Thursday' :
          dayName === 'friday' ? 'Friday' :
          dayName === 'saturday' ? 'Saturday' : '');

        if (!normalizedDay) continue;

        const startTime = String(slot.startTime || '').slice(0, 5);
        const endTime = String(slot.endTime || '').slice(0, 5);

        const uiSlot: TimeSlot = {
          id: String(slot.id),
          startTime,
          endTime,
          subject: `${slot.subjectCode} - ${slot.subjectName}`,
          faculty: slot.faculty || '',
          classroom: slot.classroom || '',
          type: (slot.type as ClassType) || 'LECTURE',
          department: selectedDepartment,
          year: selectedYear,
          semester: selectedSemester,
          section: selectedSection,
        };

        byDay.get(normalizedDay)?.push(uiSlot);
      }

      const nextTimetable: TimetableEntry[] = days.map(day => ({
        id: day,
        day,
        timeSlots: (byDay.get(day) || []).sort((a, b) => a.startTime.localeCompare(b.startTime)),
      }));

      setTimetable(nextTimetable);
      checkConflicts(nextTimetable);
    } catch (error) {
      toast.error('Failed to load timetable');
    } finally {
      setIsLoading(false);
    }
  };

  const checkConflicts = (currentTimetable: TimetableEntry[]) => {
    const conflictList: string[] = [];
    const usedFaculty = new Map<string, TimeSlot>();
    const usedClassrooms = new Map<string, TimeSlot>();

    currentTimetable.forEach(day => {
      day.timeSlots.forEach(slot => {
        const faculty = (slot.faculty || '').trim();
        const classroom = (slot.classroom || '').trim();

        // Check faculty conflicts (only if faculty provided)
        if (faculty) {
          const facultyKey = `${day.day}-${slot.startTime}-${faculty}`;
          if (usedFaculty.has(facultyKey)) {
            conflictList.push(`Faculty conflict: ${faculty} on ${day.day} at ${slot.startTime}`);
          }
          usedFaculty.set(facultyKey, slot);
        }

        // Check classroom conflicts (only if classroom provided)
        if (classroom) {
          const classroomKey = `${day.day}-${slot.startTime}-${classroom}`;
          if (usedClassrooms.has(classroomKey)) {
            conflictList.push(`Classroom conflict: ${classroom} on ${day.day} at ${slot.startTime}`);
          }
          usedClassrooms.set(classroomKey, slot);
        }
      });
    });

    setConflicts(conflictList);
  };

  const addTimeSlot = () => {
    if (!selectedDay || !selectedTimeSlot) {
      toast.error('Please select day and time slot');
      return;
    }

    const [startTime, endTime] = selectedTimeSlot.split('-');
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      startTime,
      endTime,
      subject: formData.subject,
      faculty: formData.faculty,
      classroom: formData.classroom,
      type: formData.type,
      department: selectedDepartment,
      year: selectedYear,
      semester: selectedSemester,
      section: selectedSection,
    };

    const updatedTimetable = timetable.map(day => {
      if (day.day === selectedDay) {
        // Check if slot already exists
        const existingSlot = day.timeSlots.find(slot => 
          slot.startTime === startTime && slot.endTime === endTime
        );
        
        if (existingSlot) {
          toast.error('Time slot already occupied');
          return day;
        }

        return {
          ...day,
          timeSlots: [...day.timeSlots, newSlot].sort((a, b) => 
            a.startTime.localeCompare(b.startTime)
          ),
        };
      }
      return day;
    });

    setTimetable(updatedTimetable);
    checkConflicts(updatedTimetable);
    setShowAddModal(false);
    resetForm();
    toast.success('Time slot added successfully');
  };

  const editTimeSlot = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setFormData({
      subject: slot.subject || '',
      faculty: slot.faculty || '',
      classroom: slot.classroom || '',
      type: slot.type || 'LECTURE',
    });
    setSelectedDay(timetable.find(day => 
      day.timeSlots.some(s => s.id === slot.id)
    )?.day || '');
    setSelectedTimeSlot(`${slot.startTime}-${slot.endTime}`);
    setShowAddModal(true);
  };

  const updateTimeSlot = () => {
    if (!editingSlot) return;

    const updatedTimetable = timetable.map(day => ({
      ...day,
      timeSlots: day.timeSlots.map(slot => 
        slot.id === editingSlot.id 
          ? { ...slot, ...formData }
          : slot
      ),
    }));

    setTimetable(updatedTimetable);
    checkConflicts(updatedTimetable);
    setShowAddModal(false);
    setEditingSlot(null);
    resetForm();
    toast.success('Time slot updated successfully');
    // Persist changes
    saveTimetable();
  };

  const deleteTimeSlot = (slotId: string) => {
    const numericId = Number(slotId);
    if (!Number.isNaN(numericId) && numericId > 0) {
      apiService.delete(`/timetable/${numericId}`).catch(() => {
        // Ignore delete error and continue with bulk overwrite
      });
    }

    const updatedTimetable = timetable.map(day => ({
      ...day,
      timeSlots: day.timeSlots.filter(slot => slot.id !== slotId),
    }));

    setTimetable(updatedTimetable);
    checkConflicts(updatedTimetable);
    toast.success('Time slot deleted successfully');
    // Persist changes
    saveTimetable();
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      faculty: '',
      classroom: '',
      type: 'LECTURE',
    });
    setSelectedDay('');
    setSelectedTimeSlot('');
    setEditingSlot(null);
  };

  const saveTimetable = async () => {
    try {
      setIsLoading(true);
      // Convert UI timetable to backend slots
      const payload = timetable.flatMap(day =>
        day.timeSlots.map(slot => {
          const [subjectCode, ...rest] = String(slot.subject || '').split(' - ');
          const subjectName = rest.join(' - ') || String(slot.subject || '');
          return {
            id: slot.id && !Number.isNaN(Number(slot.id)) ? Number(slot.id) : undefined,
            department: selectedDepartment,
            year: selectedYear,
            semester: selectedSemester,
            section: selectedSection,
            dayOfWeek: day.day.toUpperCase(),
            startTime: `${slot.startTime}:00`,
            endTime: `${slot.endTime}:00`,
            subjectCode: subjectCode || 'SUB',
            subjectName: subjectName || 'Subject',
            faculty: slot.faculty || null,
            classroom: slot.classroom || null,
            type: slot.type || 'LECTURE',
            batch: null,
          };
        })
      );

      await apiService.post('/timetable/bulk', payload);
      toast.success('Timetable saved successfully');
      await loadTimetable();
    } catch (error) {
      toast.error('Failed to save timetable');
    } finally {
      setIsLoading(false);
    }
  };

  const getClassTypeColor = (type: ClassType) => {
    switch (type) {
      case 'LECTURE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'PRACTICAL':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'TUTORIAL':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'SEMINAR':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'EXAM':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading timetable...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Timetable Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage class schedules with conflict detection
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>
          <button
            onClick={saveTimetable}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Timetable</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value as Department)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Object.values(DEPARTMENTS).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {[1, 2, 3, 4].map(year => (
                <option key={year} value={year}>Year {year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Division
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {['A', 'B', 'C'].map(sec => (
                <option key={sec} value={sec}>Division {sec}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="font-medium">Current Selection:</div>
              <div>{selectedDepartment} - Year {selectedYear}, Sem {selectedSemester}, Div {selectedSection}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h4 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Schedule Conflicts Detected
              </h4>
              <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                {conflicts.map((conflict, index) => (
                  <li key={index}>• {conflict}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Timetable Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                  Time
                </th>
                {days.map(day => (
                  <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {timeSlots.map(timeSlot => (
                <tr key={timeSlot} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {timeSlot}
                  </td>
                  {days.map(day => {
                    const dayEntry = timetable.find(d => d.day === day);
                    const [startTime] = timeSlot.split('-');
                    const slot = dayEntry?.timeSlots.find(s => s.startTime === startTime);
                    
                    return (
                      <td key={`${day}-${timeSlot}`} className="px-6 py-4 whitespace-nowrap">
                        {slot ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group"
                          >
                            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 hover:shadow-md transition-all duration-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                    {slot.subject}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    <div className="flex items-center space-x-1">
                                      <User className="w-3 h-3" />
                                      <span className="truncate">{slot.faculty}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 mt-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>{slot.classroom}</span>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClassTypeColor(slot.type!)}`}>
                                      {slot.type}
                                    </span>
                                  </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
                                  <div className="flex flex-col space-y-1">
                                    <button
                                      onClick={() => editTimeSlot(slot)}
                                      className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => deleteTimeSlot(slot.id)}
                                      className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-400 hover:border-primary-300 dark:hover:border-primary-600 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedDay(day);
                              setSelectedTimeSlot(timeSlot);
                              setShowAddModal(true);
                            }}
                          >
                            <Plus className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingSlot ? 'Edit Class' : 'Add New Class'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Day
                    </label>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Day</option>
                      {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Slot
                    </label>
                    <select
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Time</option>
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Subject</option>
                    {subjectsByDepartment[selectedDepartment].map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Faculty
                  </label>
                  <select
                    value={formData.faculty}
                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Faculty</option>
                    {faculties.map(faculty => (
                      <option key={faculty} value={faculty}>{faculty}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Classroom
                    </label>
                    <select
                      value={formData.classroom}
                      onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Room</option>
                      {classrooms.map(room => (
                        <option key={room} value={room}>{room}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as ClassType })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {Object.values(CLASS_TYPE).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingSlot ? updateTimeSlot : addTimeSlot}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  {editingSlot ? 'Update Class' : 'Add Class'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimetableBuilder;
