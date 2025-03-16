import { AppProps } from 'next/app';
import './globals.scss';
import { ModalProvider } from '@/contexts/ModalContext';
import { AuthProvider } from '../contexts/AuthContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  const getLayout =
    (Component as any).getLayout ?? ((page: React.ReactElement) => page);

  return (
    <AuthProvider>
      <ModalProvider>{getLayout(<Component {...pageProps} />)}</ModalProvider>
    </AuthProvider>
  );
}
