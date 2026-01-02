
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, BookOpen, MessageSquare, User, TrendingUp, 
  Award, LogOut, Search, Play, CheckCircle,
  Zap, Menu, X, ChevronRight, Star,
  Trophy, Sparkles, Check, Send, Bot, RefreshCcw, Info, Lightbulb, Map, Lock,
  Newspaper, GraduationCap, Download, Shield, Eye, Settings, Users, BarChart, Activity,
  FileText, ArrowLeft, ArrowRight, RotateCcw, PlusCircle, Edit3, Save, Camera, Clock,
  Filter, Mail, Smartphone, Bell, Trash2, ChevronDown, ExternalLink, MailQuestion, ShieldAlert,
  Medal, GraduationCap as CertIcon
} from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { 
  UserProfile, View, ExperienceLevel, LearningGoal, LearningStyle, 
  Topic, Curriculum, StepType, ChatEntry, QuizAttempt
} from './types';
import { PILLARS, MOCK_CURRICULUMS, MARKET_NEWS, MOCK_USERS } from './constants';
import { geminiService, ChatMessage } from './services/gemini';

// --- Production Utilities ---
const calculateLevel = (xp: number) => Math.floor(xp / 1000) + 1;

const checkStreak = (profile: UserProfile): UserProfile => {
  const lastActive = new Date(profile.lastActive);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));
  
  let newStreak = profile.streak;
  if (diffInDays === 1) {
    newStreak += 1;
  } else if (diffInDays > 1) {
    newStreak = 1;
  }

  return {
    ...profile,
    streak: newStreak,
    longestStreak: Math.max(newStreak, profile.longestStreak),
    lastActive: now.toISOString()
  };
};

// --- Responsive UI Components ---

