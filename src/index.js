import 'react-app-polyfill/ie11';
import 'core-js/actual/array';
import {createRoot} from 'react-dom/client';
import './index.css';
import App from './App';


const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
