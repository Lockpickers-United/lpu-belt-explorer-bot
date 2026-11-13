const {Events} = require('discord.js')
const {syncAwardsFromChannel, lpuGuildId, beltRequestsChannelId, adminAuthorId, allBotIds} = require('../util/beltAwards.js')

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.guildId === lpuGuildId && 
            message.channelId === beltRequestsChannelId &&
            allBotIds.includes(String(message.author.id))) {
            await syncAwardsFromChannel(message.channel, false, 'prod')
        }

        if (!message.guildId && String(message.author.id) === adminAuthorId) {
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
                case 'fill in prod':
                    console.log(`running command ${message.content}...`)
                    await syncAwardsFromChannel(beltChan, false, 'prod', '1570102220345708661', '1568345354041163958')
                    console.log('done.')
                    break
            }
        }
    }
}