const Badge: React.FC<{ name: string; earned: boolean; isCertificate?: boolean }> = ({ name, earned, isCertificate }) => (
  <div className={`flex flex-col items-center p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 transition-all duration-500 relative group ${
    earned 
    ? 'border-indigo-500 bg-white text-indigo-700 scale-105 shadow-xl shadow-indigo-100' 
    : 'border-slate-100 bg-white/50 text-slate-200'
  }`}>
    {earned && isCertificate && (
      <div className="absolute inset-0 bg-indigo-400/5 rounded-[2.5rem] animate-pulse pointer-events-none" />
    )}
    <div className={`p-2 sm:p-4 rounded-2xl sm:rounded-3xl mb-2 sm:mb-3 ${earned ? 'bg-indigo-50 shadow-inner' : 'bg-transparent'}`}>
      {isCertificate ? <Medal className={`${earned ? 'text-amber-500' : 'text-slate-200'} w-8 h-8 sm:w-10 sm:h-10`} /> : <Award className={`${earned ? 'text-indigo-600' : 'text-slate-200'} w-8 h-8 sm:w-10 sm:h-10`} />}
    </div>
    <span className="text-[7px] sm:text-[9px] font-black text-center uppercase tracking-widest leading-tight px-1">{name}</span>
    {earned && <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-lg border-2 border-white"><Check size={8} strokeWidth={4} /></div>}
  </div>
);

const ProgressBar: React.FC<{ progress: number, color?: string }> = ({ progress, color = "bg-indigo-600" }) => (
  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
    <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${progress}%` }} />
  </div>
);

// --- Core Application Logic ---

const App: React.FC = () => {
  const [profile, setProfile] = useLocalStorage<UserProfile | null>('academy_profile', null);
  const [allUsers, setAllUsers] = useLocalStorage<UserProfile[]>('academy_all_users', MOCK_USERS);
  const [currentView, setCurrentView] = useState<View>('landing');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeCurriculum, setActiveCurriculum] = useState<Curriculum | null>(null);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>('all');
  const [chatHistory, setChatHistory] = useLocalStorage<ChatEntry[]>('academy_chat_history', []);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      setAllUsers(prev => {
        const idx = prev.findIndex(u => u.id === profile.id);
        const updatedUser = { ...profile, updatedAt: new Date().toISOString() };
        if (idx !== -1) {
          const newUsers = [...prev];
          newUsers[idx] = updatedUser;
          return newUsers;
        }
        return [...prev, updatedUser];
      });
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.isLoggedIn) {
      const validated = checkStreak(profile);
      if (validated.streak !== profile.streak) setProfile(validated);
      if (['landing', 'onboarding', 'login'].includes(currentView)) setCurrentView('dashboard');
    } else if (!['onboarding', 'login'].includes(currentView)) {
      setCurrentView('landing');
    }
  }, [profile?.isLoggedIn]);

  const handleLogout = () => {
    if (profile) {
      setProfile({ ...profile, isLoggedIn: false });
      setCurrentView('landing');
    }
  };

  const getProgress = (curr: Curriculum) => {
    if (!profile) return 0;
    const completed = curr.topics.filter(t => profile.completedModules.includes(t.id)).length;
    return (completed / curr.topics.length) * 100;
  };

  const isTopicUnlocked = (topic: Topic, curriculum: Curriculum) => {
    const topicIdx = curriculum.topics.findIndex(t => t.id === topic.id);
    if (topicIdx === 0) return true;
    const prevTopic = curriculum.topics[topicIdx - 1];
    return profile?.completedModules.includes(prevTopic.id);
  };

  const filteredCurriculums = useMemo(() => {
    if (selectedPillarFilter === 'all') return MOCK_CURRICULUMS;
    return MOCK_CURRICULUMS.filter(c => c.pillar === selectedPillarFilter);
  }, [selectedPillarFilter]);

  // --- View Routers ---
  if (currentView === 'landing') return <LandingPage onNavigate={setCurrentView} />;
  if (currentView === 'onboarding') return <Onboarding setProfile={setProfile} onNavigate={setCurrentView} />;
  if (currentView === 'login') return <LoginPage allUsers={allUsers} setProfile={setProfile} onNavigate={setCurrentView} />;
  if (currentView === 'course-player' && activeTopic && activeCurriculum) {
    return (
      <CoursePlayer 
        topic={activeTopic} 
        curriculum={activeCurriculum} 
        profile={profile} 
        setProfile={setProfile} 
        onNavigate={setCurrentView}
        setActiveTopic={setActiveTopic}
      />
    );
  }
  if (currentView === 'final-exam' && activeCurriculum) {
    return <FinalExam curriculum={activeCurriculum} profile={profile} setProfile={setProfile} onNavigate={setCurrentView} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-x-hidden">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        profile={profile} 
        handleLogout={handleLogout} 
      />
      <div className="flex-1 md:ml-80 transition-all w-full max-w-full min-h-screen flex flex-col">
        {/* Mobile Navbar */}
        <header className="flex md:hidden sticky top-0 z-[40] items-center justify-between p-4 bg-white/80 backdrop-blur-xl border-b border-slate-100">
          <div className="flex items-center gap-3 text-indigo-600" onClick={() => setCurrentView('dashboard')}>
            <Zap size={24} fill="currentColor" />
            <h1 className="font-black text-lg uppercase tracking-tighter">MarketerAI</h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="p-2 text-slate-900 bg-slate-50 rounded-xl active:scale-95 transition-transform"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 p-4 sm:p-8 lg:p-12 xl:p-20 max-w-7xl mx-auto w-full">
          {currentView === 'dashboard' && (
            <Dashboard 
              profile={profile} 
              getProgress={getProgress} 
              allUsers={allUsers} 
              setActiveCurriculum={setActiveCurriculum} 
              setActiveTopic={setActiveTopic} 
              onNavigate={setCurrentView} 
            />
          )}
          {currentView === 'curriculum' && (
            <CurriculumView 
              selectedPillarFilter={selectedPillarFilter}
              setSelectedPillarFilter={setSelectedPillarFilter}
              filteredCurriculums={filteredCurriculums}
              getProgress={getProgress}
              profile={profile}
              isTopicUnlocked={isTopicUnlocked}
              setActiveCurriculum={setActiveCurriculum}
              setActiveTopic={setActiveTopic}
              onNavigate={setCurrentView}
            />
          )}
          {currentView === 'profile' && <ProfileView profile={profile} getProgress={getProgress} />}
          {currentView === 'admin' && <AdminHub allUsers={allUsers} />}
          {currentView === 'ai-assistant' && (
            <AIAssistantView 
              profile={profile} 
              chatHistory={chatHistory} 
              setChatHistory={setChatHistory} 
              chatLoading={chatLoading} 
              setChatLoading={setChatLoading} 
              chatInput={chatInput} 
              setChatInput={setChatInput} 
              chatEndRef={chatEndRef} 
              activeTopic={activeTopic} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

const LandingPage = ({ onNavigate }: any) => (
  <div className="min-h-screen bg-white flex items-center justify-center p-6 overflow-hidden relative">
    <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
      <Zap size={1000} className="text-indigo-600 fixed -bottom-40 -left-40 rotate-12" />
    </div>
    <div className="max-w-4xl w-full text-center space-y-10 sm:space-y-16 animate-in zoom-in-95 duration-1000 relative z-10">
      <div className="inline-flex items-center gap-3 sm:gap-4 text-indigo-600 px-6 py-3 sm:px-10 sm:py-5 bg-white rounded-full border border-indigo-50 shadow-lg">
        <Zap className="w-6 h-6 sm:w-10 sm:h-10" fill="currentColor" />
        <h1 className="font-black text-xl sm:text-4xl uppercase tracking-tighter">MarketerAI</h1>
      </div>
      <div className="space-y-6">
        <h2 className="text-4xl sm:text-7xl lg:text-8xl xl:text-[9rem] font-black text-slate-900 tracking-tighter leading-[0.9] sm:leading-[0.8] mb-4 text-balance">MASTER THE <br/> <span className="text-indigo-600">MARKET</span> ARCHIVE.</h2>
        <p className="text-base sm:text-xl lg:text-2xl text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed px-4 text-balance">Advanced growth engineering for the AI search era.</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-6 px-4">
        <button onClick={() => onNavigate('onboarding')} className="w-full sm:w-auto px-10 sm:px-16 py-5 sm:py-8 bg-indigo-600 text-white rounded-full font-black uppercase tracking-widest text-xs sm:text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">Initialize Profile <ArrowRight size={18} /></button>
        <button onClick={() => onNavigate('login')} className="w-full sm:w-auto px-10 sm:px-16 py-5 sm:py-8 bg-white text-slate-900 rounded-full border border-slate-200 font-black uppercase tracking-widest text-xs sm:text-sm hover:border-indigo-600 transition-all active:scale-95">Existing Access</button>
      </div>
    </div>
  </div>
);

const Onboarding = ({ setProfile, onNavigate }: any) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState(ExperienceLevel.None);
  const [goal, setGoal] = useState(LearningGoal.Personal);

  const handleFinish = () => {
    const newUser: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      name, email,
      role: email.toLowerCase().includes('admin') ? 'admin' : 'student',
      isLoggedIn: true,
      experienceLevel: level,
      familiarAreas: [],
      toolsUsed: [],
      learningGoal: goal,
      primaryFocus: 'General',
      theoryPreference: 'Practical',
      skillLevels: { seo: 1, analytics: 1, socialMediaAds: 1, contentCreation: 1, cro: 1 },
      timePerWeek: '5-10 hours',
      learningStyle: LearningStyle.Visual,
      completedModules: [],
      completedCurriculums: [],
      finalExamsPassed: [],
      pillarCompletions: [],
      badges: [],
      xp: 0, streak: 1, longestStreak: 1,
      lastActive: new Date().toISOString(),
      dailyQuizDone: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProfile(newUser);
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 sm:p-6 items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-[2rem] sm:rounded-[4rem] p-6 sm:p-16 shadow-2xl space-y-8 sm:space-y-12 animate-in slide-in-from-bottom-12">
        <div className="flex gap-2">
          {[1,2,3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-indigo-600' : 'bg-slate-100'}`} />
          ))}
        </div>
        {step === 1 && (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in">
            <h3 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter">Student ID.</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Full Name" className="w-full p-5 sm:p-8 bg-slate-50 border-2 border-transparent rounded-2xl sm:rounded-[2.5rem] font-bold text-lg sm:text-2xl focus:border-indigo-600 transition-all outline-none" value={name} onChange={e => setName(e.target.value)} />
              <input type="email" placeholder="Email Reference" className="w-full p-5 sm:p-8 bg-slate-50 border-2 border-transparent rounded-2xl sm:rounded-[2.5rem] font-bold text-lg sm:text-2xl focus:border-indigo-600 transition-all outline-none" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button disabled={!name || !email} onClick={() => setStep(2)} className="w-full py-5 sm:py-8 bg-indigo-600 text-white rounded-2xl sm:rounded-[2.5rem] font-black uppercase text-[10px] sm:text-xs tracking-widest active:scale-95 transition-transform disabled:opacity-50">Proceed</button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in">
            <h3 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter">Market Index.</h3>
            <div className="grid grid-cols-1 gap-3">
              {Object.values(ExperienceLevel).map(lvl => (
                <button key={lvl} onClick={() => setLevel(lvl)} className={`w-full p-5 sm:p-7 text-left rounded-2xl sm:rounded-[2.5rem] border-2 font-black uppercase text-[9px] sm:text-xs tracking-widest transition-all active:scale-[0.98] ${level === lvl ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 hover:bg-slate-50'}`}>{lvl}</button>
              ))}
            </div>
            <div className="flex gap-4">
               <button onClick={() => setStep(1)} className="px-6 py-5 sm:py-8 bg-slate-100 text-slate-400 rounded-full font-black uppercase text-[9px] active:scale-95 transition-transform">Back</button>
               <button onClick={() => setStep(3)} className="flex-1 py-5 sm:py-8 bg-indigo-600 text-white rounded-full font-black uppercase text-[9px] tracking-widest active:scale-95 transition-transform">Next</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in">
            <h3 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter">Objective.</h3>
            <div className="grid grid-cols-1 gap-3">
              {Object.values(LearningGoal).map(g => (
                <button key={g} onClick={() => setGoal(g)} className={`w-full p-5 sm:p-7 text-left rounded-2xl sm:rounded-[2.5rem] border-2 font-black uppercase text-[9px] sm:text-xs tracking-widest active:scale-[0.98] ${goal === g ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 hover:bg-slate-50'}`}>{g}</button>
              ))}
            </div>
            <button onClick={handleFinish} className="w-full py-6 sm:py-10 bg-indigo-600 text-white rounded-full sm:rounded-[3rem] font-black uppercase text-xs sm:text-sm tracking-widest shadow-xl active:scale-95 transition-transform">Begin Learning</button>
          </div>
        )}
      </div>
    </div>
  );
};

