# Simple Ticket Bot『 🎟️ 』

_Un bot sencillo para crear tickets mediante reacción dedicado a la comunidad de habla hispana. Para todo aquel que quiera aprender o incluso enseñarme a mi._

## ¡Caracteristicas! 🚀
* Compatible con MySQL y JSON.
* Rápido y sencillo.
* Fácil de configurar.
* Bastante personalizable sin necesidad de saber mucho de programación.

## Requisitos 📋
Necesitaras estos programas para poder iniciar correctamente tu bot.

[Git](https://git-scm.com/) - Para clonar el código.
[NodeJS](https://nodejs.org/es/) - Ejecutar el código.

[Aplicacion / Bot](https://www.portalmybot.com/guia/mybot/cuenta-discord) - El bot donde se ejecutara el código.

## Instalacion 🤖
Recomiendo que sigan la instalación paso a paso para evitar errores.

Primero clonamos el repositorio con ayuda de git.
```
git clone https://github.com/OnlyDeeent/SimpleTicketBot.git
```
Luego entramos al proyecto con un comando de consola.
```
cd SimpleTicketBot
```
Por ultimo instalamos los paquetes de npm.
```
npm install
```

### Configuracion ⚙️
Antes de iniciar su bot asegúrese de configurar completamente el config.json, dejo una pequeña instrucción de que es cada uno.

- **token** - El token de su bot de discord (Recomiendo almacenar este y los datos de mysql en variables de entorno)

- **use_mysql** - Aquí puede elegir MySQL o JSON (true/false)
- **mysql** - En esta sección deberá poner los datos de su base de datos si es que utiliza MySQL.
- **mysql.database** - Si ya tienes una base de datos creada puedes poner el nombre de esta aquí, sino el bot creara una con el nombre que se le asigne.

- **data** - En esta sección Irán los datos necesarios para iniciar su bot.
- **data.channel_id** - La id del canal donde esta el mensaje para crear tickets.
- **data.message_id** - La id del mensaje para crear tickets.
- **data.parent_id** - La id de la sección donde quieres que vallan los tickets.
- **data.roles_ticket** - Aquí debe poner los roles que quiere que puedan ver los tickets creados.

También puede guiarse por el config.example.json.

### Inicio 🖥️
Por ultimo deberá ejecutar el comando de node.
```
npm start
```

## Soporte y Contacto 🤵
Puedes añadirme a discord si tienes alguna duda o quieres comentarme algo.
𝗢𝗻𝗹𝘆𝗦𝗼𝘆𝗼☯#0514

## Licencia 📄

Este proyecto está bajo la Licencia **MIT** - mira el archivo [LICENSE.md](LICENSE.md) para mas detalles.

---
👾 con amor por OnlyDeeent (Soyo) 👾