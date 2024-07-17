const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes, Partials, Events } = require('discord.js');
const noblox = require('noblox.js');

// Replace with your bot token and Roblox credentials
const DISCORD_TOKEN = process.env.TOKEN;;
const ROBLOX_COOKIE = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_BB657603E793A1D40BD6C7F253D9457397582560DF3B44B0CEC1FC7E9C74D3EB249B0750D53118124B7876B2ACAB30B4D54DD87F75BF9D83F9074A375036598A36150FE60547384AFF9CA8F364FD937B3164D45AF958BBCF624B7347C2F38884A418FDE35CD1CFDE0203BB26B28FE3530B9BB60DE9EE333BAFABD5BA257A046963770E74C6C67024837019FF127F6A079DB0B09EC1963211049CE44DA6E4D34B1437781D7650520E98C73278F4F31BD54D3993CD1E97F5847A9BDBCAA73A3E7320510C40A1E14710FA5D37C39CACD6D4691804CC0F67C2C10E5B4A1FA2C4404609868980AA5D07CCCE5023E18F4E5973D3C931F274C6C3825F4EEE1617EFDA785280127CA67BBFB57C07D8A3AB2FB9CD14A93CB84CB2034F9CE506D257BD4C6E525F2645D079BA5A4F2B3CA81457BB34A410DF85ECC2D53C9F14D7D0217CDCCBBDCDE95B51DDB76F172FC329E1C2825ACDF3391255CD5D554D4D174E535364ACA17112EA3311C5C7565BD48A03722EEB1E93DC10162DF1337C45EE282EFC90A2CAE6D825255481BE0CCBE685EEC7E5A3CAE5E147356DF829834B78614C370338051ABA777FFCF6D02EA3F10808F91AFC45872429526E599ECCB9F1A61EDC7AB549ADBDE82A386716CB30355627F18D93F867D4C293A035676245620E79AAD96ADF111CD41D1F549DB5137702734A1A62EA90170EF6711A701FE66336D1457E0EE38E79F12D830379E0853BFC7361CF1C954553469678392BF9063F079606E8A4E0E61E7969B0C9BAF8DEE95104A02FA7D98C4F2D28A5FB697AE4AF753FD14350BE5C0B596415DDBC39D5F70929A178261752DAAA9C60BAC151A4739AAC24E0BB5370C309DFA8CC1E20F6BBBBCA68479C557D3DD709B997DD3CC1DAFFF101F0D1D5A321BE8BEDDFED987021743DDCF45214DF82B6D195857D841560865C59D8611CFFDE16F23A9360042829E73C306E21534575B36186DC3CD7B1A6B6D1AE3B12CBB699A24332805A0E0E0F99B54A7E68AC73636D83928371A0313118061F4BFEBE41F838C0477FB8EEE41AA983EA156513D24D417A4E932F35BB7FC84013B266A266864F';
const TARGET_CHANNEL_ID = '1263122231450664980';
const GROUP_ID = 9407655;
const CLIENT_ID = '1263159926520418365'; // Your Discord bot client ID
const GUILD_ID = '1245456364969398313'; // Your Discord server (guild) ID

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setPresence({
        activities: [{ name: 'insert your status here' }],
        status: 'online',
    });

    try {
        await noblox.setCookie(ROBLOX_COOKIE); // Login to Roblox with cookie
        console.log('Logged in to Roblox');
    } catch (error) {
        console.error('Failed to login to Roblox:', error);
    }

    const commands = [
        {
            name: 'request',
            description: 'Request to join the Roblox group',
            options: [
                {
                    name: 'robloxuser',
                    type: 3, // STRING type
                    description: 'The Roblox username of the user',
                    required: true,
                },
                {
                    name: 'reason',
                    type: 3, // STRING type
                    description: 'How did you find the league',
                    required: true,
                },
            ],
        },
    ];

    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'request') {
        const robloxUser = interaction.options.getString('robloxuser');
        const reason = interaction.options.getString('reason');

        const embed = new EmbedBuilder()
            .setTitle('Join Request')
            .setDescription(`${interaction.user} has requested to join the league as ${robloxUser} for the following reason:\n\n${reason}`)
            .setColor('#3498db');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('accept')
                    .setLabel('Accept')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('reject')
                    .setLabel('Reject')
                    .setStyle(ButtonStyle.Danger),
            );

        const targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
        const message = await targetChannel.send({ embeds: [embed], components: [row] });

        await interaction.reply({ content: 'Your request has been submitted.', ephemeral: true });

        const filter = i => ['accept', 'reject'].includes(i.customId) && i.message.id === message.id;
        const collector = message.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'accept') {
                try {
                    const userId = await noblox.getIdFromUsername(robloxUser);
                    const joinRequests = await noblox.getJoinRequests(GROUP_ID);
                    const joinRequest = joinRequests.data.find(req => req.requester.userId === userId);

                    if (joinRequest) {
                        await noblox.acceptJoinRequest(GROUP_ID, userId);
                        await i.update({ content: `Request for ${robloxUser} has been accepted.`, components: [] });
                        await interaction.user.send(`Your request to join the league as ${robloxUser} has been accepted.`);
                    } else {
                        await i.update({ content: `No pending join request found for ${robloxUser}.`, components: [] });
                    }
                } catch (error) {
                    console.error('Failed to accept join request:', error);
                    await i.update({ content: 'Failed to accept the request.', components: [] });
                }
            } else if (i.customId === 'reject') {
                await i.update({ content: `Request for ${robloxUser} has been rejected.`, components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'No action was taken.', components: [] });
            }
        });
    }
});

client.login(DISCORD_TOKEN);
