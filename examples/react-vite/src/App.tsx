import { useState } from 'react';
import './styles/tokens.css';
import './gallery/gallery.css';
import { DesignSystemGallery } from './gallery/DesignSystemGallery';
import type { GalleryToken } from './gallery/DesignSystemGallery';
import { Button } from './components/Button';
import { TextField } from './components/TextField';
import { SettingsPanel } from './patterns/SettingsPanel';
import colors from '../design-system/tokens/colors.json';
import spacing from '../design-system/tokens/spacing.json';
import radius from '../design-system/tokens/radius.json';
import typography from '../design-system/tokens/typography.json';

const tokens: GalleryToken[] = [
  ...Object.entries(colors.semantic).map(([name, value]) => ({ name, value, variable: `color-${name}`, kind: 'color' as const, file: 'colors' })),
  ...Object.entries(spacing).map(([name, value]) => ({ name, value, variable: name, kind: 'spacing' as const, file: 'spacing' })),
  ...Object.entries(radius).map(([name, value]) => ({ name, value, variable: name, kind: 'radius' as const, file: 'radius' })),
  ...Object.entries(typography).flatMap(([group, values]) => Object.entries(values).map(([name, value]) => ({
    name: `${group}.${name}`, value, variable: `${({fontFamily: 'font-family', fontSize: 'font-size', lineHeight: 'line-height'} as Record<string, string>)[group]}-${name}`,
    kind: 'typography' as const, file: 'typography',
  }))),
].map(token => ({ id: `token-${token.variable}`, name: token.name, cssVariable: `--${token.variable}`,
  kind: token.kind, sourceValue: String(token.value), source: `design-system/tokens/${token.file}.json` }));

export function App() {
  const [clicks, setClicks] = useState(0);
  return <DesignSystemGallery tokens={tokens} components={[
    { id: 'component-button', title: 'Button', status: 'candidate', description: 'Primary / secondary · default / disabled / loading. Try keyboard activation.',
      source: 'src/components/Button.tsx', document: 'design-system/components/button.md', preview: <>
        <div className="specimen-row"><Button onClick={() => setClicks(count => count + 1)}>Primary action</Button>
          <Button variant="secondary" onClick={() => setClicks(0)}>Reset counter</Button><Button disabled>Disabled</Button><Button loading>Submit</Button></div>
        <p role="status">Local activations: {clicks}</p></> },
    { id: 'component-text-field', title: 'Text field', status: 'candidate', description: 'Default / disabled / validation error. Each field has an accessible label.',
      source: 'src/components/TextField.tsx', document: 'design-system/components/text-field.md', preview: <div className="field-specimens">
        <TextField label="Default field" placeholder="Type here" /><TextField label="Disabled field" disabled defaultValue="Unavailable" />
        <TextField label="Error field" error="Enter a valid value." defaultValue="Invalid example" /></div> },
  ]} patterns={[
    { id: 'pattern-settings', title: 'Settings form', status: 'candidate', description: 'Shared Button and TextField in a responsive stack. Try empty submission, recovery and reset.',
      source: 'src/patterns/SettingsPanel.tsx', document: 'design-system/pages/settings-pattern.md', preview: <SettingsPanel /> },
  ]} />;
}
