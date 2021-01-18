const Discord = require('discord.js');
const mysql = require('mysql');
const config = require("./config.json");
const fs = require('fs');
const db = require('quick.db');
const limits = new Map();

let emoji_open = "🎟️";

//Inicializar el cliente.
const client  = new Discord.Client({
    disableEveryone: false
});

//Iniciar el bot.
client.on("ready", async () => {

    console.log("---------------| Iniciando bot |---------------");

    //MySQL
    if(config.use_mysql){
        console.log("> Conectando con la database (MySQL)...\n");

        let connection;
    
        //Inicializamos la base de datos.
        await setupDatabase().then((res) => {
            connection = res;
            console.log("- Conectado correctamente a la base de datos. -\n");
        }).catch((error) => {
            console.error(error);
        });
    
        //Asignamos la base de datos al cliente, para poder utilizarlo en otros archivos.
        client.connection = connection;

        //Creacion de la tabla (si no existe).
        let tableCreate = `CREATE TABLE IF NOT EXISTS tickets (
            id_owner VARCHAR(25) NOT NULL PRIMARY KEY,
            id_channel VARCHAR(25) NOT NULL );`

        await connection.query(tableCreate, (err, result) => {
            console.log("| Verificando la tabla de tickets...\n");
            if(err) throw err;
        });

        //Informar la cantidad de tickets abiertos.
        await connection.query(`SELECT * FROM tickets`, (err, result) => {
            if(err) throw err;
            console.log(`- Tickets Abiertos [${result.length}] -\n`);
        });

    //JSON
    }else{
        console.log("> Creando el archivo (JSON)...\n");

        //Crear la tabla y asignarla a el cliente para llamarlo en otros archivos.
        var table = new db.table('tickets');
        client.connection = table;

        console.log("- Archivo de datos creado correctamente. -");

        //Informar la cantidad de tickets abiertos.
        let tickets = table.all().length;
        console.log(`- Tickets Abiertos [${tickets}] -\n`);
    }
    client.limits = limits;
    
    //Obtener el mensaje.
    let channel = client.channels.cache.get(config.data.channel_id);
    if(!channel || channel.type !== "text") {
        console.log("No se encontro el canal que esta en la configuracion.\nApagando el bot...")
        client.destroy();
    }
    let message = await channel.messages.fetch(config.data.message_id);
    if(!message) {
        console.log("No se encontro el mensaje que esta en la configuracion.\nApagando el bot...")
        client.destroy();
    }
    //Limpiar y añadir reacciones.
    await message.reactions.removeAll();
    await message.react(`${emoji_open}`);

    console.log("- Bot Encendido -")
});

//Apagando el bot.
client.on("disconnect", () => {
    console.log("---------------| Bot apagado |---------------")
});

/*
  Este evento llamara a reactionAdd.js cuando alguien reaccione.

  No utilizo messageReactionAdd porque este evento no recibe las reacciones en mensajes 
  que se encuentran en el cache.
*/

client.on('raw', async payload => {
    if(payload.t === 'MESSAGE_REACTION_ADD') {
        let guild = await client.guilds.fetch(payload.d.guild_id);
        let channel = guild.channels.cache.get(payload.d.channel_id);
        let member = await guild.members.fetch(payload.d.user_id);

        if(member.user.bot) return;

        channel.messages.fetch(payload.d.message_id)
            .then(msg => {
                try {
                    const Handler = require('./events/reactionAdd.js');
                    Handler.run(client, msg, payload.d.emoji, member);
                } catch (e) {
                    console.error(e);
                } finally {
                    delete require.cache[require.resolve('./events/reactionAdd.js')];
                }
            })
            .catch(err => console.log(err));
    }
});

//Funcion para conectar a la base de datos (MySQL)
function setupDatabase(){
    return new Promise((resolve, reject) => {
        var connection = mysql.createConnection({
            host: config.mysql.host,
            user: config.mysql.username,
            password: config.mysql.password,
        });

        connection.connect((err, result) => {
            if(err) return reject("¡Error!\nAl conectar con la base de datos.\n"+err)
        
            //Verificar la base de datos y crearla si no existe.
            let dbCreate = `CREATE DATABASE IF NOT EXISTS ${config.mysql.database}`;

            connection.query(dbCreate, (err, result) => {
                console.log(`| Verificando la base de datos ${config.mysql.database}...`)
                if(err) throw err;
            });

            //Seleccion de la base de datos.
            connection.query(`USE ${config.mysql.database}`, (err, result) => {
                if(err) throw err;
            });

            return resolve(connection);
        });   
    });
};

client.login(config.token);