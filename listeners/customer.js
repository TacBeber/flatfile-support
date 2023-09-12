import errorCodes from '../helpers/errorCodes.json'
import countryCodes from '../helpers/countryCode.json'
import { validatePhone } from '../helpers/helpers'
import api from '@flatfile/api'

import { commonChecks, sendDataToTactill } from './common'

export const validateCustomerRecord = (record) => {
  commonChecks(record)

  var phone = record.get('phone')?.toString()
  if (phone) {
    if (!validatePhone(phone)) {
      record.addError('phone', errorCodes['g-303'])
    }
  }

  const validEmailAddressFormat = /^[\w\d.-]+@[\w\d]+\.\w+$/
  var email = record.get('email')?.toString()
  if (email) {
    if (!validEmailAddressFormat.test(String(record.get('email')))) {
      record.addError('email', errorCodes['g-305'])
    }
  }

  var country = record.get('country')?.toString()
  if (country && !countryCodes[country]) record.addError('country', errorCodes['g-304'])

  return record
}

export const submitCustomer = async (jobId, workbook, spaceInfo) => {
  const webhookUrl = spaceInfo.webhookUrl

  const customerSheetId = workbook.data.sheets.find((sheet) => sheet.config.slug === 'customer').id
  const customerRecords = await api.records.get(customerSheetId)
  if (customerRecords.data.records.length) {
    try {
      sendDataToTactill(webhookUrl, 'CUSTOMER', customerSheetId, customerRecords, spaceInfo).then(() =>
        api.jobs.complete(jobId, {
          outcome: {
            message: 'Vos clients ont bien été importés dans Tactill',
          },
        })
      )
    } catch (error) {
      if (!error.message.includes('timed out')) {
        await api.jobs.fail(jobId, {
          outcome: {
            message: `Erreur clients : ${error}`,
          },
        })
      }
    }
  }
}
