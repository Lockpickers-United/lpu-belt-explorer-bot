const {SlashCommandBuilder} = require('discord.js')
const dayjs = require('dayjs')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rafl')
        .setDescription('RAFL!'),

    async execute(interaction) {
        const {user: {username, discriminator}} = interaction
        const requestor = `${username}#${discriminator}`
        console.log(`${dayjs().toISOString()} Processing command: /rafl requestor=${requestor}`)

        const response = [
            `**RAFL!**: https://share.lpubelts.com/rafl`
        ].join('\n')
        await interaction.reply(response)
    }
}
