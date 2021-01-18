'use strict';

const config = require("../config.json");

module.exports.run = async (caller, _message, _emoji, _member) => {
    const guild = await _message.guild.fetch();
    const bot = await guild.members.fetch(caller.user.id);
    const channel = await _message.channel.fetch();
    const emoji = _emoji.id !== null ? _emoji.id : _emoji.name;
    
    //Variables personalizables.
    const emoji_open = '🎟️';
    const emoji_close = '☄️';

    const welcome_message = `:wave: Bienvenido『 <@${_member.id}> 』\n\nDescribe tu problema/duda aquí..`;
    const error_message = `:warning: » <@${_member.id}> ya tienes un ticket creado.`;

    //Si el emoji es diferente de el de crear un ticket o cerrarlo no seguira ejecutandose el codigo.
    if(emoji !== emoji_open && emoji !== emoji_close) return;

    //Si el bot no tiene permisos no seguira ejecutando el codigo.
    if(!bot.permissions.has("MANAGE_CHANNELS", true)) return; 

    //Abriendo ticket.
    if(emoji === emoji_open && _message.id === config.data.message_id){

        let hasTicket = caller.connection.query !== undefined 
            ? caller.connection.query(`SELECT id_owner FROM tickets WHERE id_owner = ${_member.id}`)
            : caller.connection.all().find(ticket => ticket.data.id_owner === `${_member.id}`)

        //Si el usuario no tiene un ticket ya creado.
        if(!hasTicket){

            //Creamos el canal con una funcion y enviamos la bienvenida.
            let channel = await createChannel(guild, _member);

            let wel_msg = await channel.send(welcome_message);
            await wel_msg.react(emoji_close);

            //Establecemos los datos del ticket en la base de datos.
            if(caller.connection.query !== undefined){
                await caller.connection.query(`INSERT INTO tickets (id_owner, id_channel) values(${_member.id}, ${channel.id})`);
            }else{
                await caller.connection.set(`${channel.id}.id_owner`, `${_member.id}`);
            }

            //Removemos la reaccion del usuario.
            await _message.reactions.resolve(emoji).users.remove(_member.user);

        //Si el usuario ya tiene un ticket registrado en la base de datos.
        }else{
            //MySQL
            if(caller.connection.query !== undefined){
                checkTicketMySQL(caller, guild, _member).then(async res => {
                    //Si el canal fue eliminado creara un nuevo ticket.
                    if(!res){
                        //Creamos el canal con una funcion y enviamos la bienvenida.
                        let ch = await createChannel(guild, _member);
    
                        let well_msg = await ch.send(welcome_message);
                        await well_msg.react(emoji_close);
            
                        //Actualizar los datos de la base.
                        await caller.connection.query(`DELETE FROM tickets WHERE id_owner = ${_member.id}`);
                        await caller.connection.query(`INSERT INTO tickets (id_owner, id_channel) values(${_member.id}, ${ch.id})`);
            
                        await _message.reactions.resolve(emoji).users.remove(_member.user);

                    //Si el canal existe enviara un mensaje de error.
                    }else{
                        res.send(error_message).then(m => m.delete({ timeout: 30000 })).catch(e => console.log());;
                        await _message.reactions.resolve(emoji).users.remove(_member.user);
                    }
                }); 
                
            //JSON
            }else{
                checkTicketJSON(caller, guild, _member, _message).then(async res => {
                    //Si el canal fue eliminado creara un nuevo ticket.
                    if(res.name === false){
                        //Creamos el canal con una funcion y enviamos la bienvenida.
                        let ch = await createChannel(guild, _member);
    
                        let well_msg = await ch.send(welcome_message);
                        await well_msg.react(emoji_close);
                
                        //Actualizar los datos de la base.
                        if(res.id) await caller.connection.delete(`${res.id}`);
                        await caller.connection.set(`${ch.id}.id_owner`, `${_member.id}`);
                
                        await _message.reactions.resolve(emoji).users.remove(_member.user);
                    
                    //Si el canal existe enviara un mensaje de error.
                    }else{
                        res.send(error_message).then(m => m.delete({ timeout: 30000 })).catch(e => console.log());
                        await _message.reactions.resolve(emoji).users.remove(_member.user);
                    }
                });
            }
        }

    //Cerrando ticket
    }else if(emoji === emoji_close){

        //Comprobantes para evitar errores.
        if(channel.parentID !== config.data.parent_id) return;
        if(!_message.author.bot) return;
        if(_message.content !== welcome_message) return;

        //MySQL
        if(caller.connection.query !== undefined){
            caller.connection.query(`SELECT * FROM tickets WHERE id_channel = ${channel.id}`, async (err, result) => {
                if(err) throw err;
                if(!result[0]) return;
                //Evitar multiples peticiones para cerrar el canal.
                if(caller.limits.get(channel.id)) return channel !== undefined ? channel.send(":mailbox_closed: El ticket ya se esta cerrando...") : undefined;
                caller.limits.set(channel.id, true);
    
                channel.send(":mailbox_closed: Cerrando el ticket...");
    
                //Eliminar datos y cerrar el canal.
                await caller.connection.query(`DELETE FROM tickets WHERE id_channel = ${channel.id}`);
                await channel.delete().catch(err => console.error(err));
            });

        //JSON
        }else{
            //Evitar multiples peticiones para cerrar el canal.
            if(caller.limits.get(channel.id)) return channel !== undefined ? channel.send(":mailbox_closed: El ticket ya se esta cerrando...") : undefined;
            caller.limits.set(channel.id, true);

            channel.send(":mailbox_closed: Cerrando el ticket...");

            //Eliminar datos y cerrar el canal.
            await caller.connection.delete(`${channel.id}`);
            await channel.delete().catch(err => console.error(err));
        }
    }
    
}

