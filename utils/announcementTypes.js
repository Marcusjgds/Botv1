// utils/announcementTypes.js
const ANNOUNCEMENT_TYPES = {
	memo: {
		label: "Mémo Interne",
		color: 0x1c6e3d,
		classification: "NON CLASSIFIÉ",
		headerTag: "MÉMO INTERNE — SITE-11",
		emoji: "📋",
	},
	annonce: {
		label: "Annonce Officielle",
		color: 0xb08d2b,
		classification: "USAGE INTERNE",
		headerTag: "ANNONCE OFFICIELLE — DIRECTION SITE-11",
		emoji: "📢",
	},
	alerte: {
		label: "Alerte de Sécurité",
		color: 0xc94a2f,
		classification: "PRIORITAIRE",
		headerTag: "ALERTE DE SÉCURITÉ — SITE-11",
		emoji: "⚠️",
	},
	confidentiel: {
		label: "Document Confidentiel",
		color: 0x8b1a1a,
		classification: "NIVEAU 3 — CONFIDENTIEL",
		headerTag: "DOCUMENT CONFIDENTIEL — ACCÈS RESTREINT",
		emoji: "🔒",
	},
	urgence: {
		label: "Urgence Site",
		color: 0x1a1a1a,
		classification: "CODE NOIR",
		headerTag: "PROTOCOLE D'URGENCE ACTIVÉ",
		emoji: "🚨",
	},
};

module.exports = { ANNOUNCEMENT_TYPES };
