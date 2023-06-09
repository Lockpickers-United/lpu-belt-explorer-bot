const {SlashCommandBuilder} = require('discord.js')
const {getData} = require('../../util/dataCache')
const dayjs = require('dayjs')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('requirements')
        .setDescription('Get the requirements for an LPU Belt.')
        .addStringOption(option =>
            option.setName('belt')
                .setDescription('The LPU Belt to get requirements for.')
                .setRequired(true)
                .addChoices(
                    {name: 'White', value: 'White'},
                    {name: 'Yellow', value: 'Yellow'},
                    {name: 'Orange', value: 'Orange'},
                    {name: 'Green', value: 'Green'},
                    {name: 'Blue', value: 'Blue'},
                    {name: 'Purple', value: 'Purple'},
                    {name: 'Brown', value: 'Brown'},
                    {name: 'Red', value: 'Red'},
                    {name: 'Black', value: 'Black'}
                )),

    async execute(interaction) {
        const {user: {username, discriminator}, options} = interaction
        const requestor = `${username}#${discriminator}`
        const belt = options.getString('belt')

        console.log(`${dayjs().toISOString()} Processing command: /requirements belt=${belt} requestor=${requestor}`)

        const markdown = await getData(belt.toLowerCase())
        const content = `**Belt Requirements for ${belt} Belt**\n\n${markdown}\nRead More: https://lpubelts.com/?id=beltreqs&tab=${belt}`
        await interaction.reply({content, ephemeral: true})
    }
}
