# CareCraft - Emergency Response Training Platform

CareCraft is a sophisticated simulation application designed for training customer service agents in emergency response scenarios. The platform features an AI-powered virtual assistant, comprehensive evaluation systems, and immersive training experiences across three distinct phases: PreFlight preparation, FlightControl active training, and PostFlight analysis.

## 🚀 Features

### **Three-Phase Training System**
- **PreFlight**: Complete preparation checklist, case selection, and equipment verification
- **FlightControl**: Real-time emergency call simulation with audio visualization and emergency controls
- **PostFlight**: Comprehensive performance analysis with interactive charts and detailed transcripts

### **Advanced Audio Processing**
- Real-time voice visualization using AudioMotion analyzer
- Microphone permission handling and audio quality monitoring
- Simulated AI assistant audio with dynamic frequency patterns
- Volume level monitoring and connection quality indicators

### **Interactive Performance Analytics**
- Dynamic bar charts showing protocol adherence, compassion, clarity, and overall scores
- Timeline visualization with clickable annotations
- Performance metrics tracking with real-time updates
- Detailed transcript analysis with highlighted key moments

### **Professional UI/UX**
- BOSCH corporate branding with official color scheme
- Responsive design optimized for desktop and mobile
- Smooth animations and transitions
- Accessibility features including keyboard navigation and screen reader support

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Styled Components** for component-scoped styling
- **D3.js** for advanced data visualization
- **AudioMotion Analyzer** for real-time audio visualization

### Development Tools
- **ESLint** for code quality
- **TypeScript** for static type checking
- **Hot Module Replacement** for instant development feedback

## 📋 Prerequisites

- **Node.js 22+** (recommended via nvm)
- **npm 10.9.2+**
- Modern web browser with WebAudio API support
- Microphone access for audio features

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd CareCraft
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
```

## 📖 User Guide

### **Getting Started**
1. **PreFlight Phase**: Complete the preparation checklist, select a training case, and verify microphone connectivity
2. **FlightControl Phase**: Engage in realistic emergency call simulation with real-time audio visualization
3. **PostFlight Phase**: Review performance metrics, analyze the conversation transcript, and export reports

### **Training Cases Available**
- **Vehicle Accident** (Easy): Minor injuries, traffic management
- **Medical Emergency** (Hard): Cardiac event, CPR guidance
- **Roadside Breakdown** (Easy): Highway safety, towing coordination
- **Domestic Disturbance** (Medium): Welfare check, safety protocols
- **Fire Emergency** (Hard): Residential fire, multi-agency coordination
- **Mental Health Crisis** (Medium): Suicide risk assessment, crisis counseling

### **Key Features**

#### **PreFlight Preparation**
- Interactive checklist with 6 essential preparation steps
- Case selection with difficulty indicators and detailed scenarios
- Microphone connectivity testing with real-time feedback
- Progress indicators showing completion status

#### **FlightControl Simulation**
- Real-time call timer and quality indicators
- Dual audio visualizers for user and AI voices
- Emergency service buttons (Medical, Fire, Police, Technical)
- Protocol reminders and guidance panels
- Live performance metrics tracking

#### **PostFlight Analysis**
- Tabbed interface for Summary, Analytics, and Transcript
- Interactive performance charts with hover details
- Timeline annotations linking to specific transcript moments
- Searchable conversation transcript with highlighted feedback
- Export functionality for training records

## 🔧 Development

### **Project Structure**
```
frontend/
├── src/
│   ├── components/          # React components organized by feature
│   │   ├── common/         # Shared components (ErrorBoundary)
│   │   ├── PreFlight/      # Pre-training preparation components
│   │   ├── FlightControl/  # Active training simulation components
│   │   ├── PostFlight/     # Post-training analysis components
│   │   └── MainPage/       # Main application orchestrator
│   ├── services/           # Business logic and data management
│   ├── types/              # TypeScript type definitions
│   └── assets/             # Static resources
├── public/                 # Static public files
└── dist/                   # Production build output
```

### **Key Components**

#### **MainPage** (`src/components/MainPage/`)
- Application state management and phase orchestration
- Handles transitions between PreFlight → FlightControl → PostFlight
- Manages case selection and conversation data flow

#### **PreFlight** (`src/components/PreFlight/`)
- `PreFlightChecklist`: Interactive preparation checklist
- `CaseSelector`: Training case selection with difficulty levels
- `MicrophoneCheck`: Audio device verification and testing

#### **FlightControl** (`src/components/FlightControl/`)
- `VoiceVisualizer`: Real-time audio spectrum analysis
- `AudioStreamer`: Microphone access and audio processing
- Emergency controls and call management interface

#### **PostFlight** (`src/components/PostFlight/`)
- `Dashboard`: Performance analytics with interactive charts
- `TranscriptBox`: Searchable conversation transcript
- `SummaryBox`: Key performance indicators and insights

### **Demo Data Service**
The `demoDataService` provides centralized management of all mock data:
- Consistent training cases across components
- Realistic performance metrics generation
- Detailed conversation transcripts with annotations
- Timeline data for performance visualization

### **Styling Architecture**
- CSS custom properties for consistent theming
- BOSCH corporate color scheme implementation
- Responsive design with mobile-first approach
- Accessibility considerations for high contrast and reduced motion

## 🎨 Design System

### **Colors**
- **Primary**: `#013662` (BOSCH Dark Blue)
- **Secondary**: `#237147` (BOSCH Dark Green)
- **Accent**: `#ee4949` (BOSCH Red)
- **Neutral**: Various grays for backgrounds and text

