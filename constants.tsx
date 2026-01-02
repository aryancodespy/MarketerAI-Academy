
import React from 'react';
import { 
  Target, Search, PenTool, Share2, DollarSign, Mail, BarChart3, Globe, 
  Settings, Cpu, Layout, Heart, ShoppingBag, ShieldCheck, Zap, Briefcase, BookOpen 
} from 'lucide-react';
import { Curriculum, StepType, Topic, UserProfile, ExperienceLevel, LearningGoal, LearningStyle } from './types';

export const PILLARS = [
  { id: 'foundation', name: 'Core Foundations', icon: <BookOpen size={20} /> },
  { id: 'search', name: 'Search Marketing (SEO/GEO)', icon: <Search size={20} /> },
  { id: 'content', name: 'Content Marketing', icon: <PenTool size={20} /> },
  { id: 'social', name: 'Social Media Marketing', icon: <Share2 size={20} /> },
  { id: 'ads', name: 'Paid Advertising (PPC)', icon: <DollarSign size={20} /> },
  { id: 'email', name: 'Email & CRM', icon: <Mail size={20} /> },
  { id: 'cro', name: 'Conversion Optimization (CRO)', icon: <Target size={20} /> },
  { id: 'analytics', name: 'Analytics & Data', icon: <BarChart3 size={20} /> },
  { id: 'global', name: 'Local & Global Marketing', icon: <Globe size={20} /> },
  { id: 'automation', name: 'Marketing Automation', icon: <Settings size={20} /> },
  { id: 'ai', name: 'AI in Digital Marketing', icon: <Cpu size={20} /> },
  { id: 'uxui', name: 'UX/UI & Web Optimization', icon: <Layout size={20} /> },
  { id: 'branding', name: 'Branding & Psychology', icon: <Heart size={20} /> },
  { id: 'ecommerce', name: 'E-commerce Marketing', icon: <ShoppingBag size={20} /> },
  { id: 'legal', name: 'Legal, Ethics & Compliance', icon: <ShieldCheck size={20} /> },
  { id: 'future', name: 'Emerging & Future Topics', icon: <Zap size={20} /> },
  { id: 'career', name: 'Career & Agency Skills', icon: <Briefcase size={20} /> },
];

const pillarContentMap: Record<string, string[]> = {
  foundation: [
    "What is Digital Marketing", "Online vs Offline Marketing", "Inbound Marketing", "Outbound Marketing", 
    "Performance Marketing", "Growth Marketing", "Funnel-based Marketing", "Omnichannel Marketing", 
    "Customer Journey Mapping", "Buyer Personas", "Value Propositions", "Branding & Positioning", "Marketing Psychology"
  ],
  search: [
    "On-Page SEO: Keyword research & Search intent", "Technical SEO: Crawling & Indexing", 
    "AEO (Answer Engine Optimization): Featured snippets", "GEO (Generative Engine Optimization): AI Visibility",
    "AIO (AI Optimization): Content Summarization", "Link Building Strategies", "Mobile-first Indexing", "Core Web Vitals"
  ],
  content: [
    "Content strategy & Blogging", "Long-form vs Short-form", "Copywriting & Storytelling", 
    "Content calendars & Distribution", "Repurposing & Evergreen content", "Thought leadership", "Landing page copy"
  ],
  social: [
    "Platform strategy (FB, IG, LinkedIn, TikTok)", "Community building", "Influencer marketing", 
    "Social listening", "Hashtag strategy", "Engagement tactics", "Social analytics"
  ],
  ads: [
    "Google Ads (Search, Display, Shopping)", "Meta Ads", "LinkedIn Ads", "TikTok Ads", 
    "Retargeting & Remarketing", "Lookalike audiences", "Ad creatives & A/B testing", "ROAS & Budget optimization"
  ],
  email: [
    "Email campaigns & Newsletters", "Drip campaigns & Automation", "Segmentation & Personalization", 
    "Deliverability & Open rates", "CRM tools", "Customer lifecycle marketing"
  ],
  cro: [
    "Landing page optimization", "A/B testing & Heatmaps", "User behavior analysis", 
    "UX/UI for conversion", "Call-to-actions (CTA)", "Funnel optimization", "Trust signals"
  ],
  analytics: [
    "Google Analytics (GA4)", "Google Search Console", "Event tracking", "Attribution models", 
    "KPIs & Dashboards", "Data-driven decisions", "Marketing reports"
  ],
  global: [
    "Local SEO & Google Business Profile", "Reviews management", "Maps optimization", 
    "Geo-targeting", "International SEO & Localization", "Translation strategy"
  ],
  automation: [
    "Marketing automation platforms", "AI tools & Chatbots", "CRM integrations", 
    "Workflow automation", "Zapier & No-code tools"
  ],
  ai: [
    "AI content generation", "AI SEO tools", "AI image & video tools", 
    "Predictive analytics", "Recommendation systems", "Prompt engineering for marketing"
  ],
  uxui: [
    "Website design principles", "UX research & UI design", "Page layout & Accessibility", 
    "Mobile UX", "Web performance", "Conversion-focused design"
  ],
  branding: [
    "Brand voice & Visual identity", "Consumer psychology", "Persuasion principles", 
    "Neuromarketing", "Social proof", "Authority & Trust building"
  ],
  ecommerce: [
    "Product page optimization", "Category SEO", "Shopping feeds", 
    "Marketplace SEO", "CRO for e-commerce", "Cart abandonment & Retention"
  ],
  legal: [
    "GDPR & Data protection", "Cookie consent", "Privacy policies", 
    "Email compliance (CAN-SPAM)", "Ethical marketing"
  ],
  future: [
    "AI search evolution", "Web3 marketing", "Metaverse marketing", 
    "AR/VR marketing", "Voice assistants", "Multimodal search"
  ],
  career: [
    "Digital marketing careers", "Freelancing & Agency models", "Client management", 
    "Pricing strategies", "Proposal writing", "Reporting to clients"
  ]
};

