import type { PropsWithChildren } from 'react';

export const I18nProvider = ({ children }: PropsWithChildren) => <>{children}</>;

export const useT = () => (key: string) => key;
