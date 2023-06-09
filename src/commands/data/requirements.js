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
                    {name: 'White', value: 'white'},
                    {name: 'Yellow', value: 'yellow'},
                    {name: 'Orange', value: 'orange'},
                    {name: 'Green', value: 'green'},
                    {name: 'Blue', value: 'blue'},
                    {name: 'Purple', value: 'purple'},
                    {name: 'Brown', value: 'brown'},
                    {name: 'Red', value: 'red'},
                    {name: 'Black', value: 'black'},
                    {name: 'Epic Quests', value: 'quests'},
                )),

    async execute(interaction) {
        const {user: {username, discriminator}, options} = interaction
        const requestor = `${username}#${discriminator}`
        const belt = options.getString('belt')

        console.log(`${dayjs().toISOString()} Processing command: /requirements belt=${belt} requestor=${requestor}`)

        let content = await getData(belt)
        await interaction.reply({content, ephemeral: true})
    }
}
