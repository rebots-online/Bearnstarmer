import React from 'react';

export interface ExcalidrawProps extends React.ComponentProps<'div'> {
  theme?: 'light' | 'dark';
}

export const Excalidraw = ({ theme = 'light', children, ...rest }: ExcalidrawProps): JSX.Element => {
  return (
    <div
      className={`excalidraw excalidraw--${theme}`}
      data-testid="excalidraw-stub"
      {...rest}
    >
      <div className="excalidraw__placeholder">
        Excalidraw stub (offline placeholder)
      </div>
      {children}
    </div>
  );
};

export default Excalidraw;
