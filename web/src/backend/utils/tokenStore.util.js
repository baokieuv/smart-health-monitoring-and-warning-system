class TokenStore {
    constructor() {
        this.refreshTokens = new Map();
        this.thingsBoardTokens = new Map();
    }

    saveRefreshToken(tokenId, userId, expiresAt) {
        if (!tokenId || !userId) return;
        this.refreshTokens.set(tokenId, { userId, expiresAt });
    }

    findRefreshToken(tokenId) {
        const entry = this.refreshTokens.get(tokenId);
        if (!entry) return null;
        
        if (entry.expiresAt && entry.expiresAt <= Date.now()) {
            this.refreshTokens.delete(tokenId);
            return null;
        }
        return entry;
    }

    deleteRefreshToken(tokenId) {
        this.refreshTokens.delete(tokenId);
    }

    revokeTokensByUser(userId) {
        for (const [tokenId, entry] of this.refreshTokens.entries()) {
            if (entry.userId === userId) {
                this.refreshTokens.delete(tokenId);
            }
        }
    }

    clearExpiredTokens() {
        for (const [tokenId, entry] of this.refreshTokens.entries()) {
            if (entry.expiresAt && entry.expiresAt <= Date.now()) {
                this.refreshTokens.delete(tokenId);
            }
        }
    }

    saveThingsBoardToken(userId, token, expiresAt) {
        if (!token || !userId) return;
        this.thingsBoardTokens.set(userId, { token, expiresAt });
    }

    findThingsBoardToken(userId) {
        const entry = this.thingsBoardTokens.get(userId);
        if (!entry) return null;
        
        if (entry.expiresAt && entry.expiresAt <= Date.now()) {
            this.thingsBoardTokens.delete(userId);
            return null;
        }
        return entry.token;
    }

    deleteThingsBoardToken(userId) {
        this.thingsBoardTokens.delete(userId);
    }

    clearExpiredThingsBoardTokens() {
        for (const [userId, entry] of this.thingsBoardTokens.entries()) {
            if (entry.expiresAt && entry.expiresAt <= Date.now()) {
                this.thingsBoardTokens.delete(userId);
            }
        }
    }
}

module.exports = new TokenStore();