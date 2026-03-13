import { render } from 'preact';
import { AppShell } from './components/app-shell';
import './styles.css';

render(<AppShell />, document.getElementById('app')!);
