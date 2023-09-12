import api from '@flatfile/api'
import { RecordTranslater } from '@flatfile/plugin-record-hook/src/record.translater'

import errorCodes from '../helpers/errorCodes.json'

import { commonChecks, sendDataToTactill } from './common'
import { shallowEqual } from '../helpers/helpers'

export const validateCatalogRecords = async (records, event) => {
  const workbook = await api.workbooks.get(event.src.context.workbookId)
  const catalogSheetId = workbook.data.sheets.find((sheet) => sheet.config.slug === 'catalog').id

  const variationKeys = workbook.data.sheets
    .find((sheet) => sheet.config.slug === 'catalog')
    .config.fields.filter((field) => field.key.includes('var'))
    .map((field) => field.key)

  const notVariationKeys = ['category', 'tax', 'miniature']

  const hasVariation = function (record) {
    return variationKeys
      .map((key) => record.get(key) != null || record.get(key) != undefined)
      .reduce((acc, cur) => acc || cur, false)
  }

  const res = records.map((record) => {
    commonChecks(record)

    var i = 1
    while (record.get(`var${i}`)) {
      if (record.get(`var${i}`).split('=').length !== 2) record.addError(`var${i}`, errorCodes['g-302'])
      i++
    }

    var sellPrice = record.get('sellPrice')?.toString()
    if (sellPrice && sellPrice.includes(',')) {
      record.set('sellPrice', sellPrice.replace(',', '.'))
    }
    if (record.get('sellPrice') && isNaN(record.get('sellPrice'))) {
      record.addError('sellPrice', errorCodes['g-306'])
    }

    var buyPrice = record.get('buyPrice')?.toString()
    if (buyPrice && buyPrice.includes(',')) {
      record.set('buyPrice', buyPrice.replace(',', '.'))
    }
    if (record.get('buyPrice') && isNaN(record.get('buyPrice'))) {
      record.addError('buyPrice', errorCodes['g-306'])
    }

    var tax = record.get('tax')?.toString()
    if (tax && tax.includes(',')) {
      record.set('tax', tax.replace(',', '.'))
    }

    var sellPrice = record.get('sellPrice')?.toString()
    if (Number.parseFloat(sellPrice) < 0) record.addError('sellPrice', errorCodes['v-003'])

    var buyPrice = record.get('buyPrice')?.toString()
    if (Number.parseFloat(buyPrice) < 0) record.addError('buyPrice', errorCodes['v-003'])

    var tax = record.get('tax')?.toString()
    if (Number.parseFloat(tax) < 0 || Number.parseFloat(tax) > 100) record.addError('tax', errorCodes['v-007'])

    const recordsWithSameName = records.filter((r) => record.get('name') && r.get('name') === record.get('name'))

    if (!hasVariation(record) && recordsWithSameName.length > 1) record.addError('name', errorCodes['g-040'])
    if (hasVariation(record)) {
      notVariationKeys.forEach((key) =>
        recordsWithSameName.every((rcrd) => {
          if (rcrd.get(key) && record.get(key) && rcrd.get(key) !== record.get(key))
            record.addError(key, errorCodes['g-308'])
          return !(rcrd.get(key) && record.get(key) && rcrd.get(key) !== record.get(key))
        })
      )
      // const recordOptions = variationKeys.reduce(
      //   (acc, key) => ({ ...acc, [record.get(key)?.split('=')[0]]: record.get(key)?.split('=')[1] }),
      //   {}
      // )
      // console.log('oubienla')
      // console.log(JSON.stringify(recordOptions))

      // recordsWithSameName.every((rcrd) => {
      //   const rcrdOptions = variationKeys.reduce(
      //     (acc, key) => ({ ...acc, [rcrd.get(key)?.split('=')[0]]: rcrd.get(key)?.split('=')[1] }),
      //     {}
      //   )
      //   if (shallowEqual(rcrdOptions, recordOptions))
      //     variationKeys.forEach((key) => record.addError(key, errorCodes['g-031']))
      //   return !shallowEqual(rcrdOptions, recordOptions)
      // })
    }

    return record
  })
  const recordsUpdates = new RecordTranslater(res).toXRecords()
  await api.records.update(catalogSheetId, recordsUpdates)
  return res
}

