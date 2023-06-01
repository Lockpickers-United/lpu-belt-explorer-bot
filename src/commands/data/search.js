const {SlashCommandBuilder} = require('discord.js')
const {getData} = require('../../util/dataCache')
const fuzzysort = require('fuzzysort')
const removeAccents = require('remove-accents')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search LPU Belt Explorer for a lock.')
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('The lock you want to find.')
                .setRequired(true)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('query')

        const data = await getData()

        const fixedQuery = removeAccents(query)
        const [entry] = fuzzysort.go(fixedQuery, data, {keys: fuzzySortKeys})
            .map(result => ({
                ...result.obj,
                score: result.score
            }))
            .sort((a, b) => {
                // Move unranked to the bottom of search results
                const val1 = a.belt === 'Unranked'
                const val2 = b.belt === 'Unranked'
                return val1 - val2
            })

        if (entry) {
            const {id, makeModels} = entry
            const {make, model} = makeModels[0]
            const makeModel = make && make !== model ? `${make} ${model}` : model
            const name = makeModel.replace(/[\s/]/g, '_').replace(/\W/g, '')

            await interaction.reply(`https://share.lpubelts.com/?id=${id}&name=${name}`)
        } else {
            await interaction.reply(`No locks found!`)
        }
    }
}

const fuzzySortKeys = [
    'fuzzy',
    'version',
    'notes',
    'id'
]