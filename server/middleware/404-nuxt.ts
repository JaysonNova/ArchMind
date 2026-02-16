export default defineEventHandler((event) => {
  const url = event.node.req.url

  // Handle the empty /_nuxt/ request that causes 404
  if (url === '/_nuxt/' || url?.startsWith('/_nuxt/?')) {
    setResponseStatus(event, 204) // Return 204 No Content instead of 404
    return null
  }
})
