const fs = require('fs')
const admin = require('firebase-admin')
const {getFirestore, Timestamp} = require('firebase-admin/firestore')

const serviceAccount = JSON.parse(fs.readFileSync('../keys/lpu-belt-explorer-firebase-adminsdk.json'))
const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://lpu-belt-explorer.firebaseio.com'
})
let db = getFirestore(app, 'lpubelts-dev')

function setDBEnvironment(environment) {
    db = getFirestore(app, environment === 'prod' ? '(default)' : 'lpubelts-dev')
}

const lpuGuildId = '140129091796992000'
const beltRequestsChannelId = '282173282546089985'
const lpuBeltBotId = '541073446839517194'
const adminAuthorId = '1046777741963440178'
const modIds = [
    '97475530953068544',
    '352428596461043713',
    '164126373588238337',
    '458324127477137418',
    '539288580758175744',
    '274252922647216129'
]
const beltFlairRegexp = /<:(white|yellow|orange|green|blue|purple|brown|red|black)belt:\d+>/
const beltTextRegexp = /[cC]ongrat.*([wW]hite|[yY]ellow|[oO]range|[gG]reen|[bB]lue|[pP]urple|[bB]rown|[rR]ed|[bB]lack) [bB]elt/
const autoBotRegexp = /<@!?(\d+)>, <@!?(\d+)> has reviewed and approved your request\. Congrats on your ([^!]+)!/
const bookmarksDocId = '00000_BOOKMARKS'

const WRITE_TO_DB = true
const DEBUG = true
const BATCH_SIZE = 100
const SINGLE_BATCH = false

async function syncAwardsFromChannel(beltChan, backfill, environment) {
    setDBEnvironment(environment)
    let scanningCompleted = false
    const bookDoc = await db.collection('awards-discord').doc(bookmarksDocId).get()
    let bookmarks = bookDoc.data() || {}
    let before = backfill ? bookmarks.earliestMessageId : null
    let after = backfill ? null : bookmarks.latestMessageId
    let impactedDiscordIds = []

    while (!scanningCompleted) {
        // If after specified, then fetch starts from oldest message, otherwise latest
        const batchMessages = await beltChan.messages.fetch({limit: BATCH_SIZE, before: before, after: after})
        const keys = [...batchMessages.keys()]
        const batchDB = db.batch()

        let awards = []
        for (let idx=0; idx < keys.length; idx++) {
            const newAwards = await findAwardsInMessage(batchMessages.get(keys[idx]), beltChan.messages, backfill)
            if (newAwards) {
                awards.push(newAwards.map(awd => {
                    const awardRef = db.collection('awards-discord').doc()
                    let createdAt = new Date(0)
                    createdAt.setUTCSeconds(awd.message.createdTimestamp/1000)
                    const rec = {
                        discordUserId: awd.picker,
                        discordAwardName: awd.name,
                        awardUrl: `https://discord.com/channels/${lpuGuildId}/${beltRequestsChannelId}/${awd.message.id}`,
                        awardCreatedAt: Timestamp.fromMillis(awd.message.createdTimestamp)
                    }
                    impactedDiscordIds.push(awd.picker)
                    batchDB.set(awardRef, rec)
                    return {...rec, messageId: awd.message.id, createdStr: createdAt.toUTCString()}
                }))
            }
        }
        awards = awards.flat()
        awards.forEach(aw => {
            if (DEBUG) {
                console.log(`${aw.messageId}, ${aw.createdStr}, ${aw.discordUserId}, ${aw.discordAwardName}, ${aw.awardUrl}`)
            }
        })

        const batchEndpoints = batchMessages.reduce((acc, msg) => {
            if (!acc.earliestMessageId || msg.createdTimestamp <= acc.earliestTimeMs) {
                acc.earliestMessageId = msg.id
                acc.earliestTimeMs = msg.createdTimestamp
            }
            if (!acc.latestMessageId || msg.createdTimestamp > acc.latestTimeMs) {
                acc.latestMessageId = msg.id
                acc.latestTimeMs = msg.createdTimestamp
            }
            return acc
        }, {})
        if (backfill) {
            before = batchEndpoints.earliestMessageId || before
        } else {
            after = batchEndpoints.latestMessageId || after
        }
        if (batchEndpoints.earliestMessageId && (!bookmarks.earliestMessageId || batchEndpoints.earliestTimeMs < bookmarks.earliestTimeMs)) {
            bookmarks.earliestMessageId = batchEndpoints.earliestMessageId
            bookmarks.earliestTimeMs = batchEndpoints.earliestTimeMs
        }
        if (batchEndpoints.latestMessageId && (!bookmarks.latestMessageId || batchEndpoints.latestTimeMs > bookmarks.latestTimeMs)) {
            bookmarks.latestMessageId = batchEndpoints.latestMessageId
            bookmarks.latestTimeMs = batchEndpoints.latestTimeMs
        }
        if (WRITE_TO_DB && awards.length > 0) {
            await batchDB.commit()
            await db.collection('awards-discord').doc(bookmarksDocId).set(bookmarks)
        }
        if (SINGLE_BATCH || batchMessages.size < BATCH_SIZE) {
            scanningCompleted = true
        }
    }

    if (!backfill) {
        let cacheKeys = []
        const uniqIds = [...new Set(impactedDiscordIds)]
        for (let idx=0; idx < uniqIds.length; idx++) {
            const userDocs = await db.collection('lockcollections').where('discordId', '==', uniqIds[idx]).get()
            userDocs.forEach(rec => cacheKeys.push(`activity: userId == ${rec.id}`))
        }
        if (DEBUG) {
            cacheKeys.forEach(key => console.log(`query-cache clear ${key}`))
        }
        const cacheBatch = db.batch()
        cacheKeys.forEach(key => cacheBatch.delete(db.collection('query-cache').doc(key)))
        if (WRITE_TO_DB && cacheKeys.length > 0) {
            await cacheBatch.commit()
        }
    }
}

