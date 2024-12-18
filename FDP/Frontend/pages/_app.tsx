import { AppProps } from 'next/app';
import './globals.scss';

export default function MyApp({ Component, pageProps }: AppProps) {
  const getLayout =
    (Component as any).getLayout ?? ((page: React.ReactElement) => page);

  return getLayout(<Component {...pageProps} />);
}
