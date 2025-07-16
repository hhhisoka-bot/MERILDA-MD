import fs from 'fs'
import path from 'path'

class Database {
  constructor() {
    this.dataDir = './lib/database'
    this.files = {
      users: path.join(this.dataDir, 'user.json'),
      groups: path.join(this.dataDir, 'groups.json'),
      battles: path.join(this.dataDir, 'battles.json'),
      monsters: path.join(this.dataDir, 'monster.json'),
      settings: path.join(this.dataDir, 'settings.json')
    }

    this.data = {
      users: {},
      groups: {},
      battles: {},
      monsters: [],
      settings: {}
    }

    this.initDatabase()
  }

  initDatabase() {
    // Créer le dossier de base de données s'il n'existe pas
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }

    // Initialiser chaque fichier de données
    Object.keys(this.files).forEach(key => {
      this.loadData(key)
    })

    // Charger les monstres par défaut
    this.loadDefaultMonsters()
  }

  loadData(type) {
    try {
      if (fs.existsSync(this.files[type])) {
        const data = fs.readFileSync(this.files[type], 'utf8')
        this.data[type] = JSON.parse(data)
      } else {
        // Créer le fichier avec des données par défaut
        this.saveData(type)
      }
    } catch (error) {
      console.error(`Erreur lors du chargement de ${type}:`, error)
      this.data[type] = type === 'monsters' ? [] : {}
    }
  }

  saveData(type) {
    try {
      fs.writeFileSync(this.files[type], JSON.stringify(this.data[type], null, 2))
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${type}:`, error)
    }
  }

  // Gestion des utilisateurs
  getUser(userId) {
    if (!this.data.users[userId]) {
      this.data.users[userId] = {
        id: userId,
        name: '',
        level: 1,
        exp: 0,
        money: 1000,
        lastClaim: 0,
        monsters: [],
        inventory: [],
        settings: {
          language: 'fr',
          notifications: true
        },
        stats: {
          commands: 0,
          battles: 0,
          wins: 0,
          losses: 0
        },
        premium: false,
        premiumExpiry: 0,
        banned: false,
        banReason: '',
        warnings: 0,
        createdAt: Date.now(),
        lastActivity: Date.now()
      }
      this.saveData('users')
    }
    return this.data.users[userId]
  }

  updateUser(userId, updates) {
    const user = this.getUser(userId)
    Object.assign(user, updates)
    user.lastActivity = Date.now()
    this.saveData('users')
    return user
  }

  // Gestion des groupes
  getGroup(groupId) {
    if (!this.data.groups[groupId]) {
      this.data.groups[groupId] = {
        id: groupId,
        name: '',
        settings: {
          welcome: false,
          antilink: false,
          antiviewonce: true,
          antispam: false,
          language: 'fr'
        },
        stats: {
          messages: 0,
          commands: 0
        },
        createdAt: Date.now(),
        lastActivity: Date.now()
      }
      this.saveData('groups')
    }
    return this.data.groups[groupId]
  }

  updateGroup(groupId, updates) {
    const group = this.getGroup(groupId)
    Object.assign(group, updates)
    group.lastActivity = Date.now()
    this.saveData('groups')
    return group
  }

  // Gestion des paramètres de groupe
  updateGroupSetting(groupId, setting, value) {
    const group = this.getGroup(groupId)
    group.settings[setting] = value
    this.saveData('groups')
    return group
  }

  // Gestion des monstres
  loadDefaultMonsters() {
    if (this.data.monsters.length === 0) {
      // Ajouter des monstres par défaut s'ils n'existent pas
      const defaultMonsters = [
        {
          id: "flamelet",
          nom: "Petit Flamme",
          tier: "C",
          element: "feu",
          prix: 1500,
          competences: [
            { nom: "Étincelle", degats: 8 },
            { nom: "Souffle Tiède", degats: 5 },
            { nom: "Flamme Légère", degats: 12 }
          ]
        },
        {
          id: "droplet",
          nom: "Gouttelette",
          tier: "C", 
          element: "eau",
          prix: 1500,
          competences: [
            { nom: "Jet d'Eau", degats: 8 },
            { nom: "Bulle", degats: 5 },
            { nom: "Vague Mineure", degats: 12 }
          ]
        }
      ]

      this.data.monsters = defaultMonsters
      this.saveData('monsters')
    }
  }

  getMonster(monsterId) {
    return this.data.monsters.find(m => m.id === monsterId)
  }

  getAllMonsters() {
    return this.data.monsters
  }

  // Gestion des batailles
  createBattle(battleId, battleData) {
    this.data.battles[battleId] = {
      id: battleId,
      ...battleData,
      createdAt: Date.now()
    }
    this.saveData('battles')
    return this.data.battles[battleId]
  }

  getBattle(battleId) {
    return this.data.battles[battleId]
  }

  updateBattle(battleId, updates) {
    if (this.data.battles[battleId]) {
      Object.assign(this.data.battles[battleId], updates)
      this.saveData('battles')
    }
    return this.data.battles[battleId]
  }

  deleteBattle(battleId) {
    delete this.data.battles[battleId]
    this.saveData('battles')
  }

  // Statistiques
  updateUserStats(userId, statType) {
    const user = this.getUser(userId)
    user.stats[statType] = (user.stats[statType] || 0) + 1
    this.saveData('users')
  }

  updateGroupStats(groupId, statType) {
    const group = this.getGroup(groupId)
    group.stats[statType] = (group.stats[statType] || 0) + 1
    this.saveData('groups')
  }

  // Nettoyage des données anciennes
  cleanup() {
    const now = Date.now()
    const oneWeek = 7 * 24 * 60 * 60 * 1000

    // Nettoyer les batailles anciennes
    Object.keys(this.data.battles).forEach(battleId => {
      const battle = this.data.battles[battleId]
      if (now - battle.createdAt > oneWeek) {
        delete this.data.battles[battleId]
      }
    })

    this.saveData('battles')
  }
}

// Créer une instance globale
const db = new Database()

export default db