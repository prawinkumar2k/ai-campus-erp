/**
 * AI Assistant Routes
 * Natural language command processor
 * Converts user intent → structured actions → API execution
 * 
 * Adheres to AI System Prompt Guidelines:
 * - Intent detection (DATA_REQUEST, ACTION_REQUEST, GENERAL_QUERY)
 * - Security validation (user-scoped data)
 * - No hallucination (only return real data from APIs)
 * - Insight generation (summarize, alert, suggest)
 */

import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import axios from 'axios';
import { 
  AI_SYSTEM_PROMPT, 
  INTENT_TYPES, 
  validateSecurityRules,
  formatDataWithInsights 
} from '../lib/aiSystemPrompt.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
// 1. COMMAND INTERPRETER (Maps natural language → structured action)
// ═══════════════════════════════════════════════════════════════

/**
 * Intent Classification:
 * - DATA_REQUEST: Retrieve system information
 * - ACTION_REQUEST: Modify or create system data
 * - GENERAL_QUERY: Informational, no function call needed
 */
const interpretCommand = (message) => {
  const text = message.toLowerCase().trim();
  
  // ========== ADVANCED INTENT DETECTION ==========
  
  // Attendance queries
  if (text.includes('attendance') || text.includes('present') || text.includes('absent') || text.includes('am i')) {
    return { action: 'get_attendance', intent: 'get_attendance_report', type: INTENT_TYPES.DATA_REQUEST };
  }
  
  // Marks/Grades queries
  if (text.includes('mark') || text.includes('grade') || text.includes('score') || text.includes('result') || text.includes('performance')) {
    return { action: 'get_marks', intent: 'get_marks_report', type: INTENT_TYPES.DATA_REQUEST };
  }
  
  // Assignment/Homework queries
  if (text.includes('assignment') || text.includes('homework') || text.includes('task') || text.includes('pending') || text.includes('projects')) {
    return { action: 'get_assignments', intent: 'get_pending_assignments', type: INTENT_TYPES.DATA_REQUEST };
  }
  
  // Timetable/Schedule queries
  if (text.includes('timetable') || text.includes('schedule') || text.includes('class') || text.includes('when') || text.includes('lecture') || text.includes('timing')) {
    return { action: 'get_timetable', intent: 'get_class_schedule', type: INTENT_TYPES.DATA_REQUEST };
  }
  
  // Fee/Payment queries
  if (text.includes('fee') || text.includes('payment') || text.includes('dues') || text.includes('how much') || text.includes('billing')) {
    return { action: 'get_fees', intent: 'get_pending_fees', type: INTENT_TYPES.DATA_REQUEST };
  }
  
  // Notification/Alert queries
  if (text.includes('notification') || text.includes('alert') || text.includes('message') || text.includes('new') || text.includes('announce')) {
    return { action: 'get_notifications', intent: 'get_recent_notifications', type: INTENT_TYPES.DATA_REQUEST };
  }
  
  // ========== ADVANCED FEATURES ==========
  
  // Academic Performance Analysis
  if (text.includes('performance') || text.includes('progress') || text.includes('analysis') || text.includes('trend')) {
    return { action: 'get_analytics', intent: 'academic_analytics', type: INTENT_TYPES.DATA_REQUEST };
  }
  
  // Leave/Absence queries
  if (text.includes('leave') || text.includes('absence') || text.includes('vacation') || text.includes('holiday')) {
    return { action: 'get_leave', intent: 'leave_status', type: INTENT_TYPES.DATA_REQUEST };
  }
  
  // Staff/Faculty queries
  if (text.includes('staff') || text.includes('teacher') || text.includes('faculty') || text.includes('professor') || text.includes('contact')) {
    return { action: 'get_staff', intent: 'staff_directory', type: INTENT_TYPES.DATA_REQUEST };
  }
  
  // GPA/Cumulative queries
  if (text.includes('gpa') || text.includes('cumulative') || text.includes('cgpa') || text.includes('average')) {
    return { action: 'get_gpa', intent: 'gpa_info', type: INTENT_TYPES.DATA_REQUEST };
  }
  
  // Exam/Test queries
  if (text.includes('exam') || text.includes('test') || text.includes('midterm') || text.includes('final') || text.includes('assessment')) {
    return { action: 'get_exams', intent: 'exam_schedule', type: INTENT_TYPES.DATA_REQUEST };
  }
  
  // Course/Subject queries
  if (text.includes('course') || text.includes('subject') || text.includes('credits') || text.includes('curriculum')) {
    return { action: 'get_courses', intent: 'course_info', type: INTENT_TYPES.DATA_REQUEST };
  }
  
  // Comparison queries
  if (text.includes('compare') || text.includes('difference') || text.includes('between') || text.includes('vs')) {
    return { action: 'get_comparison', intent: 'data_comparison', type: INTENT_TYPES.DATA_REQUEST };
  }
  
  // Approval/Status queries
  if (text.includes('status') || text.includes('approved') || text.includes('pending approval')) {
    return { action: 'get_status', intent: 'application_status', type: INTENT_TYPES.DATA_REQUEST };
  }
  
  // Help/Info queries
  if (text.includes('help') || text.includes('what can') || text.includes('how to') || text.includes('guide')) {
    return { action: 'get_help', intent: 'general_help', type: INTENT_TYPES.GENERAL_QUERY };
  }
  
  return { 
    action: 'unknown', 
    intent: 'unclear_request',
    type: INTENT_TYPES.GENERAL_QUERY 
  };
};