const generateTopicsForPillar = (pillarId: string): Topic[] => {
  const chapters = pillarContentMap[pillarId] || ["General Mastery Overview"];
  
  return chapters.map((chapter, idx) => ({
    id: `topic-${pillarId}-${idx}`,
    title: chapter,
    pillar: pillarId,
    description: `A technical deep-dive into ${chapter}. Advanced frameworks and deployment strategies.`,
    difficulty: idx === 0 ? 'Beginner' : idx < chapters.length / 2 ? 'Intermediate' : 'Advanced',
    estimatedTime: '45m',
    articles: [
      `### ${chapter}: The Master Blueprint\n\nIn this section, we break down **${chapter}** from a first-principles perspective. Modern marketing requires a deep understanding of how this specific component fits into the broader **Digital Ecosystem**.\n\nTo master this, you must understand the **Information Architecture** of your target platforms. Whether it's the indexing logic of search engines or the attention algorithms of social feeds, **${chapter}** is about manipulating these signals to drive user behavior.`,
      `### Technical Architecture & Signal Flows\n\nTo effectively execute, one must master the underlying physics of the channel. \n\n1. **Data Acquisition**: How signals (clicks, views, events) are collected via the **DOM** or server-side tracking.\n2. **Synthesis**: Turning raw metrics like **CTR** and **CPM** into actionable growth levers.\n3. **Deployment**: Scaling the message across the stack using **API-driven automation** and programmatic buying.\n\nWe cover **Attribution Models**, **Cross-device Tracking**, and the **Psychological Triggers** (Cialdini’s principles) that make this chapter vital for any Senior Growth Architect.`,
      `### Advanced Frameworks: The MarketerAI Strategy\n\nWe introduce the **Propulsion Framework** for ${chapter}. This involves a 3-step cycle:\n\n* **Audit & Benchmarking**: Identifying current performance gaps using specialized tools like SEMrush, Hotjar, or Python-based scraping scripts.\n* **Creative Iteration**: Using **Generative AI** (like Gemini) to produce high-variance ad copy and visual assets at scale.\n* **Statistical Validation**: Running **Bayesian A/B tests** to ensure that your optimizations are statistically significant (p < 0.05).`,
      `### Future Outlook & AI Integration\n\nThe landscape for **${chapter}** is shifting towards **Zero-Click Content** and **LLM-driven discovery**. Marketers who fail to optimize for **Generative Search** will be left behind. \n\nWe explore how to use **Vector Embeddings** and **Knowledge Graphs** to ensure your brand remains the primary answer in the age of AI agents.`
    ],
    quizSteps: [
      { 
        id: `q-${pillarId}-${idx}-1`, 
        type: StepType.Quiz, 
        content: `In the context of ${chapter}, what does 'First-Principles Thinking' require?`, 
        options: ["Breaking down the channel into its fundamental physics", "Copying competitor strategies exactly", "Following the highest bidder", "Ignoring data for intuition"], 
        correctAnswer: 0 
      },
      { 
        id: `q-${pillarId}-${idx}-2`, 
        type: StepType.FillBlank, 
        content: `The MarketerAI Propulsion Framework requires ______ validation to ensure results are not due to chance.`, 
        correctAnswer: "statistical" 
      },
      { 
        id: `q-${pillarId}-${idx}-3`, 
        type: StepType.Quiz, 
        content: `Scenario: Your ${chapter} campaign has a high CTR but 0 conversions. What is the most likely diagnosis?`, 
        options: ["Offer/Landing Page Mismatch", "Too much budget", "The creative is too good", "Wrong timezone settings"], 
        correctAnswer: 0 
      },
      { 
        id: `q-${pillarId}-${idx}-4`, 
        type: StepType.Quiz, 
        content: `How does Generative AI change the strategy for ${chapter}?`, 
        options: ["It enables hyper-personalization at infinite scale", "It makes marketing obsolete", "It only helps with spelling", "It removes the need for data"], 
        correctAnswer: 0 
      },
      { 
        id: `q-${pillarId}-${idx}-5`, 
        type: StepType.FillBlank, 
        content: `Optimizing for the future of search requires understanding ______ embeddings.`, 
        correctAnswer: "vector" 
      }
    ]
  }));
};

