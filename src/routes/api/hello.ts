import type { Context } from 'hono'

export async function GET(c: Context) {
  return c.json({
    message: 'Hello from Liho API!',
    timestamp: new Date().toISOString()
  })
}

export async function POST(c: Context) {
  const body = await c.req.json()
  return c.json({
    received: body,
    message: 'Data received successfully'
  }, 201)
}
