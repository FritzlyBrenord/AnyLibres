
const fs = require('fs');
const path = require('path');

// Chemin vers le fichier translations.ts
const TRANSLATIONS_PATH = path.join(__dirname, '../src/i18n/translations.ts');
const OUTPUT_BASE = path.join(__dirname, '../src/i18n/locals');

// Lecture du fichier brut
const fileContent = fs.readFileSync(TRANSLATIONS_PATH, 'utf8');

// Extraction de l'objet translations "à la brute" pour éviter les problèmes d'import TS
// On cherche ce qui est entre "export const translations = {" et la dernière accolade fermante
const startIndex = fileContent.indexOf('export const translations = {');
if (startIndex === -1) {
    console.error("Impossible de trouver 'export const translations = {'");
    process.exit(1);
}

const contentAfterExport = fileContent.substring(startIndex + 'export const translations = '.length);
// Évaluation sécurisée (on suppose que le fichier est valide JS/TS)
// On remplace les types TS pour que ça soit valide JS si nécessaire (ici c'est des objets simples)
// On utilise `eval` dans un contexte isolé ou via `vm` serait mieux, mais pour un script one-shot:
let translations;
try {
    // Petit hack: on enveloppe dans une parenthèse pour evaluer l'expression objet
    // On doit nettoyer un peu si y'a du typage TS complexe, mais translations.ts semble être des objets purs.
    // Attention aux commentaires qui pourraient casser eval si on ne fait pas gaffe.
    // Une approche plus robuste: Regex pour extraire chaque langue.

    // Approche Regex par langue pour plus de sécurité
    translations = {};
    const languages = ['fr', 'en', 'es'];

    // Fonction helper pour extraire le contenu d'un bloc {} équilibré
    function extractBlock(source, startKeyword) {
        const startIdx = source.indexOf(startKeyword);
        if (startIdx === -1) return null;

        let openCount = 0;
        let startBlock = -1;
        let endBlock = -1;

        // On cherche la première accolade ouvrante après startKeyword
        for (let i = startIdx; i < source.length; i++) {
            if (source[i] === '{') {
                if (openCount === 0) startBlock = i;
                openCount++;
            } else if (source[i] === '}') {
                openCount--;
                if (openCount === 0 && startBlock !== -1) {
                    endBlock = i + 1;
                    break;
                }
            }
        }

        if (startBlock !== -1 && endBlock !== -1) {
            // On retourne le contenu de l'objet (sans les accolades extérieures si on veut juste les props, 
            // mais ici on veut evaluer l'objet complet)
            const blockContent = source.substring(startBlock, endBlock);
            try {
                // On utilise new Function pour évaluer l'objet retourné
                return new Function(`return ${blockContent}`)();
            } catch (e) {
                console.error(`Erreur eval pour ${startKeyword}:`, e);
                return null;
            }
        }
        return null;
    }

    // On extrait chaque langue
    languages.forEach(lang => {
        // Regex un peu loose: 'fr: {' ou "fr": {
        const regex = new RegExp(`\\b${lang}\\s*:\\s*\\{`);
        const match = fileContent.match(regex);
        if (match) {
            // Trouver l'index de match
            const idx = match.index;
            // Chercher l'accolade ouvrante
            const openBraceIdx = fileContent.indexOf('{', idx);

            let openCount = 1;
            let endBlock = -1;

            for (let i = openBraceIdx + 1; i < fileContent.length; i++) {
                if (fileContent[i] === '{') openCount++;
                else if (fileContent[i] === '}') openCount--;

                if (openCount === 0) {
                    endBlock = i + 1;
                    break;
                }
            }

            if (endBlock !== -1) {
                const block = fileContent.substring(openBraceIdx, endBlock);
                try {
                    translations[lang] = new Function(`return ${block}`)();
                } catch (e) {
                    console.error(`Erreur parsing ${lang}`, e);
                }
            }
        }
    });

} catch (err) {
    console.error("Erreur globale:", err);
    process.exit(1);
}

// Logique de dispatch par rôle
const MODULE_MAPPING = {
    client: [
        'navigation', 'home', 'service', 'serviceDetail', 'pricing',
        'reviews', 'similar', 'common', 'translation', 'serviceCard',
        'explorer', 'about', 'searchPage', 'auth', 'favorites',
        'messages', 'notifications', 'mediation', 'orders', 'profile', 'insights'
    ],
    provider: ['provider', 'providerProfile', 'providerAccueil', 'providerForm'],
    admin: ['admin']
};

