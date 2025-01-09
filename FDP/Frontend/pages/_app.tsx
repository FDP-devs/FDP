import { AppProps } from 'next/app';
import './globals.scss';
import { ModalProvider } from '@/contexts/ModalContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  const getLayout =
    (Component as any).getLayout ?? ((page: React.ReactElement) => page);

  return getLayout(
    <ModalProvider>
      <Component {...pageProps} />
    </ModalProvider>
  );
}
