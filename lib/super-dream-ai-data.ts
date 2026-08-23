export interface AllocatedAiProject {
  id: string;
  categoryKey:
    | "ml-models"
    | "dl-models"
    | "computer-vision"
    | "nlp"
    | "gen-ai"
    | "ai-agents"
    | "rag-apps"
    | "kaggle";
  categoryLabel: string;
  projectNumber: number;
  title: string;
  tagline: string;
  description: string;
  framework: string;
  techStack: string[];
  githubUrl: string;
  screenshotUrl: string;
  liveUrl?: string; // Optional working link / Gradio / HuggingFace
  demoVideoUrl?: string; // Optional video demo link
  verified: boolean;
  metrics: {
    accuracy?: string;
    f1Score?: string;
    dataset?: string;
    latency?: string;
  };
  highlights: string[];
}

export interface AiCategoryConfig {
  key: AllocatedAiProject["categoryKey"];
  label: string;
  targetCount: number;
  iconName: string;
  color: string;
  description: string;
}

export const AI_DATA_SCIENCE_CATEGORIES: AiCategoryConfig[] = [
  {
    key: "ml-models",
    label: "Machine Learning Models",
    targetCount: 25,
    iconName: "TrendingUp",
    color: "#6366F1",
    description: "Supervised and unsupervised models (XGBoost, Random Forest, SVM, LightGBM) for tabular data.",
  },
  {
    key: "dl-models",
    label: "Deep Learning Models",
    targetCount: 15,
    iconName: "BrainCircuit",
    color: "#0EA5E9",
    description: "Multi-layer neural networks, CNNs, RNNs, Autoencoders, and GANs built with PyTorch and TensorFlow.",
  },
  {
    key: "computer-vision",
    label: "Computer Vision Projects",
    targetCount: 10,
    iconName: "Eye",
    color: "#10B981",
    description: "Object detection, semantic segmentation, face recognition, and medical imaging with YOLOv8 & OpenCV.",
  },
  {
    key: "nlp",
    label: "NLP Projects",
    targetCount: 10,
    iconName: "MessageSquare",
    color: "#F59E0B",
    description: "Transformers, sentiment analysis, NER, semantic search, and text summarization using BERT & RoBERTa.",
  },
  {
    key: "gen-ai",
    label: "Generative AI Applications",
    targetCount: 15,
    iconName: "Sparkles",
    color: "#8B5CF6",
    description: "LLM fine-tuning, prompt engineering, multimodal pipelines with LangChain, Llama 3, and Gemini Pro.",
  },
  {
    key: "ai-agents",
    label: "AI Agent Applications",
    targetCount: 10,
    iconName: "Bot",
    color: "#EC4899",
    description: "Autonomous multi-agent workflows, tool-use, code executors, and memory graphs with CrewAI and AutoGen.",
  },
  {
    key: "rag-apps",
    label: "RAG Applications",
    targetCount: 10,
    iconName: "Database",
    color: "#14B8A6",
    description: "Retrieval-Augmented Generation with Qdrant, Milvus, hybrid dense/sparse search, and reranking.",
  },
  {
    key: "kaggle",
    label: "Kaggle Competitions",
    targetCount: 20,
    iconName: "Award",
    color: "#F43F5E",
    description: "Competitive machine learning benchmarks, feature engineering pipelines, and ensemble blend submissions.",
  },
];
export const INITIAL_ALLOCATED_AI_PROJECTS: AllocatedAiProject[] = [];

