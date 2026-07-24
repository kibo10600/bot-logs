const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');

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

// Route appelée par Roblox
app.post('/log-player', async (req, res) => {
    const { username, userId, accountAge } = req.body;
    
    if (!username) {
        return res.status(400).send({ error: "Nom d'utilisateur manquant" });
    }

    try {
        // Récupérer la vraie date de création via l'API publique de Roblox
        let creationDateFormatted = "Inconnue";
        try {
            const response = await fetch(`https://users.roblox.com/v1/users/${userId}`);
            const userData = await response.json();
            if (userData && userData.created) {
                const dateObj = new Date(userData.created);
                creationDateFormatted = dateObj.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
        } catch (e) {
            console.error("Erreur lors de la récupération de la date Roblox :", e);
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
                    { name: '⏳ Ancienneté du compte', value: `${accountAge}`, inline: false }
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
