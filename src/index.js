import 'core-js/actual/array';
import 'react-app-polyfill/ie11';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