// Maps specific keys to specific files inside Client
const CLIENT_FILE_MAPPING = {
    'navigation': 'navigation.ts',
    'common': 'common.ts',
    // Tout le reste va dans index.ts du client
};

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function generateTSFile(contentObj, filename) {
    // Génère le contenu du fichier TS
    // On doit sérialiser l'objet en JSON mais sans les quotes autour des clés si possible (prettier style)
    // Pour simplifier, JSON.stringify est ok, mais on peut embellir

    // Mais attendez, on veut des exports nommés !
    // Si c'est index.ts qui regroupe plusieurs clés: export const key = { ... }

    let fileBody = '';

    // Si l'objet contient plusieurs clés racines (ex: Client/index.ts -> home, auth...)
    // On exporte chaque clé séparément
    for (const [key, value] of Object.entries(contentObj)) {
        fileBody += `export const ${key} = ${JSON.stringify(value, null, 2)};\n\n`;
    }

    return fileBody;
}

// Traitement
['fr', 'en', 'es'].forEach(lang => {
    const langData = translations[lang];
    if (!langData) {
        console.error(`Pas de données pour ${lang}`);
        return;
    }

    const baseLangPath = path.join(OUTPUT_BASE, lang);
    ensureDir(baseLangPath);

    // Client
    const clientPath = path.join(baseLangPath, 'Client');
    ensureDir(clientPath);

    const clientIndexData = {};

    MODULE_MAPPING.client.forEach(key => {
        if (!langData[key]) return;

        if (CLIENT_FILE_MAPPING[key]) {
            // Fichier spécifique (navigation.ts, common.ts)
            // Pour ces fichiers, on exporte l'objet directement: export const navigation = { ... }
            const content = generateTSFile({ [key]: langData[key] }, '');
            fs.writeFileSync(path.join(clientPath, CLIENT_FILE_MAPPING[key]), content);
            console.log(`Généré: ${lang}/Client/${CLIENT_FILE_MAPPING[key]}`);
        } else {
            // Accumuler pour index.ts
            clientIndexData[key] = langData[key];
        }
    });

    // Générer Client/index.ts
    // Il doit aussi exporter ce qui vient de navigation.ts et common.ts
    let clientIndexContent = '';

    // Imports/Exports des fichiers séparés
    Object.values(CLIENT_FILE_MAPPING).forEach(file => {
        const importName = file.replace('.ts', '');
        clientIndexContent += `export * from './${importName}';\n`;
    });

    // Contenu "inline"
    clientIndexContent += generateTSFile(clientIndexData, '');

    fs.writeFileSync(path.join(clientPath, 'index.ts'), clientIndexContent);
    console.log(`Généré: ${lang}/Client/index.ts`);

    // Provider
    const providerPath = path.join(baseLangPath, 'Provider');
    ensureDir(providerPath);
    const providerData = {};
    MODULE_MAPPING.provider.forEach(key => {
        if (langData[key]) providerData[key] = langData[key];
    });
    fs.writeFileSync(path.join(providerPath, 'index.ts'), generateTSFile(providerData, ''));
    console.log(`Généré: ${lang}/Provider/index.ts`);

    // Admin
    const adminPath = path.join(baseLangPath, 'Admin');
    ensureDir(adminPath);
    const adminData = {};
    MODULE_MAPPING.admin.forEach(key => {
        if (langData[key]) adminData[key] = langData[key];
    });
    fs.writeFileSync(path.join(adminPath, 'index.ts'), generateTSFile(adminData, ''));
    console.log(`Généré: ${lang}/Admin/index.ts`);

    // Lang Root Index (fr/index.ts)
    // Il doit exporter Client, Provider, Admin comme un seul objet plat ou imbriqué ??
    // L'objectif est: export const fr = { navigation: ..., admin: ..., provider: ... }
    // Donc on doit importer et réassembler.

    const langIndexContent = `
import * as Client from './Client';
import * as Provider from './Provider';
import * as Admin from './Admin';

export const ${lang} = {
  ...Client,
  ...Provider,
  ...Admin
};
`;
    fs.writeFileSync(path.join(baseLangPath, 'index.ts'), langIndexContent);
    console.log(`Généré: ${lang}/index.ts`);
});

console.log('Migration terminée !');
