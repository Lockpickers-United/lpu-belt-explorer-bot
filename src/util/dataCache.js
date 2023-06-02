const removeAccents = require('remove-accents')
const NodeCache = require('node-cache')
const fetch = require('node-fetch')

const oneHour = 60 * 60
const fifteenMinutes = 15 * 60
const cache = new NodeCache({
    stdTTL: oneHour,
    checkperiod: fifteenMinutes
})

const refreshData = async () => {
    const result = await fetch('https://lpubelts.com/data.json')
    const data = await result.json()
    const finalData = data.map(entry => ({
        ...entry,
        fuzzy: removeAccents(
            entry.makeModels
                .map(({make, model}) => [make, model])
                .flat()
                .filter(a => a)
                .join(',')
            + `, ${entry.version}, ${entry.notes}`
        )
    }))
    cache.set('data', finalData)
}

const getData = async () => {
    const value = cache.get('data')
    if (!value) {
        await refreshData()
        return cache.get('data')
    }
    return value
}

module.exports = {getData, refreshData}