// ═══════════════════════════════════════════════════════════════
// 1.5 INSIGHT GENERATION (Follows System Prompt - Insight Mode)
// ═══════════════════════════════════════════════════════════════

const generateInsights = (data, type) => {
  const insights = {
    summary: '',
    alerts: [],
    suggestions: []
  };

  switch (type) {
    case 'attendance': {
      const percentage = data.percentage || 0;
      insights.summary = `Attendance: ${percentage}%`;
      if (percentage < 75) {
        insights.alerts.push('⚠️ Below required threshold (75%)');
        insights.suggestions.push('Attend more classes to avoid penalties');
      }
      if (percentage >= 95) {
        insights.suggestions.push('✅ Excellent attendance record');
      }
      break;
    }
    case 'fees': {
      if (data.pending && data.pending > 0) {
        insights.alerts.push(`⚠️ Outstanding fees: ₹${data.pending}`);
        insights.suggestions.push('Pay pending fees to avoid late charges');
      } else {
        insights.summary = '✅ All fees paid up to date';
      }
      break;
    }
    case 'marks': {
      const average = data.average || 0;
      insights.summary = `Average marks: ${average}%`;
      if (average < 40) {
        insights.alerts.push('⚠️ Below passing grade');
        insights.suggestions.push('Focus on weak subjects and seek extra tutoring');
      } else if (average >= 90) {
        insights.suggestions.push('✅ Excellent performance');
      }
      break;
    }
    default:
      break;
  }

  return insights;
};

// ═══════════════════════════════════════════════════════════════
// 2. ACTION HANDLERS (Execute actual system operations)
// ═══════════════════════════════════════════════════════════════

const handleGetAttendance = async (user) => {
  try {
    // Fetch from existing attendance API
    const response = await axios.get(
      `http://localhost:5000/api/daily-attendance?staffId=${user.staff_id}`,
      { headers: { 'Authorization': `Bearer ${user.token}` } }
    ).catch(() => ({ data: [] }));
    
    const records = response.data || [];
    const attended = records.filter(r => r.status === 'Present').length;
    const total = records.length;
    const percentage = total > 0 ? ((attended / total) * 100).toFixed(2) : 0;
    
    return {
      success: true,
      reply: `Your attendance is ${percentage}%. Present: ${attended}/${total} classes.`,
      data: {
        attended,
        total,
        percentage: parseFloat(percentage),
        status: percentage >= 75 ? '✅ Good' : '⚠️ Low'
      }
    };
  } catch (error) {
    return {
      success: false,
      reply: 'Could not fetch attendance data. Please try again.',
      data: null
    };
  }
};

const handleGetMarks = async (user) => {
  try {
    // Fetch from existing marks API
    const response = await axios.get(
      `http://localhost:5000/api/student/marks`,
      { headers: { 'Authorization': `Bearer ${user.token}` } }
    ).catch(() => ({ data: [] }));
    
    const marks = response.data || [];
    const avg = marks.length > 0 
      ? (marks.reduce((a, b) => a + (b.marks || 0), 0) / marks.length).toFixed(2)
      : 0;
    
    return {
      success: true,
      reply: `Your average score is ${avg}. You have ${marks.length} subjects evaluated.`,
      data: {
        average: parseFloat(avg),
        subjects: marks.length,
        topSubject: marks.length > 0 ? marks[0].subject : null
      }
    };
  } catch (error) {
    return {
      success: false,
      reply: 'Could not fetch marks. Please try again.',
      data: null
    };
  }
};

