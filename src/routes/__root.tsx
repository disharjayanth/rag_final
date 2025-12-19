import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// import Header from '../components/Header'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'RAG PDF',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      { rel: 'icon', 
        href: 'https://img.icons8.com/?size=100&id=ObuWtTlsoTj6&format=png&color=000000' 
      }
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <html lang="en">
      
      <head>
        <HeadContent />
      </head>
      <body>
       <QueryClientProvider client={queryClient}>
           {/* <Header /> */}
        {children}
       </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
