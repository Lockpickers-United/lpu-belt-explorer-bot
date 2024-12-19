const {SlashCommandBuilder} = require('discord.js')
const dayjs = require('dayjs')
const words = require('../../util/words.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rafl')
        .setDescription('RAFL!'),


    async execute(interaction) {
        const {user: {username, discriminator}} = interaction
        const requestor = `${username}#${discriminator}`
        console.log(`${dayjs().toISOString()} Processing command: /rafl requestor=${requestor}`)

        const word = words[Math.floor(Math.random() * words.length)].replaceAll(' ','-')

        const response = [
            `**RAFL!**: https://share.lpubelts.com/rafl?w=${word}!`
        ].join('\n')
        await interaction.reply(response)
    }
}
