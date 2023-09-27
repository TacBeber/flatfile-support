import { recordHook } from '@flatfile/plugin-record-hook'
import { ExcelExtractor } from '@flatfile/plugin-xlsx-extractor'

import { validateCustomerRecord } from './listeners/customer'
import { validateCatalogRecords, addVariationAction } from './listeners/catalog'
import { submitAction } from './listeners/workbook'
import { bulkRecordHook } from './helpers/bulkRecordHook'

export default function (listener) {
  const excelExtractorOptions = { rawNumbers: true }

  // Initialize the Excel extractor
  const excelExtractor = ExcelExtractor(excelExtractorOptions)
  // Extract excel files
  listener.use(excelExtractor)

  // Log every event topic
  listener.on('**', (event) => {
    console.log(`-> My event listener received an event: ${event.topic}\n`)
  })

  // Catalog listeners
  listener.on('commit:created', (evt) => {
    return bulkRecordHook('catalog', evt, validateCatalogRecords)
  })

  // Customer listener
  listener.use(recordHook('customer', validateCustomerRecord))

  //Workbook submit action
  listener.filter({ operation: 'workbook:submit' }, (configure) => {
    configure.on('job:ready', submitAction)
  })

  // Catalog addVariation action
  listener.filter({ operation: 'sheet:addVariation' }, (configure) => {
    configure.on('job:ready', addVariationAction)
  })
}
