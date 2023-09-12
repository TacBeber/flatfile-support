import api from '@flatfile/api'
import { RecordTranslater } from '@flatfile/plugin-record-hook/src/record.translater'

export const bulkRecordHook = async (sheetSlug, event, handler) => {
  try {
    const workbook = await api.workbooks.get(event.context.workbookId)
    const catalogSheetId = workbook.data.sheets.find((sheet) => sheet.config.slug === sheetSlug).id
    const eventRecords = (await api.records.get(catalogSheetId, { for: event.id })).data.records
    //const records = await event.cache.init('records', async () => eventRecords)
    if (!eventRecords) return

    const batch = await prepareXRecords(eventRecords)

    return handler(batch.records, event)
  } catch (e) {
    console.log(`Error getting records: ${e}`)
  }

  return handler
}

const prepareXRecords = async (records) => {
  const clearedMessages = records.map((record) => {
    // clear existing cell validation messages
    Object.keys(record.values).forEach((k) => {
      record.values[k].messages = []
    })
    return record
  })
  const fromX = new RecordTranslater(clearedMessages)
  return fromX.toFlatFileRecords()
}