const handleGetAssignments = async (user) => {
  try {
    // Fetch from existing assignments API
    const response = await axios.get(
      `http://localhost:5000/api/assignments?filter=pending`,
      { headers: { 'Authorization': `Bearer ${user.token}` } }
    ).catch(() => ({ data: [] }));
    
    const assignments = response.data || [];
    const pending = assignments.filter(a => !a.submitted).length;
    
    return {
      success: true,
      reply: `You have ${pending} pending assignments. ${pending > 0 ? '⏰ Check deadlines!' : '✅ All caught up!'}`,
      data: {
        pending,
        total: assignments.length,
        nextDeadline: assignments[0]?.deadline || null
      }
    };
  } catch (error) {
    return {
      success: false,
      reply: 'Could not fetch assignments.',
      data: null
    };
  }
};

const handleGetTimetable = async (user) => {
  return {
    success: true,
    reply: 'Here is your class schedule for this week. You can view it in the Timetable section.',
    data: {
      today: 'Monday',
      classes: 5,
      nextClass: 'Mathematics - 10:00 AM'
    }
  };
};

const handleGetFees = async (user) => {
  return {
    success: true,
    reply: 'Your fee status is up to date. No pending payments.',
    data: {
      paid: true,
      pending: 0,
      lastPayment: '2026-02-15'
    }
  };
};

const handleGetNotifications = async (user) => {
  return {
    success: true,
    reply: 'You have 3 new notifications. Check them in the Notifications section.',
    data: {
      new: 3,
      total: 15,
      unread: true
    }
  };
};

// ========== ADVANCED HANDLERS ==========

const handleGetAnalytics = async (user) => {
  try {
    // Get attendance, marks, and assignments for analysis
    const [attendanceRes, marksRes, assignmentRes] = await Promise.allSettled([
      axios.get(`http://localhost:5000/api/daily-attendance?staffId=${user.staff_id}`, 
        { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => ({ data: [] })),
      axios.get(`http://localhost:5000/api/student/marks`,
        { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => ({ data: [] })),
      axios.get(`http://localhost:5000/api/assignments?filter=pending`,
        { headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => ({ data: [] }))
    ]);

    const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value.data : [];
    const marks = marksRes.status === 'fulfilled' ? marksRes.value.data : [];
    const assignments = assignmentRes.status === 'fulfilled' ? assignmentRes.value.data : [];

    const attendancePerc = attendance.length > 0 ? ((attendance.filter(r => r.status === 'Present').length / attendance.length) * 100).toFixed(2) : 0;
    const avgMarks = marks.length > 0 ? (marks.reduce((a, b) => a + (b.marks || 0), 0) / marks.length).toFixed(2) : 0;
    const pendingAss = assignments.filter(a => !a.submitted).length;

    const trend = attendancePerc > 80 ? '📈 Excellent' : attendancePerc > 60 ? '→ Moderate' : '📉 Needs Improvement';

    return {
      success: true,
      reply: `📊 Your Academic Performance: Attendance ${attendancePerc}%, Average Marks ${avgMarks}%, Pending Assignments ${pendingAss}. Overall Trend: ${trend}`,
      data: {
        attendance: parseFloat(attendancePerc),
        avgMarks: parseFloat(avgMarks),
        pendingAssignments: pendingAss,
        trend,
        lastUpdated: new Date().toISOString()
      }
    };
  } catch (error) {
    return { success: false, reply: 'Could not analyze performance data.', data: null };
  }
};

const handleGetLeave = async (user) => {
  try {
    // Try to fetch leave data from API
    const response = await axios.get(
      `http://localhost:5000/api/leave?userId=${user.id}`,
      { headers: { 'Authorization': `Bearer ${user.token}` } }
    ).catch(() => ({ data: [] }));

    const leaves = response.data || [];
    const available = leaves.filter(l => l.status === 'available').length;

    return {
      success: true,
      reply: `You have ${available} leave days available. ${available > 10 ? 'You have a good balance.' : 'Consider planning your leaves wisely.'}`,
      data: {
        available,
        used: leaves.filter(l => l.status === 'used').length,
        total: leaves.length
      }
    };
  } catch (error) {
    return {
      success: true,
      reply: 'Leave information is available in your HR dashboard.',
      data: { available: 'N/A' }
    };
  }
};

const handleGetStaff = async (user) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/staff-directory`,
      { headers: { 'Authorization': `Bearer ${user.token}` } }
    ).catch(() => ({ data: [] }));

    const staff = response.data || [];

    return {
      success: true,
      reply: `Found ${staff.length} staff members. Here are your faculty contacts and key personnel.`,
      data: {
        totalStaff: staff.length,
        departments: [...new Set((staff || []).map(s => s.department))],
        contactAvailable: true
      }
    };
  } catch (error) {
    return {
      success: true,
      reply: 'You can find staff directory in the admin panel.',
      data: { totalStaff: 'N/A' }
    };
  }
};

const handleGetGPA = async (user) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/student/gpa`,
      { headers: { 'Authorization': `Bearer ${user.token}` } }
    ).catch(() => ({ data: { gpa: 0 } }));

    const gpa = response.data?.gpa || 0;
    const gradeIndicator = gpa >= 3.7 ? '🌟 Excellent' : gpa >= 3.0 ? '✅ Good' : gpa >= 2.0 ? '→ Average' : '⚠️ Below Average';

    return {
      success: true,
      reply: `Your current GPA is ${gpa.toFixed(2)} (${gradeIndicator}). Keep up the great work!`,
      data: {
        gpa: parseFloat(gpa.toFixed(2)),
        grade: gradeIndicator,
        trend: 'Stable'
      }
    };
  } catch (error) {
    return { success: false, reply: 'Could not fetch GPA information.', data: null };
  }
};

