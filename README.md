# Demeter Health

A personalised AI fitness and nutrition app that adapts to your body, your health conditions, and the food available where you live.

## Features

- AI-powered fitness plan generation via Claude API
- Localised diet planning based on your geographic location
- 4 customisable AI coach personas
- Interactive 3D exercise demonstrations with muscle highlighting
- Metric and imperial unit support
- Geoapify-powered location autocomplete
- Profile persistence across sessions
- BMI calculator
- Offline fallback mode

## Tech Stack

- React (Create React App)
- Tailwind CSS
- Three.js (3D visualisations)
- Anthropic Claude API
- Geoapify Geocoding API

## Getting Started

### Prerequisites

- Node.js 18+
- Anthropic API key
- Geoapify API key

### Installation

```bash
git clone https://github.com/DevWithX/demeter-health.git
cd demeter-health
npm install
```

### Environment Variables

Create a `.env` file in the root:

```
REACT_APP_ANTHROPIC_KEY=your_key_here
REACT_APP_GEOAPIFY_KEY=your_key_here
```

### Run locally

```bash
npm start
```

## Live Demo

[demeter-health.vercel.app](https://demeter-health.vercel.app)

## Screenshots

(Add screenshots here after deployment)
