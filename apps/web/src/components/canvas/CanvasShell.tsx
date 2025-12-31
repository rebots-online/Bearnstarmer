import { createLogger } from '@shared-utils';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { useEffect } from 'react';

const logger = createLogger({ name: '@tljustdraw/web/canvas-shell' });

const CanvasShell = (): JSX.Element => {
  useEffect(() => {
    logger.info('Excalidraw canvas shell mounted');
  }, []);

  return (
    <div className="canvas-shell" aria-label="Excalidraw workspace">
      <Excalidraw theme="dark" />
    </div>
  );
};

export default CanvasShell;
