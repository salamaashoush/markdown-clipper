/**
 * Options page entry point
 */

import { render } from 'solid-js/web';
import { ThemeProvider } from '~/components/ThemeProvider';
import App from './App';
import '../../styles/globals.css';

const root = document.getElementById('root');
if (root) {
  render(() => (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  ), root);
}
