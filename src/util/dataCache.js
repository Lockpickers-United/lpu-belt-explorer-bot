const removeAccents = require('remove-accents')
const NodeCache = require('node-cache')
const fetch = require('node-fetch')

const oneHour = 60 * 60
const fifteenMinutes = 15 * 60
const cache = new NodeCache({
    stdTTL: oneHour,
    checkperiod: fifteenMinutes
})

const refreshData = async key => {
    const url = urlsByKey[key]
    const result = await fetch(url)
    const transform = transformsByKey[key]
    const finalData = transform ? transform(result) : result.text()
    cache.set(key, finalData)
    return finalData
}

const getData = async key => {
    const value = cache.get(key)
    if (!value) return refreshData(key)
    else return value
}

const urlsByKey = {
    data: 'https://lpubelts.com/data.json',
    glossary: 'https://lpubelts.com/glossary.json',
    white: 'https://raw.githubusercontent.com/Lockpickers-United/lpu-belt-explorer/main/src/resources/beltRequirements/white.md',
    yellow: 'https://raw.githubusercontent.com/Lockpickers-United/lpu-belt-explorer/main/src/resources/beltRequirements/yellow.md',
    orange: 'https://raw.githubusercontent.com/Lockpickers-United/lpu-belt-explorer/main/src/resources/beltRequirements/orange.md',
    green: 'https://raw.githubusercontent.com/Lockpickers-United/lpu-belt-explorer/main/src/resources/beltRequirements/green.md',
    blue: 'https://raw.githubusercontent.com/Lockpickers-United/lpu-belt-explorer/main/src/resources/beltRequirements/blue.md',
    purple: 'https://raw.githubusercontent.com/Lockpickers-United/lpu-belt-explorer/main/src/resources/beltRequirements/purple.md',
    brown: 'https://raw.githubusercontent.com/Lockpickers-United/lpu-belt-explorer/main/src/resources/beltRequirements/brown.md',
    red: 'https://raw.githubusercontent.com/Lockpickers-United/lpu-belt-explorer/main/src/resources/beltRequirements/red.md',
    black: 'https://raw.githubusercontent.com/Lockpickers-United/lpu-belt-explorer/main/src/resources/beltRequirements/black.md',
    quests: 'https://raw.githubusercontent.com/Lockpickers-United/lpu-belt-explorer/main/src/resources/beltRequirements/black.md',
}

const transformsByKey = {
    data: async result => {
        const data = await result.json()
        return data.map(entry => ({
            ...entry,
            fuzzy: removeAccents(
                entry.makeModels
                    .map(({make, model}) => [make, model])
                    .flat()
                    .filter(a => a)
                    .concat([
                        entry.version,
                        entry.notes,
                        entry.belt
                    ])
                    .join(',')
            )
        }))
    },
    glossary: async result => {
        return await result.json()
    },
    black: async result => {
        const content = await result.text()
        const index = content.indexOf('Epic Quest Options (')
        return content.substring(0, index)
    }
}

module.exports = {getData, refreshData}