//Funcion para crear el ticket.
async function createChannel(guild, member){

    let everyone = await guild.roles.cache.find(role => role.name === "@everyone");
    let roles = config.data.roles_ticket;
    let channel;

    await guild.channels.create(`🎫-${member.user.username}`, {
        type: 'text',
        parent: `${config.data.parent_id}`,
    }).then(async c => {
        //Permisos:

        //Usuario que abre el ticket
        c.overwritePermissions([
            {
                id: member.id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
            },
        ]);

        //Los posibles roles que pueden ver el canal.
        if(roles !== undefined && roles.length !== 0){
            roles.forEach(async r => {
                c.updateOverwrite(r, {
                    'VIEW_CHANNEL': true,
                    'SEND_MESSAGES': true,
                })
            });
        }
        
        //Los demas usuarios del discord no veran el canal.
        c.updateOverwrite(everyone, {
            'VIEW_CHANNEL': false,
            'SEND_MESSAGES': false,
        });
        channel = c;
    });

    return channel;
}

//Funcion para chequear si ya hay un ticket abierto. (MySQL)
async function checkTicketMySQL(caller, guild, _member){
    return new Promise((resolve, reject) => {
        caller.connection.query(`SELECT id_channel FROM tickets WHERE id_owner = ${_member.id}`, async (err, result) => {
            if(err) return console.log(err.message);

            //Averigua si el canal guardado exite y lo envia.
            if(!result.length) return resolve(false);
            
            let channel = await guild.channels.cache.get(result[0].id_channel);
            if(channel) return resolve(channel);

            return resolve(false);
        });
    })
}

//Funcion para chequear si ya hay un ticket abierto. (JSON)
async function checkTicketJSON(caller, guild, _member){
    return new Promise((resolve, reject) => {
        let query = caller.connection.all().find(ticket => ticket.data.id_owner === `${_member.id}`);

        //Averigua si el canal guardado exite y lo envia.
        if(!query) return resolve(false);

        let channel = guild.channels.cache.get(query.ID);
        if(channel) return resolve(channel);

        return resolve({name: false, id: query.ID});
    });
}