// listener.use(
//   recordHook('catalog', (record) => {
//     commonChecks(record)

//     var i = 1
//     while (record.get(`var${i}`)) {
//       if (record.get(`var${i}`).split('=').length !== 2) record.addError(`var${i}`, errorCodes['g-302'])
//       i++
//     }

//     var sellPrice = record.get('sellPrice')?.toString()
//     if (sellPrice && sellPrice.includes(',')) {
//       record.set('sellPrice', sellPrice.replace(',', '.'))
//     }
//     if (record.get('sellPrice') && isNaN(record.get('sellPrice'))) {
//       record.addError('sellPrice', errorCodes['g-306'])
//     }

//     var buyPrice = record.get('buyPrice')?.toString()
//     if (buyPrice && buyPrice.includes(',')) {
//       record.set('buyPrice', buyPrice.replace(',', '.'))
//     }
//     if (record.get('buyPrice') && isNaN(record.get('buyPrice'))) {
//       record.addError('buyPrice', errorCodes['g-306'])
//     }

//     var tax = record.get('tax')?.toString()
//     if (tax && tax.includes(',')) {
//       record.set('tax', tax.replace(',', '.'))
//     }

//     var sellPrice = record.get('sellPrice')?.toString()
//     if (Number.parseFloat(sellPrice) < 0) record.addError('sellPrice', errorCodes['v-003'])

//     var buyPrice = record.get('buyPrice')?.toString()
//     if (Number.parseFloat(buyPrice) < 0) record.addError('buyPrice', errorCodes['v-003'])

//     var tax = record.get('tax')?.toString()
//     if (Number.parseFloat(tax) < 0 || Number.parseFloat(tax) > 100) record.addError('tax', errorCodes['v-007'])

//     return record
//   })
// )

export const addVariationAction = async (event) => {
  const { jobId } = event.context

  await api.jobs.ack(jobId, {
    info: "Initialisation de l'action de création de colonne",
    progress: 10,
  })

  const workbook = await api.workbooks.get(event.context.workbookId)
  const variationDepth =
    workbook.data.sheets
      .find((sheet) => sheet.config.slug === 'catalog')
      .config.fields.filter((field) => field.key.includes('var')).length + 1

  await api.jobs.ack(jobId, {
    info: `Nombre de variation actuel : ${variationDepth}`,
    progress: 30,
  })

  const response = await api.workbooks.update(event.context.workbookId, {
    name: workbook.data.name,
    sheets: workbook.data.sheets.map((sheet) => {
      if (sheet.config.slug === 'catalog') {
        const fields = sheet.config.fields
        fields.splice(variationDepth, 0, {
          key: `var${variationDepth}`,
          type: 'string',
          label: `Variation ${variationDepth}`,
        })
      }
      return {
        slug: sheet.config.slug,
        name: sheet.config.name,
        fields: sheet.config.fields,
        actions: sheet.config.actions ?? [],
      }
    }),
    actions: workbook.data.actions,
  })

  await api.jobs.ack(jobId, {
    info: 'Workbook mis à jour',
    progress: 90,
  })

  if (response.data) {
    await api.jobs.complete(jobId, {
      outcome: {
        message: 'La colonne de variation a bien été ajoutée',
      },
    })
  } else {
    throw new Error('Une erreur est survenue lors de la création de la colonne')
  }
}

export const submitCatalog = async (jobId, workbook, spaceInfo) => {
  const webhookUrl = spaceInfo.webhookUrl

  const catalogSheetId = workbook.data.sheets.find((sheet) => sheet.config.slug === 'catalog').id
  const catalogRecords = await api.records.get(catalogSheetId)
  if (catalogRecords.data.records.length) {
    try {
      sendDataToTactill(webhookUrl, 'CATALOG', catalogSheetId, catalogRecords, spaceInfo).then(() =>
        api.jobs.complete(jobId, {
          outcome: {
            message: 'Votre catalogue a été bien importé dans Tactill',
          },
        })
      )
    } catch (error) {
      if (!error.message.includes('timed out')) {
        await api.jobs.fail(jobId, {
          outcome: {
            message: `Erreur catalogue : ${error}`,
          },
        })
      }
    }
  }
}
