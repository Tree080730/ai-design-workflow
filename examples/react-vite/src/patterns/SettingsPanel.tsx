import { useState } from 'react';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';

// Shared composition with local mock state; no API or persistence.
export function SettingsPanel() {
  const [name, setName] = useState('Design team');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  return <form className="settings-panel" onSubmit={event => {
    event.preventDefault();
    setError(name.trim() ? '' : 'Enter a workspace name.');
    setSaved(Boolean(name.trim()));
  }}>
    <div><h3>Workspace settings</h3><p>Local demonstration · no data is sent or saved.</p></div>
    <TextField label="Workspace name" value={name} error={error} onChange={event => {
      setName(event.target.value); setSaved(false); setError('');
    }} />
    <div className="specimen-row"><Button type="submit">Save preview</Button>
      <Button variant="secondary" onClick={() => { setName('Design team'); setError(''); setSaved(false); }}>Reset</Button></div>
    <p role="status">{saved ? 'Preview updated locally.' : 'Changes are not persisted.'}</p>
  </form>;
}
