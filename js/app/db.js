g_db.init({
    // db_class: require('./js/database.js'), 
    db_class: require('better-sqlite3'),
    table_sqlite: `
     CREATE TABLE IF NOT EXISTS files(
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         title VARCHAR(256),
         size INTEGER,
         date INTEGER,
         birthtime INTEGER,
         link VARCHAR(256),
         md5 CHAR(32) NOT NULL
     );

     CREATE TABLE IF NOT EXISTS config(
        key   PRIMARY KEY,
        value TEXT
     );

     CREATE TABLE IF NOT EXISTS trash(
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         title VARCHAR(256),
         size INTEGER,
         date INTEGER,
         birthtime INTEGER,
         link VARCHAR(256),
         md5 CHAR(32) NOT NULL,
         meta TEXT,
         last INTEGER
     );
     `,
    db_menu: {},

    getOption(opts) {
        return {
            readonly: opts.file.substring(0, 1).toLowerCase() == 'y',
            type: opts.type,
        }
    },

    async onFirstConnected() {
        let gid = await g_db.db_getConfig('guid')
        if (!gid){
            gid = guid()
            await g_db.db_setConfig('guid', gid)
        }
        g_db.guid = gid
    },

    init() {


    },


})