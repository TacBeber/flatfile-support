import errorCodes from '../helpers/errorCodes.json'
import { transformFlatfileRecordForImport } from '../helpers/helpers'

import axios from 'axios'

export const commonChecks = function (record) {
  if (
    record.get('createdAt')?.toString() &&
    new Date(record.get('createdAt')?.toString()).toString() === 'Invalid Date'
  )
    record.addError('createdAt', errorCodes['g-307'])

  Object.keys(record.toJSON().row.rawData)
    .filter((columnName) => columnName.split('_')[0] === 'cf')
    .map((customFieldColumnName) => {
      const error = getCustomFieldError(record.get(customFieldColumnName) ?? '', customFieldColumnName)
      if (error) record.addError(customFieldColumnName, error)
    })
}

const getCustomFieldError = function (customFieldValue, customFieldColumnName) {
  const chunks = customFieldColumnName.split('_')
  const type = chunks[chunks.length - 1]

  switch (type) {
    case 'NUMBER':
      if (
        isNaN(customFieldValue) ||
        (customFieldValue != '' && customFieldValue != parseInt(customFieldValue.toString()))
      )
        return 'Un nombre entier est attendu'
      return
    case 'DATE':
      if (customFieldValue && new Date(customFieldValue.toString()) == 'Invalid Date') return errorCodes['g-307']
      return
    default:
      return
  }
}

export const sendDataToTactill = (webhookUrl, importType, sheetId, records, spaceInfo) =>
  axios.post(
    webhookUrl,
    {
      method: 'FlatfilePlatform',
      ...spaceInfo,
      sheetId,
      importType,
      records: records.data.records.map(transformFlatfileRecordForImport).filter(Boolean),
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
