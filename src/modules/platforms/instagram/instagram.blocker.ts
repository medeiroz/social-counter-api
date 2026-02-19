// Utilitário para bloqueio de requisições por tempo determinado
// Objeto singleton para bloqueio de requisições do Instagram
export const InstagramBlocker = {
	blockUntil: null as Date | null,

	isBlocked(): boolean {
		if (!InstagramBlocker.blockUntil) return false;
		return new Date() < InstagramBlocker.blockUntil;
	},

	blockFor(minutes: number): void {
		const now = new Date();
		InstagramBlocker.blockUntil = new Date(now.getTime() + minutes * 60 * 1000);
	},

	getBlockUntil(): Date | null {
		return InstagramBlocker.blockUntil;
	},
};
