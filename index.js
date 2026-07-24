const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.DISCORD_TOKEN;

const CHANNEL_ID = "1530305066593161346"
;

const app = express();
app.use(express.json());

client.once('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag} !`);
});

// Route appelée par Roblox
app.post('/log-player', async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).send({ error: "Message manquant" });
    }

    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (channel) {
            await channel.send(message);
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