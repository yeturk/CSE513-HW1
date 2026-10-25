import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/source-sans-3';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import App from './App';
import './styles.css';
import { GanttPreview } from './components/GanttPreview';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><TooltipProvider delayDuration={300} skipDelayDuration={100}>
    {new URLSearchParams(window.location.search).get('preview') === 'gantt' ? <GanttPreview /> : <App />}
  </TooltipProvider></React.StrictMode>,
);
