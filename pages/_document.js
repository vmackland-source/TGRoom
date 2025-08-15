import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preload" href="/OrangeStreet.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="icon" href="/logo.png" />
        <meta name="theme-color" content="#021a14" />
      </Head>
      <body>
        <Main /><NextScript />
      </body>
    </Html>
  );
}
