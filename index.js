const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const https = require('https');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = "1530305066593161346";

const app = express();
app.use(express.json());

client.once('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag} !`);
});

// Fonction pour récupérer les données de l'API Roblox proprement
function getRobloxUser(userId) {
    return new Promise((resolve) => {
        https.get(`https://users.roblox.com/v1/users/${userId}`, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => {
            resolve(null);
        });
    });
}

// Route appelée par Roblox
app.post('/log-player', async (req, res) => {
    const { username, userId } = req.body;
    
    if (!username) {
        return res.status(400).send({ error: "Nom d'utilisateur manquant" });
    }

    try {
        let creationDateFormatted = "Inconnue";
        let ageString = "Inconnue";

        const userData = await getRobloxUser(userId);
        if (userData && userData.created) {
            const createdDate = new Date(userData.created);
            const now = new Date();

            creationDateFormatted = createdDate.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            let years = now.getFullYear() - createdDate.getFullYear();
            let months = now.getMonth() - createdDate.getMonth();
            let days = now.getDate() - createdDate.getDate();

            if (days < 0) {
                months--;
                const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                days += prevMonth.getDate();
            }

            if (months < 0) {
                years--;
                months += 12;
            }

            ageString = `${years} ans, ${months} mois, ${days} jours`;
        }

        const channel = await client.channels.fetch(CHANNEL_ID);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('🟩 Nouveau joueur connecté')
                .setDescription(`**${username}** vient de rejoindre la partie !`)
                .addFields(
                    { name: '👤 ID', value: `${userId}`, inline: true },
                    { name: '📅 Compte créé le', value: `${creationDateFormatted}`, inline: true },
                    { name: '⏳ Ancienneté du compte', value: `${ageString}`, inline: false }
                )
                .setFooter({ text: 'Système de logs Roblox' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            res.status(200).send({ success: true });
        } else {
            res.status(404).send({ error: "Salon introuvable" });
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi :", error);
        res.status(500).send({ error: "Erreur interne" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur de log en écoute sur le port ${PORT}`);
});

client.login(TOKEN);
