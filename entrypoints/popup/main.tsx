import { render } from 'solid-js/web';
import { ThemeProvider } from '~/lib/theme/ThemeProvider';

import '../../styles/globals.css';
import App from './App';

render(() => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
), document.getElementById('root')!);