const LoginPage = ({ allUsers, setProfile, onNavigate }: any) => {
  const [email, setEmail] = useState('');
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = allUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setProfile({ ...user, isLoggedIn: true });
      onNavigate('dashboard');
    } else {
      alert("Account not found.");
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="max-w-md w-full bg-white rounded-[2rem] sm:rounded-[3rem] p-10 sm:p-16 shadow-xl space-y-10 animate-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
           <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none">Identity.</h3>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Resume Academy Access</p>
        </div>
        <input type="email" required className="w-full p-6 sm:p-8 bg-slate-50 border-2 border-transparent rounded-2xl sm:rounded-[2.5rem] outline-none font-black text-slate-900 focus:border-indigo-600 transition-all text-center text-lg sm:text-2xl" placeholder="Archive Email" value={email} onChange={e => setEmail(e.target.value)} />
        <button type="submit" className="w-full py-5 sm:py-8 bg-indigo-600 text-white rounded-2xl sm:rounded-[2.5rem] font-black uppercase text-[10px] sm:text-xs tracking-widest shadow-lg active:scale-95 transition-transform">Authenticate</button>
        <button type="button" onClick={() => onNavigate('landing')} className="w-full text-center text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-600 transition-all">Cancel</button>
      </form>
    </div>
  );
};

