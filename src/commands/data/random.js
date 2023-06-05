const {SlashCommandBuilder} = require('discord.js')
const {getData} = require('../../util/dataCache')
const dayjs = require('dayjs')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Pick a random belted lock.'),

    async execute(interaction) {
        const {user: {username, discriminator}} = interaction
        const requestor = `${username}#${discriminator}`
        console.log(`${dayjs().toISOString()} Processing command: /random requestor=${requestor}`)

        const data = (await getData()).filter(entry => entry.belt !== 'Unranked')
        const index = Math.floor(Math.random() * data.length)
        const entry = data[index]

        const {id, makeModels} = entry
        const {make, model} = makeModels[0]
        const makeModel = make && make !== model ? `${make} ${model}` : model
        const name = makeModel.replace(/[\s/]/g, '_').replace(/\W/g, '')



        const response = [
            `**Random Lock**: https://share.lpubelts.com/?id=${id}&name=${name}`
        ].join('\n')
        await interaction.reply(response)
    }
}