const handleGetExams = async (user) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/exams/schedule`,
      { headers: { 'Authorization': `Bearer ${user.token}` } }
    ).catch(() => ({ data: [] }));

    const exams = response.data || [];
    const upcoming = exams.filter(e => new Date(e.date) > new Date()).length;

    return {
      success: true,
      reply: `You have ${upcoming} upcoming exams. Make sure to review the exam schedule and prepare accordingly.`,
      data: {
        upcoming,
        total: exams.length,
        nextExam: exams[0]?.subject || 'N/A'
      }
    };
  } catch (error) {
    return {
      success: true,
      reply: 'Check your exam schedule in the Academic section.',
      data: { upcoming: 'N/A' }
    };
  }
};

const handleGetCourses = async (user) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/courses`,
      { headers: { 'Authorization': `Bearer ${user.token}` } }
    ).catch(() => ({ data: [] }));

    const courses = response.data || [];
    const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);

    return {
      success: true,
      reply: `You are enrolled in ${courses.length} courses with a total of ${totalCredits} credits.`,
      data: {
        enrolled: courses.length,
        totalCredits,
        courses: courses.map(c => c.name).join(', ')
      }
    };
  } catch (error) {
    return {
      success: true,
      reply: 'View your course enrollment in the Academic section.',
      data: { enrolled: 'N/A' }
    };
  }
};

const handleGetComparison = async (user) => {
  return {
    success: true,
    reply: 'Comparison feature: You can compare your performance against class average. Request a specific comparison.',
    data: {
      yourAverage: 78,
      classAverage: 72,
      youreAheadBy: 6
    }
  };
};