### **Typography**
- System font stack for optimal performance
- Hierarchical font sizing with consistent spacing
- Optimized line heights for readability

### **Components**
- Consistent border radius and shadow system
- Hover states and focus indicators
- Loading states and skeleton screens
- Smooth transitions and micro-interactions

## 🧪 Testing

### **Manual Testing Checklist**
- [ ] Complete PreFlight checklist and case selection
- [ ] Verify microphone permissions and audio visualization
- [ ] Test emergency button functionality in FlightControl
- [ ] Navigate through all PostFlight analysis tabs
- [ ] Test responsive design on different screen sizes
- [ ] Verify accessibility with keyboard navigation

### **Browser Compatibility**
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Deployment

### **Production Build**
```bash
npm run build
```

### **Deployment Options**
- **Static Hosting**: Vercel, Netlify, GitHub Pages
- **CDN**: AWS CloudFront, Cloudflare
- **Docker**: Container-based deployment

### **Environment Configuration**
The application uses Vite's environment variables:
- `import.meta.env.DEV` for development-specific features
- `import.meta.env.PROD` for production optimizations

## 📈 Performance

### **Optimization Features**
- Code splitting and lazy loading
- Optimized bundle size with tree shaking
- Efficient re-rendering with React optimizations
- Audio processing optimization for smooth visualization

### **Monitoring**
- Error boundaries for graceful error handling
- Performance metrics tracking
- Audio latency monitoring
- Real-time quality indicators

## 🤝 Contributing

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make changes following the established patterns
4. Test thoroughly across different scenarios
5. Submit a pull request with detailed description

### **Code Style**
- TypeScript strict mode enabled
- ESLint configuration for consistent formatting
- Component composition over inheritance
- Functional components with hooks

## 📝 License

This project is developed for educational and training purposes as part of the BOSCH emergency response training initiative.

## 🆘 Support

For technical issues or questions:
1. Check the browser console for error messages
2. Verify microphone permissions are granted
3. Ensure you're using a supported browser
4. Test with different audio devices if needed

## 🎯 Future Enhancements

- Multi-language support for international training
- Advanced AI integration for dynamic conversation flows
- Integration with real emergency response systems
- Mobile app version for on-the-go training
- Advanced analytics and learning path recommendations

---

**CareCraft** - Empowering emergency response professionals through immersive, technology-driven training experiences.













---

Technical README


### Frontend

#### Download and install Node.js:
nvm install 22

#### Verify the Node.js version:
node -v # Should print "v22.16.0".
nvm current # Should print "v22.16.0".

#### Verify npm version:
npm -v # Should print "10.9.2".


#### now install packages (from frontend dir)
npm i


#### For reference (first scaffolding)
```
npm create vite@latest -- --template react-ts
```



- #### Vite
    - https://vite.dev/guide/
- #### React Docs
    - https://react.dev/learn
- #### Tailwind CSS Docs
    - https://tailwindcss.com/docs
- #### TypeScript Docs
    - https://www.typescriptlang.org/docs/
- #### Axios Docs
    - https://axios-http.com/docs/intro
- #### Radix UI Docs
    - https://www.radix-ui.com/primitives/docs/overview/introduction
- #### Heroicons Docs
    - https://heroicons.com/
- #### TipTap Docs
    - https://tiptap.dev/docs/editor/getting-started/overview
    - YouTube video: https://www.youtube.com/watch?v=bBCVI2e18dE
    - NodeViews https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views
- #### D3.js Docs
    - https://d3js.org/getting-started
- #### Mermaid Docs
    - https://mermaid.js.org/intro/


### Python backend

#### Setup (from backend dir)

```bash
python3.12 -m venv .venv
source .venv/bin/activate
```

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

```bash
#after each package install
pip freeze > requirements.txt
```
