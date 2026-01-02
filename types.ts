
export enum ExperienceLevel {
  None = 'No experience',
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced'
}

export enum LearningGoal {
  Career = 'Start a career',
  JobImprovement = 'Improve job',
  Business = 'Grow business',
  Personal = 'Personal interest'
}

export enum LearningStyle {
  Text = 'Text',
  Visual = 'Visual',
  StepByStep = 'Step-by-step',
  Interactive = 'Interactive'
}

export interface SkillLevels {
  seo: number;
  analytics: number;
  socialMediaAds: number;
  contentCreation: number;
  cro: number;
  emailMarketing?: number;
  uxui?: number;
}

export interface PillarCompletion {
  pillarId: string;
  completedAt: string;
  score: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  passed: boolean;
  attemptDate: string;
}

export interface AIInteraction {
  id: string;
  userId: string;
  question: string;
  aiResponse: string;
  relatedPillar: string;
  timestamp: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  type: 'email' | 'sms' | 'push';
  triggerEvent: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'read';
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'email' | 'sms';
}

export interface CommunicationTrigger {
  id: string;
  templateId: string;
  condition: 'inactivity' | 'completion' | 'failure' | 'milestone';
  value: number; // days for inactivity, XP for milestone, etc.
  active: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  role: 'student' | 'admin';
  isLoggedIn: boolean;
  experienceLevel: ExperienceLevel;
  familiarAreas: string[];
  toolsUsed: string[];
  learningGoal: LearningGoal;
  primaryFocus: string;
  theoryPreference: string;
  skillLevels: SkillLevels;
  timePerWeek: string;
  learningStyle: LearningStyle;
  completedModules: string[]; // Topic IDs
  completedCurriculums: string[]; // Curriculum IDs
  finalExamsPassed: string[]; // Curriculum IDs that passed final exam
  lastAccessedTopicId?: string;
  lastAccessedCurriculumId?: string;
  pillarCompletions: PillarCompletion[];
  badges: string[];
  xp: number;
  streak: number;
  longestStreak: number;
  lastActive: string;
  dailyQuizDone: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum StepType {
  Info = 'info',
  Quiz = 'quiz',
  FillBlank = 'fill-blank'
}

export interface LessonStep {
  id: string;
  type: StepType;
  title?: string;
  content: string;
  question?: string;
  options?: string[];
  correctAnswer: string | number;
  codeSnippet?: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  pillar: string;
  articles: string[];
  quizSteps: LessonStep[];
  isLocked?: boolean;
}

export interface Curriculum {
  id: string;
  title: string;
  pillar: string;
  topics: Topic[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  thumbnail: string;
  description: string;
  isTrending?: boolean;
  order: number;
}

export interface ChatEntry {
  role: 'user' | 'bot';
  text: string;
  timestamp: number;
}

export type View = 'landing' | 'onboarding' | 'login' | 'dashboard' | 'curriculum' | 'ai-assistant' | 'profile' | 'course-player' | 'final-exam' | 'admin';
