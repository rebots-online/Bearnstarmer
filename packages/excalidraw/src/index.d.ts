import { ComponentProps } from 'react';

export interface ExcalidrawProps extends ComponentProps<'div'> {
  theme?: 'light' | 'dark';
}

export declare const Excalidraw: (props: ExcalidrawProps) => JSX.Element;

export default Excalidraw;
