const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const https = require('https');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.DISCORD_TOKEN;

// IDs de tes différents salons Discord
const CHANNEL_ID_PLAYERS = "1530305066593161346"; // Salon des connexions de joueurs
const CHANNEL_ID_INTRUSION = "1530600211976818828"; // Salon des alertes régie
const CHANNEL_ID_SPECTACLE = "1530603678531059923"; // Salon des arrivées de spectacles

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

// 1. Route existante : Connexion des joueurs
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

        const channel = await client.channels.fetch(CHANNEL_ID_PLAYERS);
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

// 2. Nouvelle route : Intrusion en Régie
app.post('/log-intrusion', async (req, res) => {
    const { username, userId, details } = req.body;

    if (!username) {
        return res.status(400).send({ error: "Nom d'utilisateur manquant" });
    }

    try {
        const channel = await client.channels.fetch(CHANNEL_ID_INTRUSION);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor(0xED4245) // Rouge
                .setTitle('🚨 ALERTE : INTRUSION RÉGIE')
                .setDescription(`**${username}** a tenté d'accéder à une zone restreinte !`)
                .addFields(
                    { name: '👤 ID', value: `${userId || 'Inconnu'}`, inline: true },
                    { name: '⚠️ Détails', value: `${details || 'Tentative d\'accès non autorisée'}`, inline: false }
                )
                .setFooter({ text: 'Sécurité Régie - DreamShow Resort' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            res.status(200).send({ success: true });
        } else {
            res.status(404).send({ error: "Salon d'intrusion introuvable" });
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'intrusion :", error);
        res.status(500).send({ error: "Erreur interne" });
    }
});

// 3. Nouvelle route : Arrivée / Lancement de Spectacle
app.post('/log-spectacle', async (req, res) => {
    const { titreSpectacle, responsable } = req.body;

    if (!titreSpectacle) {
        return res.status(400).send({ error: "Titre du spectacle manquant" });
    }

    try {
        const channel = await client.channels.fetch(CHANNEL_ID_SPECTACLE);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor(0xFEE75C) // Jaune
                .setTitle('🎭 LANCEMENT DE SPECTACLE')
                .setDescription(`Le spectacle **${titreSpectacle}** vient d'être lancé !`)
                .addFields(
                    { name: '👑 Responsable / Lancé par', value: `${responsable || 'Inconnu'}`, inline: true }
                )
                .setFooter({ text: 'Gestion des Spectacles - DreamShow Resort' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            res.status(200).send({ success: true });
        } else {
            res.status(404).send({ error: "Salon de spectacle introuvable" });
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi du spectacle :", error);
        res.status(500).send({ error: "Erreur interne" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur de log en écoute sur le port ${PORT}`);
});

client.login(TOKEN);
