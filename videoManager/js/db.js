g_db.init({
    db_class:  require('../database.js'),
    table_sqlite: `
        CREATE TABLE IF NOT EXISTS videos(
         id      INTEGER PRIMARY KEY AUTOINCREMENT,
         folder TEXT,
         file TEXT,
         json   TEXT,
         date   INTEGER,
         birthtime INTEGER,
         size   INTEGER,
         deleted BOOLEAN,
         md5    CHAR(32)           NOT NULL
     );

     CREATE TABLE IF NOT EXISTS clips(
         id      INTEGER PRIMARY KEY AUTOINCREMENT,
         tags   TEXT,
         folders TEXT,
         json   TEXT,
         date   INTEGER,
         birthtime INTEGER,
         size   INTEGER,
         score  TINYINT,
         desc   TEXT,
         link   TEXT,
         ext   CHAR,
         deleted BOOLEAN,
         title   VARCHAR(256),
         md5    CHAR(32)           NOT NULL
     );

     `,
    init() {
        g_action.registerAction({
          
        })
    },
   
})