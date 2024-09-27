const {Events} = require('discord.js')
const {syncAwardsFromChannel, lpuGuildId, beltRequestsChannelId, adminAuthorId, lpuBeltBotId} = require('../util/beltAwards.js')

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.guildId === lpuGuildId && 
            message.channelId === beltRequestsChannelId &&
            message.author.id === lpuBeltBotId) {
            // await syncAwardsFromChannel(message.channel, false, 'prod')
        }

        if (!message.guildId && message.author.id === adminAuthorId) {
            const lpuGuild = await message.client.guilds.fetch(lpuGuildId)
            const beltChan = await lpuGuild.channels.fetch(beltRequestsChannelId)

            switch(message.content) {
                case 'backfill dev':
                    console.log(`running command ${message.content}...`)
                    await syncAwardsFromChannel(beltChan, true, 'dev')
                    console.log('done.')
                    break
                case 'backfill prod':
                    console.log(`running command ${message.content}...`)
                    await syncAwardsFromChannel(beltChan, true, 'prod')
                    console.log('done.')
                    break
                case 'update dev':
                    console.log(`running command ${message.content}...`)
                    await syncAwardsFromChannel(beltChan, false, 'dev')
                    console.log('done.')
                    break
                case 'update prod':
                    console.log(`running command ${message.content}...`)
                    await syncAwardsFromChannel(beltChan, false, 'prod')
                    console.log('done.')
                    break
            }
        }
    }
}
