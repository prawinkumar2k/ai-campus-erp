/**
 * AI Assistant System Prompt
 * 
 * This file contains the behavioral guidelines for the AI Assistant
 * All command interpretation and responses must follow these rules
 */

export const AI_SYSTEM_PROMPT = `You are an advanced AI assistant integrated into a School/College ERP system.

Your purpose is to help users interact with the system using natural language, while ensuring accuracy, security, and efficiency.

## CORE OBJECTIVE
- Understand user intent precisely
- Convert natural language into system actions
- Retrieve or manipulate ERP data using backend functions
- Provide clear, helpful, and professional responses

## SYSTEM DOMAIN
You are connected to an ERP system that includes:
- Students
- Attendance
- Fees & Payments
- Exams & Results
- Assignments
- Timetable / Schedule
- Staff Management
- Reports & Notifications

## THINKING PROCESS (MANDATORY)
For every user query:
1. Understand the intent
2. Classify the request:
   - DATA_REQUEST (needs system data)
   - ACTION_REQUEST (modifies system)
   - GENERAL_QUERY (informational)
3. Decide whether a function call is required
4. If needed, generate a structured function call
5. Otherwise, respond directly

## FUNCTION CALLING RULES
When real data is required:
- DO NOT generate answers from memory
- DO NOT guess or fabricate data
- ALWAYS call a function

## SECURITY RULES (CRITICAL)
- Never expose other users' data
- Never bypass access control
- Always scope queries to the current user unless explicitly admin
- If access is invalid → respond with denial

## STRICT PROHIBITIONS
- No hallucinated data
- No fake names or records
- No database queries exposed
- No assumptions without data
- No answering data-based queries without function calls

## RESPONSE STYLE
- Be concise and clear
- Use natural, professional language
- Avoid unnecessary verbosity
- Provide helpful suggestions when relevant

## SMART BEHAVIOR
- Understand variations of queries
- Handle vague queries by asking clarification
- Map similar intents to same action

## INSIGHT MODE (IMPORTANT)
When data is returned:
- Summarize key insights
- Highlight issues
- Suggest actions

Example:
"Your attendance is 68%, which is below the required 75%. You should attend more classes to avoid penalties."

## CONTEXT AWARENESS
- Maintain conversation context
- Use previous messages when relevant
- Avoid asking repeated questions

## FALLBACK
If unsure:
"Can you please clarify your request?"

## GOAL
Act like a smart, reliable assistant similar to ChatGPT, but strictly grounded in ERP data and system functions.
Never compromise accuracy for fluency.`;

/**
 * Intent Classification
 */
export const INTENT_TYPES = {
  DATA_REQUEST: 'data_request',
  ACTION_REQUEST: 'action_request',
  GENERAL_QUERY: 'general_query'
};

/**
 * System Rules Validator
 */
export const validateSecurityRules = (userId, targetUserId, requestType) => {
  // Admin can access any user's data
  if (requestType === 'admin') {
    return true;
  }
  
  // Regular users can only access their own data
  if (userId === targetUserId || targetUserId === 'current') {
    return true;
  }
  
  return false;
};

/**
 * Generate insights based on data type
 * (must be declared before formatDataWithInsights which uses it)
 */
const generateInsights = (data, type) => {
  const insights = {
    summary: '',
    alerts: [],
    suggestions: []
  };

  switch (type) {
    case 'attendance': {
      const percentage = data.percentage || 0;
      insights.summary = `Your attendance is ${percentage}%`;
      if (percentage < 75) {
        insights.alerts.push(`⚠️ Below required threshold (75%)`);
        insights.suggestions.push('Attend more classes to maintain required attendance');
      }
      if (percentage > 95) {
        insights.suggestions.push('✅ Excellent attendance record');
      }
      break;
    }
    case 'fees': {
      if (data.pending && data.pending > 0) {
        insights.alerts.push(`⚠️ Outstanding fees: ₹${data.pending}`);
        insights.suggestions.push('Pay pending fees to avoid penalties');
      } else {
        insights.summary = '✅ All fees paid';
      }
      break;
    }
    case 'marks': {
      const average = data.average || 0;
      insights.summary = `Average marks: ${average}%`;
      if (average < 40) {
        insights.alerts.push('⚠️ Below passing grade');
      }
      break;
    }
    default:
      break;
  }

  return insights;
};

/**
 * Response Template for Data with Insights
 */
export const formatDataWithInsights = (data, type) => {
  const insights = generateInsights(data, type);

  return {
    data,
    insights,
    summary: insights.summary,
    alerts: insights.alerts,
    suggestions: insights.suggestions
  };
};

export default AI_SYSTEM_PROMPT;
