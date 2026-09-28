import sqliteService from '../sqlite.js';

const userCache = {
    cacheUser(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO vrcxoldsteamvr_favorite_user (id, display_name, avatar_url, added_at) VALUES (@id, @displayName, @avatarUrl, @addedAt)`,
            {
                '@id': entry.id,
                '@displayName': entry.displayName,
                '@avatarUrl': entry.avatarUrl,
                '@addedAt': new Date().toJSON()
            }
        );
    },

    async getUserCache() {
        sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS vrcxoldsteamvr_favorite_user (id TEXT PRIMARY KEY, display_name TEXT, avatar_url TEXT, added_at TEXT)`
        );
        const data = [];
        await sqliteService.execute((dbRow) => {
            data.push({
                id: dbRow[0],
                displayName: dbRow[1],
                avatarUrl: dbRow[2],
                addedAt: dbRow[3]
            });
        }, 'SELECT * FROM vrcxoldsteamvr_favorite_user');
        return data;
    },

    async getCachedUserById(id) {
        let data = null;
        await sqliteService.execute(
            (dbRow) => {
                data = {
                    id: dbRow[0],
                    displayName: dbRow[1],
                    avatarUrl: dbRow[2],
                    addedAt: dbRow[3]
                };
            },
            `SELECT * FROM vrcxoldsteamvr_favorite_user WHERE id = @id`,
            { '@id': id }
        );
        return data;
    }
};

export { userCache };
