import { callLlmWithQuery } from '@/data/demo.punk-songs'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/demo/question')({
  component: RouteComponent,
  loader: async () => await callLlmWithQuery({data: "Who invented atom bomb and in which year?"})
  // loader: async () => await callLlmWithQuery({data: "Give summary of given document"})
})

function RouteComponent() {
    const document = Route.useLoaderData();
  return <div>Hello "/demo/question"! {document}</div>
}
