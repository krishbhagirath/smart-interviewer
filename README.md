# Smart Interviewer

AI-powered interview practice platform with modern glassmorphism design.

## Features

- **15 Interview Categories**: Comprehensive coverage including:
  - Behavioral (General, Leadership, Teamwork)
  - Engineering (Frontend, Backend, Full-Stack, Mobile)
  - Technical (System Design, DSA, Database, API Design)
  - Infrastructure (Cloud, DevOps/SRE)
  - Management (Product, Technical Program)

- **Modern Glassmorphism UI**: Beautiful frosted glass effects with animated gradient backgrounds
- **Responsive Design**: Works seamlessly on all devices
- **Question-Based System**: JSON-structured questions with difficulty levels, hints, and follow-ups
- **User Personalization**: Customizable based on target role and experience level

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/krishbhagirath/smart-interviewer.git
cd smart-interviewer
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Language**: JavaScript (ES6+)
- **Data Storage**: JSON files

## Project Structure

```
smart-interviewer/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── layout.js           # Root layout
│   │   ├── page.js             # Pre-interview setup page
│   │   └── interview/          # Interview session page
│   ├── components/
│   │   ├── ui/                 # Reusable glass UI components
│   │   ├── PreInterview/       # Pre-interview feature components
│   │   └── shared/             # Shared components (Logo, etc.)
│   ├── data/
│   │   └── questions/          # JSON question files
│   └── lib/
│       ├── constants.js        # Interview types, experience levels
│       └── utils.js            # Helper functions
├── public/                     # Static assets
└── tailwind.config.js          # Tailwind configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Future Roadmap

- **Phase 2**: Video/audio capture with MediaRecorder API + Eleven Labs voice integration
- **Phase 3**: Backend with Next.js API routes + database
- **Phase 4**: Response analysis and AI-powered feedback generation
- **Phase 5**: Analytics dashboard and interview history tracking

## Contributing

This is a hackathon project. Contributions and suggestions are welcome!

## License

MIT License
