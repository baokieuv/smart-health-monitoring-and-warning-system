const refreshTokens = new Map();

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
