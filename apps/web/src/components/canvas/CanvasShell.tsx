import { createLogger } from '@shared-utils';
import {
  Excalidraw,
  type ExcalidrawInitialDataState,
  type ExcalidrawProps,
} from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { useCallback, useEffect, useMemo } from 'react';

const logger = createLogger({ name: '@tljustdraw/web/canvas-shell' });
const PERSISTENCE_KEY = 'tljustdraw-excalidraw-local';

const loadInitialData = (): ExcalidrawInitialDataState | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const rawSnapshot = window.localStorage.getItem(PERSISTENCE_KEY);
  if (!rawSnapshot) {
    return undefined;
  }

  try {
    return JSON.parse(rawSnapshot) as ExcalidrawInitialDataState;
  } catch (error) {
    logger.warn('Failed to parse persisted Excalidraw data; falling back to empty state', { error });
    return undefined;
  }
};

const persistSnapshot: NonNullable<ExcalidrawProps['onChange']> = (elements, appState, files) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const payload = JSON.stringify({ elements, appState, files });
    window.localStorage.setItem(PERSISTENCE_KEY, payload);
  } catch (error) {
    logger.error('Failed to persist Excalidraw snapshot', { error });
  }
};

const CanvasShell = (): JSX.Element => {
  const initialData = useMemo(() => loadInitialData(), []);

  const handleChange = useCallback<NonNullable<ExcalidrawProps['onChange']>>(
    (elements, appState, files) => {
      persistSnapshot(elements, appState, files);
    },
    [],
  );

  useEffect(() => {
    logger.info('Excalidraw canvas shell mounted');
  }, []);

  return (
    <div className="canvas-shell" aria-label="Excalidraw workspace">
      <Excalidraw theme="dark" initialData={initialData} onChange={handleChange} />
    </div>
  );
};

export default CanvasShell;
