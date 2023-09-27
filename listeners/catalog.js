import api from '@flatfile/api'
import { RecordTranslater } from '@flatfile/plugin-record-hook/src/record.translater'

import errorCodes from '../helpers/errorCodes.json'

import { commonChecks, sendDataToTactill, formatNumberRecord } from './common'
import { shallowEqual } from '../helpers/helpers'

export const validateCatalogRecords = async (records, event) => {
  if (event.context.slugs.sheet !== 'catalog' || (event.context.actorId && event.context.actorId.includes('key'))) {
    return
  }
  const workbook = await api.workbooks.get(event.src.context.workbookId)
  const catalogSheetId = workbook.data.sheets.find((sheet) => sheet.config.slug === 'catalog').id

  const variationKeys = workbook.data.sheets
    .find((sheet) => sheet.config.slug === 'catalog')
    .config.fields.filter((field) => field.key.includes('var'))
    .map((field) => field.key)

  const notVariationKeys = [
    ...['category', 'image_url', 'tags'],
    ...workbook.data.sheets
      .find((sheet) => sheet.config.slug === 'catalog')
      .config.fields.filter((field) => field.key.startsWith('cf_'))
      .map((field) => field.key),
  ]

  const hasVariation = function (record) {
    return variationKeys
      .map((key) => record.get(key) != null || record.get(key) != undefined)
      .reduce((acc, cur) => acc || cur, false)
  }

  const res = records.map((record) => {
    commonChecks(record)

    formatNumberRecord(record, 'sellPrice')
    formatNumberRecord(record, 'buyPrice')
    formatNumberRecord(record, 'tax')

    variationKeys.forEach((key) => {
      if (record.get(key) && record.get(key).split('=').length !== 2) record.addError(key, errorCodes['g-302'])
    })

    var sellPrice = record.get('sellPrice')?.toString()
    if (record.get('sellPrice') && isNaN(record.get('sellPrice'))) {
      record.addError('sellPrice', errorCodes['g-306'])
    }

    var buyPrice = record.get('buyPrice')?.toString()
    if (record.get('buyPrice') && isNaN(record.get('buyPrice'))) {
      record.addError('buyPrice', errorCodes['g-306'])
    }

    var tax = record.get('tax')?.toString()
    if (record.get('tax') && isNaN(record.get('tax'))) {
      record.addError('tax', errorCodes['g-309'])
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
          if (rcrd.get(key) !== record.get(key)) record.addError(key, errorCodes['g-308'])
          return rcrd.get(key) === record.get(key)
        })
      )
      const recordOptions = getOptions(variationKeys, record)
      const recordsWithSameOptions = recordsWithSameName.filter((rcrd) =>
        shallowEqual(recordOptions, getOptions(variationKeys, rcrd))
      )

      if (recordsWithSameOptions.length > 1) variationKeys.forEach((key) => record.addError(key, errorCodes['g-031']))
    }

    return record
  })
  const recordsUpdates = new RecordTranslater(res).toXRecords()
  await api.records.update(catalogSheetId, recordsUpdates)
  return res
}

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
            acknowledge: true,
            message: 'Votre catalogue a été bien importé dans Tactill',
          },
        })
      )
    } catch (error) {
      await api.jobs.fail(jobId, {
        outcome: {
          message: `Erreur catalogue : ${error}`,
        },
      })
    }
  }
}

const getOptions = (variationKeys, record) =>
  variationKeys.reduce((acc, key) => {
    const optionKey = record.get(key)?.split('=')[0]
    const optionValue = record.get(key)?.split('=')[1]
    return optionKey ? { ...acc, [optionKey]: optionValue } : acc
  }, {})
