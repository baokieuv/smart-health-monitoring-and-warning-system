const refreshTokens = new Map();
const thingsBoardTokens = new Map();

exports.saveRefreshToken = (tokenId, userId, expiresAt) => {
	if (!tokenId || !userId) {
		return;
	}
	refreshTokens.set(tokenId, { userId, expiresAt });
};

exports.findRefreshToken = (tokenId) => {
	const entry = refreshTokens.get(tokenId);
	if (!entry) {
		return null;
	}
	if (entry.expiresAt && entry.expiresAt <= Date.now()) {
		refreshTokens.delete(tokenId);
		return null;
	}
	return entry;
};

exports.deleteRefreshToken = (tokenId) => {
	refreshTokens.delete(tokenId);
};

exports.revokeTokensByUser = (userId) => {
	for (const [tokenId, entry] of refreshTokens.entries()) {
		if (entry.userId === userId) {
			refreshTokens.delete(tokenId);
		}
	}
};

exports.clearExpiredTokens = () => {
	for (const [tokenId, entry] of refreshTokens.entries()) {
		if (entry.expiresAt && entry.expiresAt <= Date.now()) {
			refreshTokens.delete(tokenId);
		}
	}
};

exports.saveThingsBoardToken = (userId, token, expiresAt) => {
	if (!token || !userId) {
		return;
	}
	thingsBoardTokens.set(userId, {token, expiresAt});
};

exports.findThingsBoardToken = (userId) => {
	const entry = thingsBoardTokens.get(userId);
	if (!entry) {
		return null;
	}
	if (entry.expiresAt && entry.expiresAt <= Date.now()) {
		thingsBoardTokens.delete(userId);
		return null;
	}
	return entry.token;
};

exports.deleteThingsBoardToken = (userId) => {
	thingsBoardTokens.delete(userId);
};

exports.clearExpiredThingsBoardTokens = () => {
	for (const [userId, entry] of thingsBoardTokens.entries()) {
		if (entry.expiresAt && entry.expiresAt <= Date.now()) {
			thingsBoardTokens.delete(userId);
		}
	}
};