export const MOCK_CURRICULUMS: Curriculum[] = PILLARS.map((p, index) => ({
  id: `curr-${p.id}`,
  title: `${p.name} Mastery`,
  pillar: p.id,
  difficulty: index < 5 ? 'Beginner' : index < 12 ? 'Intermediate' : 'Advanced',
  estimatedTime: `${15 + index}h`,
  order: index + 1,
  isTrending: [0, 1, 10].includes(index),
  thumbnail: `https://images.unsplash.com/photo-${1460925895917 + index}-afdab827c52f?auto=format&fit=crop&q=80&w=400`,
  description: `The complete technical syllabus for ${p.name}. Built for those who want to lead the industry.`,
  topics: generateTopicsForPillar(p.id)
}));

export const MARKET_NEWS = [
  { id: 'n1', title: 'AI Search Evolution', summary: 'Google Gemini integration in search is shifting traffic from top-of-funnel queries.', date: 'Today' },
  { id: 'n2', title: 'First-Party Data Shift', summary: 'With third-party cookies disappearing, CRM-driven marketing is becoming the #1 priority.', date: 'Yesterday' },
  { id: 'n3', title: 'Retail Media Boom', summary: 'Amazon and Walmart ad networks are seeing 40% YoY growth.', date: '3 days ago' }
];

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'u1',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    role: 'student',
    isLoggedIn: false,
    experienceLevel: ExperienceLevel.Intermediate,
    familiarAreas: ['SEO', 'Content'],
    toolsUsed: ['GA4', 'Semrush'],
    learningGoal: LearningGoal.Career,
    primaryFocus: 'Search',
    theoryPreference: 'Practical',
    skillLevels: { seo: 4, analytics: 3, socialMediaAds: 2, contentCreation: 4, cro: 3 },
    timePerWeek: '10-15 hours',
    learningStyle: LearningStyle.Visual,
    completedModules: ['topic-foundation-0', 'topic-foundation-1'],
    completedCurriculums: [],
    finalExamsPassed: [],
    pillarCompletions: [],
    badges: ['Core Foundations'],
    xp: 4850,
    streak: 12,
    longestStreak: 20,
    lastActive: new Date().toISOString(),
    dailyQuizDone: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'u2',
    name: 'Marcus Bell',
    email: 'marcus@example.com',
    role: 'student',
    isLoggedIn: false,
    experienceLevel: ExperienceLevel.Advanced,
    familiarAreas: ['PPC', 'Analytics'],
    toolsUsed: ['Google Ads', 'Tableau'],
    learningGoal: LearningGoal.Business,
    primaryFocus: 'Ads',
    theoryPreference: 'Advanced',
    skillLevels: { seo: 2, analytics: 5, socialMediaAds: 5, contentCreation: 1, cro: 4 },
    timePerWeek: '5-10 hours',
    learningStyle: LearningStyle.StepByStep,
    completedModules: ['topic-ads-0', 'topic-ads-1', 'topic-ads-2'],
    completedCurriculums: [],
    finalExamsPassed: [],
    pillarCompletions: [],
    badges: ['Paid Advertising (PPC)'],
    xp: 4200,
    streak: 5,
    longestStreak: 15,
    lastActive: new Date().toISOString(),
    dailyQuizDone: true,
    createdAt: '2024-02-10T14:30:00Z',
    updatedAt: new Date().toISOString()
  }
];
