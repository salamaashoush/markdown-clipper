/**
 * Options page entry point
 */

import { render } from 'solid-js/web';
import { ThemeProvider } from '~/lib/theme/ThemeProvider';
import App from './App';
import '../../styles/globals.css';
import './style.css';

const root = document.getElementById('root');
if (root) {
  render(() => (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  ), root);
}