const Dashboard = ({ profile, getProgress, allUsers, setActiveCurriculum, setActiveTopic, onNavigate }: any) => {
  const [newsSummary, setNewsSummary] = useState<string>('Syncing latest market intelligence...');
  
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const sum = await geminiService.summarizeTrend(MARKET_NEWS.map(n => n.summary).join(' '));
        setNewsSummary(sum);
      } catch (e) {
        setNewsSummary("Live feed temporarily offline.");
      }
    };
    fetchNews();
  }, []);

  const nextCurriculum = MOCK_CURRICULUMS.find(c => !profile?.completedCurriculums.includes(c.id));
  
  const handleResume = (curr: Curriculum) => {
    let targetTopic = curr.topics.find(t => t.id === profile?.lastAccessedTopicId);
    if (!targetTopic || profile?.completedModules.includes(targetTopic.id)) {
      targetTopic = curr.topics.find(t => !profile?.completedModules.includes(t.id)) || curr.topics[0];
    }
    setActiveCurriculum(curr);
    setActiveTopic(targetTopic);
    onNavigate('course-player');
  };

  const activeTracks = MOCK_CURRICULUMS.filter(curr => {
    const prog = getProgress(curr);
    return prog > 0 && prog < 100;
  });

  return (
    <div className="space-y-10 sm:space-y-16 animate-in fade-in">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <h2 className="text-4xl sm:text-6xl xl:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] sm:leading-[0.85] text-balance">Welcome, <br className="hidden sm:block" /> {profile?.name.split(' ')[0]}.</h2>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-400 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[8px] sm:text-[10px]">
            <div className="flex items-center gap-2 text-emerald-500 font-black"><Activity size={18} /> Streak: {profile?.streak}d</div>
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
            <div className="font-black">Lvl {calculateLevel(profile?.xp || 0)} Architect</div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] flex items-center gap-6 sm:gap-8 shadow-xl w-full sm:w-auto">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[1.2rem] sm:rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg text-lg">XP</div>
          <div>
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Academy Index</p>
             <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">{profile?.xp.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
        <div className="lg:col-span-2 space-y-10 sm:space-y-16">
          <section className="bg-white p-6 sm:p-12 rounded-[2rem] sm:rounded-[4rem] border border-slate-100 shadow-lg space-y-6 sm:space-y-8 relative overflow-hidden group">
            <h3 className="text-xl sm:text-3xl font-black text-slate-900 flex items-center gap-4"><Newspaper size={28} className="text-indigo-600" /> Market Pulse</h3>
            <div className="prose prose-slate prose-base sm:prose-xl text-slate-600 leading-relaxed font-medium">
               {newsSummary}
            </div>
          </section>

          <section className="space-y-8 sm:space-y-12">
            <h3 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4 sm:gap-6"><Clock size={32} className="text-indigo-600" /> Resume Sync</h3>
            <div className="grid grid-cols-1 gap-6 sm:gap-8">
              {activeTracks.length > 0 ? activeTracks.map(track => (
                <div key={track.id} className="bg-white p-5 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] flex flex-col md:flex-row items-center gap-6 sm:gap-10 border border-slate-100 hover:shadow-xl transition-all group">
                  <div className="w-20 h-20 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-all duration-700">
                    <img src={track.thumbnail} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <h4 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter leading-tight">{track.title}</h4>
                    <ProgressBar progress={getProgress(track)} />
                  </div>
                  <button onClick={() => handleResume(track)} className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Resume</button>
                </div>
              )) : nextCurriculum && (
                <div className="bg-slate-950 rounded-[2.5rem] sm:rounded-[4rem] p-8 sm:p-16 lg:p-20 text-white relative overflow-hidden shadow-2xl group">
                  <div className="relative z-10 space-y-6 sm:space-y-10 max-w-xl">
                    <span className="px-4 py-1.5 bg-indigo-600/20 text-indigo-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-500/30 backdrop-blur-md">Recommended Path</span>
                    <h3 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tighter text-balance">{nextCurriculum.title}</h3>
                    <p className="text-sm sm:text-xl text-slate-400 font-medium leading-relaxed opacity-80 text-balance">{nextCurriculum.description}</p>
                    <button onClick={() => handleResume(nextCurriculum)} className="bg-white text-slate-950 px-10 py-4 sm:px-16 sm:py-6 rounded-full font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">Begin <Play size={18} fill="currentColor" /></button>
                  </div>
                  <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 opacity-[0.03] group-hover:scale-110 transition-all duration-[5000ms] pointer-events-none"><Zap size={900} /></div>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-8 lg:space-y-12">
          <section className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-slate-100">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-8 flex items-center gap-4"><Trophy size={24} className="text-amber-500" /> Leaderboard</h3>
            <div className="space-y-6">
              {allUsers.slice(0, 5).sort((a:any,b:any) => b.xp - a.xp).map((user:any, i:number) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-2xl transition-all group ${user.id === profile?.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-xs ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>{i+1}</div>
                    <span className="font-black text-slate-800 text-sm tracking-tighter truncate max-w-[100px]">{user.name}</span>
                  </div>
                  <span className="font-black text-indigo-600 text-xs">{user.xp.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

const CurriculumView = ({ selectedPillarFilter, setSelectedPillarFilter, filteredCurriculums, getProgress, profile, isTopicUnlocked, setActiveCurriculum, setActiveTopic, onNavigate }: any) => (
  <div className="space-y-10 sm:space-y-16 animate-in fade-in duration-1000">
    <header className="space-y-6 sm:space-y-10">
      <h2 className="text-4xl sm:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[0.8] text-balance">Mastery Stack.</h2>
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
        <button onClick={() => setSelectedPillarFilter('all')} className={`whitespace-nowrap px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${selectedPillarFilter === 'all' ? 'bg-slate-950 text-white shadow-lg' : 'bg-white border text-slate-400 hover:bg-slate-50'}`}>All Pillars</button>
        {PILLARS.slice(0, 10).map(p => (
          <button key={p.id} onClick={() => setSelectedPillarFilter(p.id)} className={`whitespace-nowrap px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${selectedPillarFilter === p.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border text-slate-400 hover:bg-slate-50'}`}>{p.name}</button>
        ))}
      </div>
    </header>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
      {filteredCurriculums.map((curr: any) => (
        <div key={curr.id} className="bg-white rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden flex flex-col shadow-sm border border-slate-100 group hover:shadow-xl transition-all duration-700">
          <div className="h-48 sm:h-64 lg:h-80 relative overflow-hidden">
            <img src={curr.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-[4000ms]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-6 sm:p-10">
               <p className="text-white font-black text-2xl sm:text-4xl leading-none tracking-tighter">{curr.title}</p>
            </div>
          </div>
          <div className="p-6 sm:p-10 flex-1 flex flex-col space-y-8 sm:space-y-10">
             <div className="space-y-3">
               <div className="flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-widest">
                  <span>Coverage</span>
                  <span className="text-indigo-600">{Math.round(getProgress(curr))}%</span>
               </div>
               <ProgressBar progress={getProgress(curr)} />
             </div>
            <div className="flex-1 space-y-2">
              {curr.topics.slice(0, 4).map((t: any) => (
                <button key={t.id} disabled={!isTopicUnlocked(t, curr)} onClick={() => { setActiveCurriculum(curr); setActiveTopic(t); onNavigate('course-player'); }} className={`w-full flex items-center justify-between p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left ${profile?.completedModules.includes(t.id) ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : isTopicUnlocked(t, curr) ? 'bg-slate-50 border-transparent hover:border-indigo-400 hover:bg-indigo-50/30' : 'opacity-60 grayscale cursor-not-allowed'}`}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {profile?.completedModules.includes(t.id) ? <CheckCircle className="shrink-0 text-emerald-600" size={18} /> : isTopicUnlocked(t, curr) ? <Play className="shrink-0 text-indigo-600" size={16} fill="currentColor" /> : <Lock className="shrink-0 text-slate-300" size={16} />}
                    <span className="text-xs sm:text-sm font-black tracking-tight truncate">{t.title}</span>
                  </div>
                </button>
              ))}
              <button onClick={() => { setActiveCurriculum(curr); onNavigate('curriculum'); }} className="w-full pt-4 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">View All Modules</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProfileView = ({ profile, getProgress }: any) => (
  <div className="space-y-10 sm:space-y-16 animate-in fade-in duration-1000 pb-20">
    <header className="bg-white rounded-[2rem] sm:rounded-[4rem] p-8 sm:p-16 shadow-xl flex flex-col md:flex-row items-center gap-8 border border-slate-100 relative overflow-hidden">
      <div className="w-32 h-32 sm:w-56 sm:h-56 rounded-[1.5rem] sm:rounded-[3rem] bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 border-4 border-white shadow-xl relative overflow-hidden ring-8 ring-indigo-50/30">
        {profile?.profilePicture ? <img src={profile.profilePicture} className="w-full h-full object-cover" /> : <User className="w-16 h-16 sm:w-32 sm:h-32" />}
      </div>
      <div className="flex-1 text-center md:text-left space-y-6 sm:space-y-10">
        <h2 className="text-3xl sm:text-6xl font-black text-slate-900 tracking-tighter leading-none">{profile?.name}</h2>
        <div className="flex flex-wrap justify-center md:justify-start gap-8 sm:gap-16">
          <div className="text-center md:text-left">
             <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest mb-1 sm:mb-2">XP</p>
             <p className="text-3xl sm:text-5xl font-black text-indigo-600 leading-none">{profile?.xp.toLocaleString()}</p>
          </div>
          <div className="text-center md:text-left">
             <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest mb-1 sm:mb-2">Streak</p>
             <p className="text-3xl sm:text-5xl font-black text-emerald-500 leading-none">{profile?.streak}d</p>
          </div>
          <div className="text-center md:text-left">
             <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest mb-1 sm:mb-2">Rank</p>
             <p className="text-3xl sm:text-5xl font-black text-amber-500 leading-none">{calculateLevel(profile?.xp || 0)}</p>
          </div>
        </div>
      </div>
    </header>

    <section className="space-y-8">
      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4"><Medal size={28} className="text-indigo-600" /> Mastery Archive</h3>
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {MOCK_CURRICULUMS.map(curr => (
          <Badge key={curr.id} name={curr.title.replace(' Mastery', '')} earned={profile?.finalExamsPassed?.includes(curr.id) || false} isCertificate />
        ))}
      </div>
    </section>
  </div>
);

const Sidebar: React.FC<any> = ({ isSidebarOpen, setSidebarOpen, currentView, setCurrentView, profile, handleLogout }) => {
  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'curriculum' as View, label: 'Curriculum', icon: <BookOpen size={20} /> },
    { id: 'ai-assistant' as View, label: 'Professor AI', icon: <Bot size={20} /> },
    { id: 'profile' as View, label: 'Student Profile', icon: <User size={20} /> },
  ];
  if (profile?.role === 'admin') navItems.push({ id: 'admin' as View, label: 'Admin Console', icon: <Shield size={20} /> });

  return (
    <>
      {/* Overlay */}
      <div className={`fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm md:hidden transition-opacity duration-500 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />
      
      {/* Sidebar Content */}
      <aside className={`fixed top-0 left-0 bottom-0 w-72 sm:w-80 bg-white border-r border-slate-100 z-[70] transition-transform duration-500 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-8 sm:p-10">
          <div className="flex items-center gap-4 text-indigo-600 mb-12 sm:mb-20 px-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg ring-4 ring-indigo-50"><Zap size={24} fill="currentColor" /></div>
            <h1 className="font-black text-xl uppercase tracking-tighter">MarketerAI</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => { setCurrentView(item.id); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black transition-all duration-300 active:scale-95 ${currentView === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}
              >
                {item.icon}
                <span className="text-[10px] uppercase tracking-[0.2em]">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-100">
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-rose-500 hover:bg-rose-50 transition-all active:scale-95 group"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] uppercase tracking-[0.2em]">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const AIAssistantView: React.FC<any> = ({ profile, chatHistory, setChatHistory, chatLoading, setChatLoading, chatInput, setChatInput, chatEndRef, activeTopic }) => {
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatInput('');
    setChatHistory((prev: any) => [...prev, { role: 'user', text: userText, timestamp: Date.now() }]);
    setChatLoading(true);

    try {
      const historyForAI: ChatMessage[] = chatHistory.map((h: any) => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] }));
      const response = await geminiService.getTutorResponse(userText, JSON.stringify(profile), activeTopic?.title || 'Global Marketing', historyForAI);
      setChatHistory((prev: any) => [...prev, { role: 'bot', text: response, timestamp: Date.now() }]);
    } catch (e) {
      alert("Consultation failed. Professors are currently offline.");
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  return (
    <div className="h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)] flex flex-col space-y-6 sm:space-y-10 animate-in fade-in duration-1000">
      <header className="flex items-center justify-between shrink-0 px-2">
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-none">Professor AI.</h2>
        <button onClick={() => setChatHistory([])} className="hidden sm:block px-6 py-3 bg-white border border-slate-200 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-indigo-600 transition-all active:scale-95">Purge Logs</button>
      </header>
      <div className="flex-1 bg-white border border-slate-100 rounded-[1.5rem] sm:rounded-[3.5rem] overflow-hidden flex flex-col shadow-2xl relative">
        <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-8 custom-scrollbar">
          {chatHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto opacity-50">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-inner"><Bot size={60} /></div>
              <p className="text-sm sm:text-lg text-slate-400 font-medium px-4 text-balance">Direct consultation for market audits, strategy reviews, or pillar-specific queries.</p>
            </div>
          )}
          {chatHistory.map((msg: any, i: number) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[90%] sm:max-w-[80%] p-4 sm:p-8 rounded-[1.2rem] sm:rounded-[2.2rem] text-sm sm:text-lg shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'}`}>
                <div className="prose prose-slate prose-sm sm:prose-lg whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-inherit">$1</strong>') }} />
              </div>
            </div>
          ))}
          {chatLoading && <div className="flex justify-start"><div className="bg-slate-50 p-4 rounded-full flex gap-2"><div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" /><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" /></div></div>}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSend} className="p-4 sm:p-6 border-t border-slate-50 bg-slate-50/20 flex gap-3 sm:gap-4">
          <input 
            autoFocus 
            type="text" 
            placeholder="Type your query..." 
            className="flex-1 p-4 sm:p-6 bg-white border border-slate-100 rounded-full outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-black text-slate-900 text-sm sm:text-lg" 
            value={chatInput} 
            onChange={e => setChatInput(e.target.value)} 
          />
          <button 
            disabled={chatLoading} 
            type="submit" 
            className="bg-indigo-600 text-white px-5 sm:px-10 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Send className="w-5 h-5 sm:w-8 sm:h-8" />
          </button>
        </form>
      </div>
    </div>
  );
};

const FinalExam = ({ curriculum, profile, setProfile, onNavigate }: any) => {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [examComplete, setExamComplete] = useState(false);

  const examQuestions = useMemo(() => {
    const allQ = curriculum.topics.flatMap((t: any) => t.quizSteps);
    return [...allQ].sort(() => 0.5 - Math.random()).slice(0, 10);
  }, [curriculum]);

  const handleAnswer = (ans: any) => {
    const isCorrect = ans.toString().toLowerCase() === examQuestions[currentStep].correctAnswer.toString().toLowerCase();
    if (isCorrect) setScore(s => s + 1);
    if (currentStep < examQuestions.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setExamComplete(true);
    }
  };

  const finalize = () => {
    const passed = score >= 9;
    if (passed && profile) {
      const updatedExams = Array.from(new Set([...(profile.finalExamsPassed || []), curriculum.id]));
      setProfile({ ...profile, finalExamsPassed: updatedExams, xp: profile.xp + 1000 });
    }
    onNavigate('dashboard');
  };

  if (!started) return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-6 sm:p-12 overflow-hidden">
      <div className="bg-white max-w-2xl w-full rounded-[2rem] sm:rounded-[3.5rem] p-8 sm:p-16 text-center space-y-10 animate-in zoom-in-95">
         <ShieldAlert size={48} className="mx-auto text-indigo-600" />
         <div className="space-y-4">
           <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter">Certified Mastery</h2>
           <p className="text-slate-500 font-medium leading-relaxed px-4 text-balance text-sm sm:text-base">Absolute accuracy (90%+) required for certification in <strong>{curriculum.title}</strong>.</p>
         </div>
         <button onClick={() => setStarted(true)} className="w-full py-5 sm:py-7 bg-indigo-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all">Begin Integration Test</button>
         <button onClick={() => onNavigate('dashboard')} className="text-[9px] font-black uppercase text-slate-300 tracking-widest hover:text-rose-500 transition-all">Abort</button>
      </div>
    </div>
  );

  if (examComplete) {
    const passed = score >= 9;
    return (
      <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white max-w-xl w-full rounded-[2rem] sm:rounded-[3.5rem] p-10 sm:p-20 text-center space-y-10 animate-in zoom-in-95">
           {passed ? <Medal size={72} className="mx-auto text-emerald-500 animate-bounce" /> : <X size={72} className="mx-auto text-rose-500" />}
           <div className="space-y-2">
             <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-none">{passed ? 'GRADUATED' : 'SYNC FAILED'}</h2>
             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{score}/10 Verified Points</p>
           </div>
           <button onClick={finalize} className={`w-full py-5 sm:py-7 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all ${passed ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>{passed ? 'Issue Credential' : 'Exit Portal'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col p-6 sm:p-12 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full space-y-12 sm:space-y-20 py-8 sm:py-12">
        <header className="flex items-center justify-between border-b border-slate-100 pb-8 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
          <span>Mastery Protocol</span>
          <span className="text-indigo-600 font-black">{currentStep + 1} / {examQuestions.length}</span>
        </header>
        <div className="space-y-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-tight text-balance">{examQuestions[currentStep].content}</h2>
          <div className="grid grid-cols-1 gap-4">
            {examQuestions[currentStep].type === StepType.Quiz ? (
              examQuestions[currentStep].options?.map((opt: string, i: number) => (
                <button key={i} onClick={() => handleAnswer(i)} className="w-full p-6 sm:p-8 text-left rounded-[1.5rem] border-2 border-slate-50 hover:border-indigo-600 hover:bg-slate-50 transition-all active:scale-[0.98] font-black text-base sm:text-lg text-slate-700">{opt}</button>
              ))
            ) : (
              <input autoFocus type="text" placeholder="Technical answer..." className="w-full p-6 sm:p-8 rounded-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none font-black text-xl sm:text-3xl text-center uppercase tracking-tighter" onKeyDown={e => { if (e.key === 'Enter') handleAnswer((e.target as HTMLInputElement).value) }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CoursePlayer = ({ topic, curriculum, profile, setProfile, onNavigate, setActiveTopic }: any) => {
  const [articleIndex, setArticleIndex] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string | number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [fillInput, setFillInput] = useState('');

  const nextQuiz = () => {
    setUserAnswer(null);
    setQuizFeedback(null);
    setFillInput('');
    if (currentQuizIdx < topic.quizSteps.length - 1) {
      setCurrentQuizIdx(i => i + 1);
    } else {
      const passed = score === topic.quizSteps.length;
      if (passed && profile) {
        const updatedModules = Array.from(new Set([...profile.completedModules, topic.id]));
        setProfile({ ...profile, completedModules: updatedModules, xp: profile.xp + 300, lastAccessedTopicId: topic.id, lastAccessedCurriculumId: curriculum.id });
        const topicIdx = curriculum.topics.findIndex((t:any) => t.id === topic.id);
        if (topicIdx < curriculum.topics.length - 1) {
          setActiveTopic(curriculum.topics[topicIdx + 1]);
          setArticleIndex(0); setQuizMode(false); setCurrentQuizIdx(0); setScore(0);
        } else {
          onNavigate('dashboard');
        }
      } else {
        alert("Accuracy mismatch. Returning to study phase.");
        setQuizMode(false); setArticleIndex(0); setCurrentQuizIdx(0); setScore(0);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white fixed inset-0 z-[100] flex flex-col p-0 sm:p-6 lg:p-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col px-4 sm:px-0">
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md flex items-center justify-between py-6 border-b border-slate-100">
          <button onClick={() => onNavigate('curriculum')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-all active:scale-90 text-slate-900"><ArrowLeft size={20} /></button>
          <div className="text-center px-4 flex-1">
            <h3 className="font-black text-lg sm:text-2xl text-slate-900 tracking-tighter truncate leading-tight">{topic.title}</h3>
            <p className="text-[9px] font-black text-indigo-600 uppercase mt-1 tracking-widest">{quizMode ? `Test` : `Module ${articleIndex + 1}/${topic.articles.length}`}</p>
          </div>
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg shrink-0 text-xs sm:text-sm">XP</div>
        </header>

        <div className="flex-1 py-8 sm:py-16">
          {!quizMode ? (
            <div className="space-y-10 sm:space-y-16 animate-in fade-in duration-700">
              <div className="prose prose-slate prose-sm sm:prose-xl max-w-none leading-relaxed text-slate-600 px-1">
                {topic.articles[articleIndex].split('\n').map((line: string, idx: number) => (
                  <p key={idx} className="mb-6 sm:mb-10" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-black">$1</strong>').replace(/### (.*)/g, '<h3 class="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 mt-12 sm:mt-20 mb-8 sm:mb-12 tracking-tighter leading-tight">$1</h3>') }} />
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-50 pb-20">
                <button disabled={articleIndex === 0} onClick={() => setArticleIndex(i => i - 1)} className="flex-1 py-4 rounded-full font-black uppercase text-[9px] border-2 border-slate-100 hover:border-indigo-600 transition-all active:scale-95 disabled:opacity-20">Previous</button>
                <button onClick={() => articleIndex === topic.articles.length - 1 ? setQuizMode(true) : setArticleIndex(i => i + 1)} className="flex-[2] py-4 bg-indigo-600 text-white rounded-full font-black uppercase text-[9px] tracking-widest shadow-xl active:scale-95 transition-all">
                  {articleIndex === topic.articles.length - 1 ? "Initialize Quiz" : "Next Module"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-10 sm:space-y-16 animate-in slide-in-from-bottom-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tighter text-balance">{topic.quizSteps[currentQuizIdx].content}</h2>
              <div className="space-y-4">
                {topic.quizSteps[currentQuizIdx].type === StepType.Quiz ? (
                  topic.quizSteps[currentQuizIdx].options?.map((opt: string, i: number) => (
                    <button key={i} disabled={quizFeedback !== null} onClick={() => {
                      setUserAnswer(i);
                      const isCorrect = topic.quizSteps[currentQuizIdx].correctAnswer === i;
                      setQuizFeedback(isCorrect ? 'correct' : 'incorrect');
                      if (isCorrect) setScore(s => s + 1);
                    }} className={`w-full p-5 sm:p-8 text-left rounded-[1.2rem] sm:rounded-[2rem] border-2 transition-all font-black text-base sm:text-xl active:scale-[0.98] ${userAnswer === i ? (quizFeedback === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-rose-500 bg-rose-50 text-rose-900') : 'border-slate-50 hover:border-indigo-400 hover:bg-slate-50'}`}>
                      {opt}
                    </button>
                  ))
                ) : (
                  <input autoFocus type="text" placeholder="Technical answer..." className="w-full p-5 sm:p-8 rounded-full border-2 border-slate-100 bg-slate-50 text-slate-900 font-black text-xl sm:text-3xl text-center outline-none focus:border-indigo-600" value={fillInput} onChange={e => setFillInput(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter' && fillInput && quizFeedback === null) {
                      const isCorrect = fillInput.toLowerCase() === topic.quizSteps[currentQuizIdx].correctAnswer.toString().toLowerCase();
                      setQuizFeedback(isCorrect ? 'correct' : 'incorrect');
                      if (isCorrect) setScore(s => s + 1);
                    }
                  }} />
                )}
              </div>
              {quizFeedback && (
                <div className={`p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border-2 animate-in slide-in-from-bottom-6 ${quizFeedback === 'correct' ? 'border-emerald-100 bg-emerald-50 text-emerald-900' : 'border-rose-100 bg-rose-50 text-rose-900'}`}>
                   <p className="font-black text-2xl sm:text-3xl mb-1 uppercase tracking-tighter">{quizFeedback === 'correct' ? 'Verified' : 'Error'}</p>
                   <p className="text-base sm:text-xl font-medium opacity-80">{quizFeedback === 'correct' ? 'Knowledge integrated.' : 'Accuracy mismatch. Please review and retry.'}</p>
                   <button onClick={nextQuiz} className={`mt-8 w-full py-4 sm:py-6 rounded-full font-black uppercase text-[9px] sm:text-xs tracking-widest active:scale-95 transition-transform ${quizFeedback === 'correct' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>Continue Protocol</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminHub = ({ allUsers }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredUsers = allUsers.filter((u:any) => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter">Lead Console</h2>
        <div className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">
           {allUsers.length} Users
        </div>
      </div>
      <div className="flex gap-4 items-center bg-white p-4 rounded-full border border-slate-100 shadow-lg w-full">
        <Search className="text-slate-300 ml-3" size={20} />
        <input type="text" placeholder="Search student archives..." className="flex-1 bg-transparent outline-none font-bold text-slate-900 text-base" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((u:any) => (
          <div key={u.id} className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl sm:text-2xl shadow-inner group-hover:scale-110 transition-transform">{u.name[0]}</div>
              <div className="min-w-0 flex-1">
                <h4 className="font-black text-lg sm:text-xl text-slate-900 truncate leading-tight">{u.name}</h4>
                <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest mt-1 truncate">{u.email}</p>
              </div>
            </div>
            <div className="flex justify-between items-end">
               <div>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">XP</p>
                  <span className="font-black text-indigo-600 text-xl sm:text-2xl">{u.xp.toLocaleString()}</span>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Rank</p>
                  <span className="font-black text-slate-800 text-base">Lvl {calculateLevel(u.xp)}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
