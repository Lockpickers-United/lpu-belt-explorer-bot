const {SlashCommandBuilder} = require('discord.js')
const dayjs = require('dayjs')
const goats = require('../../util/getGoat.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('goat')
        .setDescription('Get Goat'),

    async execute(interaction) {
        const {user: {username, discriminator}} = interaction
        const requestor = `${username}#${discriminator}`
        console.log(`${dayjs().toISOString()} Processing command: /goat requestor=${requestor}`)

        await interaction.reply(goats[Math.floor(Math.random() * goats.length)])
    }
}
