import api from '@flatfile/api'
import { submitCatalog } from './catalog'
import { submitCustomer } from './customer'

export const submitAction = async (event) => {
  const { jobId } = event.context

  await api.jobs.ack(jobId, {
    info: 'Initialisation',
    progress: 10,
  })

  const workbook = await api.workbooks.get(event.context.workbookId)
  const space = await api.spaces.get(event.context.spaceId)
  const spaceInfo = space.data.metadata.spaceInfo

  await api.jobs.ack(jobId, {
    info: 'Sending data to serviceMigration',
    progress: 30,
  })

  await submitCatalog(jobId, workbook, spaceInfo)
  await submitCustomer(jobId, workbook, spaceInfo)
}
