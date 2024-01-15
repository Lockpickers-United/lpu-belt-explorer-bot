const {SlashCommandBuilder} = require('discord.js')
const {getData} = require('../../util/dataCache')
const fuzzysort = require('fuzzysort')
const removeAccents = require('remove-accents')
const dayjs = require('dayjs')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('define')
        .setDescription('Search LPU Glossary for a term.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The term.')
                .setRequired(true)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('query')
        const data = await getData('glossary')

        const fixedQuery = removeAccents(query)
        const [entry] = fuzzysort.go(fixedQuery, data, {keys: fuzzySortKeys})
            .map(result => ({
                ...result.obj,
                score: result.score
            }))

        if (entry) {
            const {term, definition} = entry
            const {user: {username, discriminator}} = interaction

            const requester = `${username}#${discriminator}`
            console.log(`${dayjs().toISOString()} Processing command: /define ${query} term=${term} requestor=${requester}`)

            const fixedDefinition = definition.replace(/\[([^\]]+)]\(.+\)/, '$1')

            const response = [
                `**Term**: ${term}`,
                `**Definition**: ${fixedDefinition}`
            ].join('\n')
            await interaction.reply(response)
        } else {
            await interaction.reply({
                content: `No terms found!`,
                ephemeral: true
            })
        }
    }
}

const fuzzySortKeys = ['term']
