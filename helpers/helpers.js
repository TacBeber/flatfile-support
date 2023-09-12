import phoneNumberUtil from 'google-libphonenumber'

const instance = phoneNumberUtil.PhoneNumberUtil.getInstance()

export const validatePhone = (phone) => {
  try {
    const number = instance.parseAndKeepRawInput(phone)

    const region = instance.getRegionCodeForNumber(number)

    const isValid = instance.isValidNumberForRegion(number, region)
    return isValid
  } catch (error) {
    return false
  }
}

export const shallowEqual = (object1, object2) => {
  const keys1 = Object.keys(object1)
  const keys2 = Object.keys(object2)

  if (keys1.length !== keys2.length) {
    return false
  }

  for (let key of keys1) {
    if (object1[key] !== object2[key]) {
      return false
    }
  }

  return true
}

export const transformFlatfileRecordForImport = (record) => {
  if (record.valid) {
    return Object.keys(record.values).reduce((transformedObj, key) => {
      transformedObj[key] = record.values[key].value
      return transformedObj
    }, {})
  }
  return null
}
