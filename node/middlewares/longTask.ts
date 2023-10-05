import { v4 } from 'uuid'
import { EventContext, IOClients, ServiceContext } from "@vtex/api"
import { json } from 'co-body'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function longTaskFromRoute(ctx: ServiceContext<IOClients>, next: () => Promise<any>) {
  const { vtex: { route: { params } } } = ctx

  const { version } = params

  console.log(`Running long task for version ${version}`)

  switch (version) {
    case 'v1':
      await wait(5000)

      ctx.body = {
        message: 'Long task completed',
      }
      break

    case 'v2':
      await wait(60000)

      ctx.body = {
        message: 'Very long task completed',
      }

      break
    case 'v3':
      const processData = await json(ctx.req)

      const processId = v4()

      ctx.status = 202

      ctx.clients.events.sendEvent('', 'long-task', {
        processId,
        data: processData
      })

      ctx.body = {
        processId
      }

      break

    default:
      ctx.body = {
        message: 'Not implemented yet'
      }

      ctx.status = 501
  }

  await next()
}

export async function longTaskById(ctx: ServiceContext<IOClients>, next: () => Promise<any>) {
  const { clients: { masterdata }, vtex: { route: { params } } } = ctx

  const { processId } = params

  const document = await masterdata.getDocument({
    dataEntity: 'partnertrainingsession',
    fields: ['id', 'eventData', 'createdIn'],
    id: processId as string,
  })

  if (!document) {
    ctx.status = 202

    ctx.body = {
      message: 'Process not finished yet',
      data: null,
    }

    return
  }

  ctx.body = {
    message: 'Process finished',
    data: document,
  }
  ctx.status = 200

  await next()
}

export async function longTaskFromEvent(ctx: EventContext<IOClients>, next: () => Promise<any>) {
  const { clients: { masterdata } } = ctx

  console.log('RECEIVED EVENT', ctx.body)

  const { processId, data: eventData } = ctx.body

  wait(20000).then(async () => {
    await masterdata.createDocument({
      dataEntity: 'partnertrainingsession',
      fields: {
        id: processId,
        eventData,
      },
      schema: 'v1'
    })

    console.log('DOCUMENT CREATED: ', processId)
  })

  await next()
}
