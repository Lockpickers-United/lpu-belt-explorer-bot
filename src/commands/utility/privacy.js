const {SlashCommandBuilder, EmbedBuilder, MessageFlags} = require('discord.js')
const {allGuilds} = require('../../util/approvedChannels.js')
const fs = require('fs')
const path = require('path')

//const privacyPolicyMd = require('../../util/lockyPrivacyPolicy.md')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('privacy')
        .setDescription('View our Privacy Policy'),

    async execute(interaction) {

        if (interaction.user.bot) return

        if (!allGuilds.includes(interaction.guildId)) {
            console.log('Not in an active guild')
            await interaction.editReply({content: 'Not in an active guild.'})
            return
        }

        const filePath = path.join(__dirname, '../../util/lockyPrivacyPolicy.md');
        const markdownContent = fs.readFileSync(filePath, 'utf-8');

        if (markdownContent.length > 4000) {
            console.error("Error: The markdown file exceeds Discord's 4,000 character description limit.")
            return
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setDescription(markdownContent)

        await interaction.reply({embeds: [embed], flags: [MessageFlags.Ephemeral]})

    }
}