async function findAwardsInMessage(message, msgManager, backfill) {
    if (message.author.id === lpuBeltBotId) {
        const botMatch = message.content.match(autoBotRegexp)
        if (botMatch) {
            return [{picker: botMatch[1], name: botMatch[3], message: message}]
        }
    } else if (backfill && modIds.includes(message.author.id)) {
        let refMsg = null
        if (message.reference && message.reference.channelId === beltRequestsChannelId) {
            try {
                refMsg = await msgManager.fetch(message.reference.messageId)
            } catch(err) {
                // ignore
            }
        }
        const multiPickMatch = message.content.match(/<@!?(\d+)>[\s\S]*<@!?(\d+)>/)

        if (multiPickMatch) {
            const batchAwards = message.content.split("\n").map(line => {
                const beltMatch = line.match(beltFlairRegexp) || line.match(beltTextRegexp)
                const singlePickMatch = line.match(/<@!?(\d+)>/)
                if (beltMatch) {
                    const awardName = beltMatch[1].charAt(0).toUpperCase() + beltMatch[1].slice(1) + ' Belt'
                    if (singlePickMatch) {
                        return {picker: singlePickMatch[1], name: awardName, message: message}
                    } else {
                        return null
                    }
                } else {
                    return null
                }
            }).filter(x => !!x)
            if (batchAwards.length > 0) {
                return batchAwards
            }
        } else {
            const singlePickMatch = message.content.match(/<@!?(\d+)>/)
            if (singlePickMatch || refMsg) {
                const pickerId = singlePickMatch ? singlePickMatch[1] : refMsg.author.id
                const beltMatch = message.content.match(beltFlairRegexp) || message.content.match(beltTextRegexp)
                if (beltMatch) {
                    const awardName = beltMatch[1].charAt(0).toUpperCase() + beltMatch[1].slice(1) + ' Belt'
                    return [{picker: pickerId, name: awardName, message: message}]
                }
            } 
        }
    }
    return null
}

module.exports = {syncAwardsFromChannel, lpuGuildId, beltRequestsChannelId, adminAuthorId, lpuBeltBotId}
