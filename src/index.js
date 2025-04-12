// From: https://discordjs.guide/creating-your-bot/main-file.html
const fs = require('node:fs')
const path = require('node:path')

const {Client, Collection, GatewayIntentBits, Partials} = require('discord.js')
const {DISCORD_TOKEN: token} = process.env
const MONITOR_CHANNEL_ID = '282170926064336907';
const LOG_CHANNEL_ID = '1360395141822812311';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ]
})

// Log all reactions in #announcements
client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch()
        } catch (error) {
            console.error('Error fetching the reaction:', error)
            return
        }
    }
    if (reaction.message.channel.id === MONITOR_CHANNEL_ID) {
        const logMessage = `${user.tag} reacted with: ${reaction.emoji.name} on: ${reaction.message.content.split('\n')[0].substring(0, 100)}`
        const logChannel = client.channels.cache.get(LOG_CHANNEL_ID)
        if (!logChannel) {
            console.error(`Log channel with ID ${LOG_CHANNEL_ID} not found.`)
            return
        }
        logChannel.send(logMessage)
            .then(() => console.log('Logged reaction:', logMessage))
            .catch(console.error)
    }
})


client.commands = new Collection()

const foldersPath = path.join(__dirname, 'commands')
const commandFolders = fs.readdirSync(foldersPath)
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder)
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        const command = require(filePath)
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command)
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(token)