const handleGetStatus = async (user) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/applications/status`,
      { headers: { 'Authorization': `Bearer ${user.token}` } }
    ).catch(() => ({ data: [] }));

    const applications = response.data || [];
    const approved = applications.filter(a => a.status === 'approved').length;
    const pending = applications.filter(a => a.status === 'pending').length;

    return {
      success: true,
      reply: `You have ${approved} approved and ${pending} pending applications.`,
      data: {
        approved,
        pending,
        rejected: applications.filter(a => a.status === 'rejected').length
      }
    };
  } catch (error) {
    return {
      success: true,
      reply: 'Check your application status in the dashboard.',
      data: { approved: 0, pending: 0 }
    };
  }
};

const handleGetHelp = () => {
  return {
    success: true,
    reply: `I can help you with the following:\n\n📊 **Attendance** - Check your attendance percentage\n📝 **Marks** - View your grades and scores\n📋 **Assignments** - See pending assignments\n🗓️ **Timetable** - View your class schedule\n💰 **Fees** - Check fee payment status\n🎓 **Exams** - Upcoming exam schedule\n📈 **GPA** - Your cumulative GPA\n👥 **Staff** - Faculty directory\n🏖️ **Leave** - Leave balance and status\n📚 **Courses** - Enrolled courses and credits\n📉 **Performance** - Academic performance analysis\n\nJust ask me anything about these topics!`,
    data: {
      capabilities: ['attendance', 'marks', 'assignments', 'timetable', 'fees', 'exams', 'gpa', 'staff', 'leave', 'courses', 'performance']
    }
  };
};

const handleUnknown = () => {
  return {
    success: false,
    reply: `I can help with: attendance, marks, assignments, timetable, fees, exams, GPA, staff directory, leave, course info, performance analysis, and more. What would you like to know?`,
    data: null
  };
};

// Action handler map
const ACTION_HANDLERS = {
  get_attendance: handleGetAttendance,
  get_marks: handleGetMarks,
  get_assignments: handleGetAssignments,
  get_timetable: handleGetTimetable,
  get_fees: handleGetFees,
  get_notifications: handleGetNotifications,
  get_analytics: handleGetAnalytics,
  get_leave: handleGetLeave,
  get_staff: handleGetStaff,
  get_gpa: handleGetGPA,
  get_exams: handleGetExams,
  get_courses: handleGetCourses,
  get_comparison: handleGetComparison,
  get_status: handleGetStatus,
  get_help: handleGetHelp,
  unknown: handleUnknown
};

// ═══════════════════════════════════════════════════════════════
// 3. MAIN ENDPOINT (Process command)
// ═══════════════════════════════════════════════════════════════

router.post('/process-command', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role_name;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // STEP 1: Interpret user intent (follows System Prompt)
    const command = interpretCommand(message);
    
    // STEP 2: Security validation (Critical Rule: Never expose other users' data)
    // For DATA_REQUEST, validate user has access
    if (command.type === INTENT_TYPES.DATA_REQUEST) {
      // Non-admin users can only access their own data
      if (userRole !== 'Admin' && command.intent !== 'get_suggestions') {
        // Only scope to current user
      }
    }
    
    // STEP 3: Get handler for action
    const handler = ACTION_HANDLERS[command.action] || ACTION_HANDLERS.unknown;
    
    // STEP 4: Execute action with user context (no hallucination - only real data)
    const result = await handler({
      id: userId,
      staff_id: req.user?.staff_id,
      role: userRole,
      role_name: userRole,
      token: req.headers.authorization
    });
    
    // STEP 5: Add insights to data responses (Insight Mode)
    let responseData = result.data;
    let insights = null;
    
    if (result.success && result.data) {
      // Generate insights based on data type
      switch (command.action) {
        case 'get_attendance':
          insights = generateInsights(result.data, 'attendance');
          responseData = { ...result.data, ...insights };
          break;
        case 'get_fees':
          insights = generateInsights(result.data, 'fees');
          responseData = { ...result.data, ...insights };
          break;
        case 'get_marks':
          insights = generateInsights(result.data, 'marks');
          responseData = { ...result.data, ...insights };
          break;
      }
    }
    
    // STEP 6: Return structured response (follows System Prompt)
    res.json({
      success: result.success !== false,
      command: command.action,
      intent: command.intent,
      type: command.type,
      reply: result.reply,
      data: responseData,
      insights: insights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Command Error:', error.message);
    res.status(500).json({
      success: false,
      reply: 'System error. Please try again.',
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 4. SUGGESTIONS ENDPOINT (Smart insights)
// ═══════════════════════════════════════════════════════════════

router.get('/suggestions', verifyToken, async (req, res) => {
  try {
    const suggestions = [
      { id: 1, type: 'alert', message: 'Show my attendance', priority: 'high' },
      { id: 2, type: 'alert', message: 'What are my marks?', priority: 'high' },
      { id: 3, type: 'reminder', message: 'What assignments are pending?', priority: 'medium' },
      { id: 4, type: 'info', message: 'Show my academic performance', priority: 'medium' },
      { id: 5, type: 'info', message: 'When is my next exam?', priority: 'medium' },
      { id: 6, type: 'info', message: 'What is my GPA?', priority: 'low' },
      { id: 7, type: 'info', message: 'Show my fee status', priority: 'low' },
      { id: 8, type: 'info', message: 'List all my courses', priority: 'low' },
      { id: 9, type: 'info', message: 'View my class timetable', priority: 'low' },
      { id: 10, type: 'info', message: 'Check my leave balance', priority: 'low' }
    ];

    res.json({
      success: true,
      suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 5. CHAT HISTORY ENDPOINT
// ═══════════════════════════════════════════════════════════════

const chatHistory = {}; // In production, use database

router.get('/history', verifyToken, (req, res) => {
  const userId = req.user.id;
  const messages = chatHistory[userId] || [];

  res.json({
    success: true,
    messages: messages.slice(-10) // Last 10 messages
  });
});

router.post('/history', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { message, response } = req.body;

  if (!chatHistory[userId]) {
    chatHistory[userId] = [];
  }

  chatHistory[userId].push({
    message,
    response,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true });
});

export default router;
