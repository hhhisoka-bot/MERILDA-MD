/**
 * Classe Events - Gestionnaire d'événements et de commandes
 * Cette classe permet de gérer un système de commandes avec des fonctionnalités avancées
 */
export default class Events {
    /**
     * Constructeur de la classe Events
     * @param {Object} options - Options de configuration
     */
    constructor(options = {}) {
        // Map pour stocker tous les événements/commandes enregistrés
        this.events = new Map();
        
        // Map pour faire le lien entre les commandes/alias et les noms d'événements
        this.functions = new Map();
        
        // Regex pour détecter les préfixes de commande (caractères spéciaux)
        this.prefix = /^[°•π÷×∆£¢€¥✓_|~!?#%^&.\/\\©^]/;
        
        // Logger pour les messages (console par défaut)
        this.logger = options.logger || console;
        
        // Catégorie par défaut pour les commandes
        this.defaultCategory = 'others';
        
        // Map pour stocker les statistiques d'utilisation des commandes
        this.commandStats = new Map();
        
        // Map pour gérer les cooldowns des commandes
        this.cooldowns = new Map();
    }

    /**
     * Méthode pour ajouter/enregistrer une nouvelle commande
     * @param {Object} eventConfig - Configuration de l'événement/commande
     * @returns {boolean} - true si ajouté avec succès, false sinon
     */
    add(eventConfig) {
        // Destructuration des paramètres avec valeurs par défaut
        const {
            name,                    // Nom(s) de la commande (array)
            command,                 // Commande(s) (array)
            category = this.defaultCategory,  // Catégorie
            run,                     // Fonction à exécuter
            limit = false,           // Limite d'utilisation
            level = 1,               // Niveau requis
            privatechat = false,     // Utilisable en privé
            query = false,           // Nécessite une requête
            register = false,        // Nécessite un enregistrement
            owner = false,           // Réservé au propriétaire
            group = false,           // Utilisable en groupe
            admin = false,           // Réservé aux admins
            botAdmin = false,        // Bot doit être admin
            
            desc = '-',              // Description
            alias = [],              // Alias de la commande
            cooldown = 5,            // Temps d'attente en secondes
            usage = '',              // Usage de la commande
            example = '',            // Exemple d'utilisation
            hidden = false,          // Commande cachée
            dependencies = []        // Dépendances
        } = eventConfig;

        // Validation des paramètres obligatoires
        if (!Array.isArray(name) || name.length === 0 || 
            !Array.isArray(command) || command.length === 0 || 
            typeof run !== 'function') {
            this.logger.error('⚠️ Invalid event [' + (name || command || '') + 
                            ']: name and command must be non-empty arrays, run must be a function');
            return false;
        }

        // Vérification des commandes existantes et avertissement
        for (const cmd of command) {
            if (this.findCommand(cmd)) {
                this.logger.warn('⚠️ Command "' + cmd + '" already exists and will be overwritten');
            }
        }

        // Création de l'objet événement avec normalisation des données
        const primaryName = name[0].toLowerCase();
        const eventObject = {
            name: name.map(n => n.toLowerCase()),
            command: command.map(c => c.toLowerCase()),
            category: category.toLowerCase(),
            run: run,
            limit: limit,
            
            privatechat: privatechat,
            query: !!query,
            register: register,
            owner: !!owner,
            group: !!group,
            admin: !!admin,
            botAdmin: !!botAdmin,
            desc: desc,
            alias: Array.isArray(alias) ? alias.map(a => a.toLowerCase()) : [],
            cooldown: Math.max(0, parseInt(cooldown)) || 0,
            usage: usage,
            example: example,
            hidden: !!hidden,
            dependencies: dependencies,
            enable: true,                    // Commande activée par défaut
            addedAt: new Date(),            // Date d'ajout
            lastUsed: null,                 // Dernière utilisation
            usageCount: 0                   // Compteur d'utilisation
        };

        // Enregistrement de l'événement principal
        this.events.set(primaryName, eventObject);

        // Enregistrement des alias et commandes dans la map des fonctions
        for (const functionName of [...eventObject.command, ...eventObject.alias]) {
            this.functions.set(functionName.toLowerCase(), primaryName);
        }

        return true;
    }

    /**
     * Recherche une commande par nom/alias
     * @param {string} commandName - Nom de la commande à rechercher
     * @returns {Object|null} - Objet commande trouvé ou null
     */
    findCommand(commandName) {
        const lowerName = commandName.toLowerCase();
        const eventName = this.functions.get(lowerName);
        return eventName ? this.events.get(eventName) : null;
    }

    /**
     * Supprime une commande du système
     * @param {string} commandName - Nom de la commande à supprimer
     * @returns {boolean} - true si supprimé avec succès
     */
    remove(commandName) {
        if (!commandName) return false;
        
        const lowerName = commandName.toLowerCase();
        const eventData = this.events.get(lowerName);
        
        if (!eventData) return false;

        // Suppression de tous les alias et commandes de la map des fonctions
        for (const functionName of [...eventData.command, ...eventData.alias]) {
            this.functions.delete(functionName.toLowerCase());
        }

        // Suppression de l'événement principal
        return this.events.delete(lowerName);
    }

    /**
     * Active ou désactive une commande
     * @param {string} commandName - Nom de la commande
     * @param {boolean} enabled - État d'activation
     * @returns {boolean} - true si modifié avec succès
     */
    setCommandState(commandName, enabled = true) {
        const lowerName = commandName.toLowerCase();
        const eventData = this.events.get(lowerName);
        
        if (!eventData) return false;
        
        eventData.enable = !!enabled;
        return true;
    }

    /**
     * Récupère toutes les commandes d'une catégorie
     * @param {string} categoryName - Nom de la catégorie
     * @param {boolean} includeHidden - Inclure les commandes cachées
     * @returns {Array} - Liste des commandes de la catégorie
     */
    getByCategory(categoryName, includeHidden = false) {
        const lowerCategory = categoryName.toLowerCase();
        return Array.from(this.events.values()).filter(event => 
            event.category.toLowerCase() === lowerCategory && 
            (includeHidden || !event.hidden)
        );
    }

    /**
     * Récupère toutes les catégories disponibles
     * @returns {Array} - Liste des catégories uniques
     */
    getCategories() {
        const categories = new Set();
        this.events.forEach(event => categories.add(event.category));
        return Array.from(categories);
    }

    /**
     * Vérifie si une commande est en cooldown
     * @param {string} commandName - Nom de la commande
     * @param {string} userId - ID de l'utilisateur
     * @returns {Object} - Statut du cooldown
     */
    checkCooldown(commandName, userId) {
        const commandData = this.findCommand(commandName);
        if (!commandData || commandData.cooldown <= 0) {
            return { onCooldown: false, remaining: 0 };
        }

        const cooldownKey = commandName + ':' + userId;
        const currentTime = Date.now();
        const cooldownEnd = this.cooldowns.get(cooldownKey) || 0;

        if (currentTime < cooldownEnd) {
            return {
                onCooldown: true,
                remaining: Math.ceil((cooldownEnd - currentTime) / 1000)
            };
        }

        return { onCooldown: false, remaining: 0 };
    }

    /**
     * Définit un cooldown pour une commande et un utilisateur
     * @param {string} commandName - Nom de la commande
     * @param {string} userId - ID de l'utilisateur
     */
    setCooldown(commandName, userId) {
        const commandData = this.findCommand(commandName);
        if (!commandData || commandData.cooldown <= 0) return;

        const cooldownKey = commandName + ':' + userId;
        const cooldownEnd = Date.now() + (commandData.cooldown * 1000);
        
        this.cooldowns.set(cooldownKey, cooldownEnd);

        // Nettoyage automatique du cooldown après expiration
        setTimeout(() => {
            this.cooldowns.delete(cooldownKey);
        }, commandData.cooldown * 1000);
    }

    /**
     * Incrémente le compteur d'utilisation d'une commande
     * @param {string} commandName - Nom de la commande
     */
    incrementUsage(commandName) {
        const commandData = this.findCommand(commandName);
        if (!commandData) return;

        // Mise à jour des statistiques de la commande
        commandData.usageCount++;
        commandData.lastUsed = new Date();

        // Mise à jour des statistiques globales
        const stats = this.commandStats.get(commandName) || { count: 0, lastUsed: null };
        stats.count++;
        stats.lastUsed = new Date();
        this.commandStats.set(commandName, stats);
    }

    /**
     * Récupère les statistiques d'utilisation
     * @param {string} commandName - Nom de la commande (optionnel)
     * @returns {Object|Map} - Statistiques de la commande ou toutes les statistiques
     */
    getStats(commandName = null) {
        if (commandName) {
            return this.commandStats.get(commandName) || { count: 0, lastUsed: null };
        }
        return new Map(this.commandStats);
    }

    /**
     * Récupère toutes les commandes avec filtrage optionnel
     * @param {Object} filters - Filtres à appliquer
     * @returns {Array} - Liste des commandes filtrées
     */
    getAllCommands(filters = {}) {
        const {
            category = null,           // Filtrer par catégorie
            includeHidden = false,     // Inclure les commandes cachées
            searchTerm = '',           // Terme de recherche
            onlyEnabled = true         // Seulement les commandes activées
        } = filters;

        return Array.from(this.events.values()).filter(event => {
            // Filtre par catégorie
            if (category && event.category.toLowerCase() !== category.toLowerCase()) {
                return false;
            }

            // Filtre pour les commandes cachées
            if (!includeHidden && event.hidden) {
                return false;
            }

            // Filtre pour les commandes activées
            if (onlyEnabled && !event.enable) {
                return false;
            }

            // Filtre par terme de recherche
            if (searchTerm) {
                const lowerSearchTerm = searchTerm.toLowerCase();
                const nameMatch = event.name.some(name => name.includes(lowerSearchTerm));
                const commandMatch = event.command.some(cmd => cmd.includes(lowerSearchTerm));
                const descMatch = event.desc.toLowerCase().includes(lowerSearchTerm);
                
                if (!nameMatch && !commandMatch && !descMatch) {
                    return false;
                }
            }

            return true;
        });
    }
}