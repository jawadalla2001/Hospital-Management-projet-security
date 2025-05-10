# Rapport d'Audit de Sécurité
## Système de Gestion Hospitalière

### Résumé Exécutif

Ce rapport présente les résultats d'un audit de sécurité complet du Système de Gestion Hospitalière développé en Node.js, Express et MySQL. L'audit a identifié plusieurs vulnérabilités critiques qui pourraient compromettre la confidentialité, l'intégrité et la disponibilité des données médicales sensibles.

**Principales conclusions** :
- Vulnérabilités d'authentification critiques (stockage de mots de passe en clair)
- Multiples vecteurs d'injection SQL dans l'ensemble de l'application
- Absence de protection contre les attaques XSS et CSRF
- Configuration non sécurisée des sessions et cookies
- Absence de chiffrement TLS pour les communications

La mise en œuvre des recommandations détaillées dans ce rapport est essentielle pour sécuriser cette application qui gère des données médicales particulièrement sensibles et soumises à des réglementations strictes (RGPD, HIPAA, etc.).

### Méthodologie d'Audit

L'audit a suivi une approche systématique combinant :

1. **Analyse statique du code** : Examen manuel du code source pour identifier les vulnérabilités et les erreurs de conception
2. **Tests dynamiques** : Simulation d'attaques sur l'application déployée
3. **Scanning automatisé** : Utilisation d'outils comme OWASP ZAP et SQLmap
4. **Vérification de configuration** : Analyse des paramètres de sécurité et des dépendances

L'évaluation s'est concentrée sur les dix principales catégories de risques du Top 10 OWASP, avec une attention particulière aux risques spécifiques aux applications médicales.

### Vulnérabilités Identifiées

#### 1. Injections SQL (Critique)

| **Détails** | **Évaluation** |
|-------------|----------------|
| **Score CVSS** | 9.8 (Critique) |
| **Vecteur** | AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H |
| **Localisation** | `models/db_controller.js`, `controllers/login.js`, multiples autres fichiers |
| **Impact** | Accès non autorisé aux données médicales, manipulation ou suppression de données, contournement de l'authentification |

**Description** : L'application construit des requêtes SQL par concaténation directe de valeurs non assainies fournies par l'utilisateur, permettant des injections SQL. Cette vulnérabilité est présente dans presque tous les points d'interaction avec la base de données.

**Exemple de code vulnérable** :
```javascript
var query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
```

**Preuve d'exploitation** : Utilisation du payload `' OR '1'='1` dans le champ de nom d'utilisateur permet de contourner l'authentification et d'accéder au système sans mot de passe valide.

#### 2. Stockage Non Sécurisé des Identifiants (Critique)

| **Détails** | **Évaluation** |
|-------------|----------------|
| **Score CVSS** | 9.1 (Critique) |
| **Vecteur** | AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N |
| **Localisation** | `models/db_controller.js`, Tables `users` et `verification` |
| **Impact** | Compromission massive de comptes utilisateurs, accès non autorisé aux données médicales |

**Description** : Les mots de passe utilisateur sont stockés en texte clair dans la base de données, sans hachage ni salage.

**Exemple de code vulnérable** :
```javascript
var signup = function(username, email, password, consent, token, status, callback) {
    var query = "INSERT INTO `verification`(`username`, `email`, `password`, `consent`, `token`, `status`) VALUES ('" + username + "','" + email + "','" + password + "','" + consent + "','" + token + "', '" + status + "')";
    connection.query(query, callback);
}
```

#### 3. Cross-Site Scripting (XSS) (Élevé)

| **Détails** | **Évaluation** |
|-------------|----------------|
| **Score CVSS** | 8.2 (Élevé) |
| **Vecteur** | AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:L/A:N |
| **Localisation** | Multiples fichiers templates EJS |
| **Impact** | Vol de sessions utilisateur, exfiltration de données médicales, phishing ciblé |

**Description** : L'application ne procède pas à l'échappement correct des données utilisateur avant leur affichage, permettant l'injection et l'exécution de scripts malveillants.

**Exemple de code vulnérable** :
```html
<div class="message-author"><%= message.author %></div>
```

**Preuve d'exploitation** : L'insertion de `<script>alert(document.cookie)</script>` dans un champ de formulaire entraîne l'exécution du code JavaScript, permettant potentiellement le vol de cookies de session.

#### 4. Cross-Site Request Forgery (CSRF) (Élevé)

| **Détails** | **Évaluation** |
|-------------|----------------|
| **Score CVSS** | 7.4 (Élevé) |
| **Vecteur** | AV:N/AC:L/PR:N/UI:R/S:C/C:N/I:H/A:N |
| **Localisation** | Tous les formulaires POST (`views/add_appointment.ejs`, etc.) |
| **Impact** | Modification non autorisée de données médicales, ajout de rendez-vous frauduleux, manipulation de prescriptions |

**Description** : L'application ne met pas en œuvre de protection CSRF, permettant à un attaquant de forcer un utilisateur authentifié à exécuter des actions non intentionnelles.

**Preuve d'exploitation** : Une page HTML externe contenant un formulaire auto-soumis vers `/store/add_med` peut ajouter un médicament non autorisé à l'inventaire de la pharmacie lorsqu'un administrateur visite cette page tout en étant connecté à l'application.

#### 5. Gestion Non Sécurisée des Sessions (Élevé)

| **Détails** | **Évaluation** |
|-------------|----------------|
| **Score CVSS** | 7.5 (Élevé) |
| **Vecteur** | AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N |
| **Localisation** | `app.js` |
| **Impact** | Détournement de session, élévation de privilèges |

**Description** : L'application utilise une configuration de session non sécurisée avec un secret codé en dur et sans attributs de sécurité pour les cookies.

**Code vulnérable** :
```javascript
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
```

#### 6. Communication Non Chiffrée (Élevé)

| **Détails** | **Évaluation** |
|-------------|----------------|
| **Score CVSS** | 7.4 (Élevé) |
| **Vecteur** | AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N |
| **Localisation** | `app.js` |
| **Impact** | Interception de données médicales sensibles, vol d'identifiants |

**Description** : L'application ne force pas l'utilisation de HTTPS, transmettant toutes les données en clair, y compris les identifiants et les informations médicales.

#### 7. Absence de Validation des Entrées (Moyen)

| **Détails** | **Évaluation** |
|-------------|----------------|
| **Score CVSS** | 6.5 (Moyen) |
| **Vecteur** | AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N |
| **Localisation** | Tous les contrôleurs, notamment `controllers/appointment.js` |
| **Impact** | Injection de données malformées, contournement de contrôles d'application |

**Description** : L'application manque de validation et d'assainissement appropriés des entrées utilisateur avant traitement.

#### 8. En-têtes HTTP de Sécurité Manquants (Faible)

| **Détails** | **Évaluation** |
|-------------|----------------|
| **Score CVSS** | 5.3 (Moyen) |
| **Vecteur** | AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N |
| **Localisation** | `app.js` |
| **Impact** | Vulnérabilité aux attaques de clickjacking, MIME-sniffing |

**Description** : L'application n'implémente pas les en-têtes HTTP de sécurité essentiels comme X-Content-Type-Options, X-Frame-Options, Content-Security-Policy.

#### 9. Exposition des Détails Techniques dans les Erreurs (Faible)

| **Détails** | **Évaluation** |
|-------------|----------------|
| **Score CVSS** | 5.3 (Moyen) |
| **Vecteur** | AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N |
| **Localisation** | Application globale |
| **Impact** | Divulgation d'informations sensibles sur la structure interne de l'application |

**Description** : L'application affiche des messages d'erreur détaillés aux utilisateurs, révélant potentiellement des informations sur la structure de l'application et le système sous-jacent.

### Plan de Remédiation

#### Actions Immédiates (Priorité Critique, 0-30 jours)

1. **Correction des injections SQL**
   - Implémenter des requêtes paramétrées pour toutes les interactions avec la base de données
   - Utiliser les fonctions de préparation de MySQL
   
   ```javascript
   // Avant
   var query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
   
   // Après
   var query = "SELECT * FROM users WHERE username = ? AND password = ?";
   connection.query(query, [username, password], callback);
   ```

2. **Sécurisation du stockage des mots de passe**
   - Implémenter le hachage des mots de passe avec bcrypt
   - Créer un script de migration pour hacher les mots de passe existants
   
   ```javascript
   // Installation
   npm install bcrypt --save
   
   // Implémentation
   const bcrypt = require('bcrypt');
   const saltRounds = 10;
   
   // Hachage lors de l'inscription
   bcrypt.hash(password, saltRounds, function(err, hash) {
       // Stocker le hash dans la base de données
   });
   
   // Vérification lors de la connexion
   bcrypt.compare(password, hash, function(err, result) {
       // result = true si correspondance
   });
   ```

3. **Déploiement de TLS**
   - Obtenir et installer un certificat SSL/TLS
   - Configurer l'application pour utiliser HTTPS uniquement
   - Mettre en place une redirection HTTP vers HTTPS

#### Actions à Court Terme (Priorité Élevée, 30-60 jours)

4. **Protection contre XSS**
   - Implémenter l'échappement automatique dans tous les templates EJS
   - Utiliser une bibliothèque de sanitization comme DOMPurify
   
   ```javascript
   // Installation
   npm install dompurify jsdom --save
   
   // Implémentation
   const createDOMPurify = require('dompurify');
   const { JSDOM } = require('jsdom');
   const window = new JSDOM('').window;
   const DOMPurify = createDOMPurify(window);
   
   // Sanitization
   const clean = DOMPurify.sanitize(dirtyInput);
   ```

5. **Protection contre CSRF**
   - Implémenter csurf pour la protection CSRF
   - Ajouter des tokens CSRF à tous les formulaires
   
   ```javascript
   // Installation
   npm install csurf --save
   
   // Implémentation
   const csrf = require('csurf');
   const csrfProtection = csrf({ cookie: true });
   
   app.use(csrfProtection);
   
   // Dans les routes
   app.get('/form', (req, res) => {
     res.render('form', { csrfToken: req.csrfToken() });
   });
   
   // Dans les templates
   <form action="/process" method="POST">
     <input type="hidden" name="_csrf" value="<%= csrfToken %>">
     <!-- autres champs -->
   </form>
   ```

6. **Sécurisation des sessions**
   - Reconfigurer les paramètres de session
   - Utiliser un secret aléatoire stocké dans une variable d'environnement
   
   ```javascript
   app.use(session({
       secret: process.env.SESSION_SECRET,
       resave: false,
       saveUninitialized: false,
       cookie: {
           httpOnly: true,
           secure: true,
           sameSite: 'strict',
           maxAge: 3600000 // 1 heure
       }
   }));
   ```

#### Actions à Moyen Terme (Priorité Moyenne, 60-90 jours)

7. **Validation des entrées**
   - Implémenter express-validator pour la validation côté serveur
   - Ajouter des validations côté client pour améliorer l'expérience utilisateur
   
   ```javascript
   // Installation
   npm install express-validator --save
   
   // Implémentation
   const { check, validationResult } = require('express-validator');
   
   app.post('/appointment/add', [
     check('patient').not().isEmpty().withMessage('Patient name is required'),
     check('doctor').not().isEmpty().withMessage('Doctor is required'),
     check('date').isISO8601().withMessage('Valid date is required')
   ], (req, res) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }
     // Traitement si validation réussie
   });
   ```

8. **En-têtes de sécurité HTTP**
   - Implémenter Helmet.js pour gérer les en-têtes de sécurité
   
   ```javascript
   // Installation
   npm install helmet --save
   
   // Implémentation
   const helmet = require('helmet');
   app.use(helmet());
   ```

9. **Gestion des erreurs**
   - Implémenter des pages d'erreur personnalisées
   - Journaliser les erreurs en interne sans les exposer aux utilisateurs

#### Actions à Long Terme (Priorité Basse, 90+ jours)

10. **Audit et surveillance continue**
    - Mettre en place un système de journalisation de sécurité
    - Implémenter des alertes pour les activités suspectes
    - Planifier des revues de code et des tests de pénétration réguliers

11. **Politique de sécurité**
    - Développer une politique de sécurité complète
    - Former les développeurs aux meilleures pratiques de sécurité
    - Établir des procédures d'intervention en cas d'incident

### Déploiement Sécurisé

Pour déployer de manière sécurisée l'application avec TLS :

#### Étape 1 : Obtention d'un Certificat SSL/TLS

**Avec Let's Encrypt (recommandé pour la production)** :
```bash
# Installer Certbot
sudo apt-get update
sudo apt-get install certbot

# Obtenir un certificat
sudo certbot certonly --standalone -d votredomaine.com

# Vérifier les certificats
ls -l /etc/letsencrypt/live/votredomaine.com/
```

**Avec un certificat auto-signé (environnement de test uniquement)** :
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./selfsigned.key -out ./selfsigned.crt
```

#### Étape 2 : Configuration HTTPS dans l'Application

Modifiez `app.js` pour utiliser HTTPS :

```javascript
const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();

// Configuration Express existante...

// Chargement des certificats
const privateKey = fs.readFileSync('/chemin/vers/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/chemin/vers/cert.pem', 'utf8');
const ca = fs.readFileSync('/chemin/vers/chain.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

// Serveur HTTPS
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(443, () => {
    console.log('Serveur HTTPS démarré sur le port 443');
});

// Redirection HTTP vers HTTPS (optionnel)
const http = require('http');
http.createServer((req, res) => {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);
```

#### Étape 3 : Configuration de la Sécurité Supplémentaire

Ajoutez des configurations supplémentaires pour renforcer la sécurité :

```javascript
// Installer les dépendances
// npm install helmet express-rate-limit --save

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Utiliser Helmet pour les en-têtes de sécurité
app.use(helmet());

// Configurer CSP
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"]
    }
}));

// Limiter les tentatives de connexion
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives max
    message: "Trop de tentatives de connexion, réessayez dans 15 minutes"
});

app.use("/login", loginLimiter);
```

### Conclusion et Recommandations Générales

Cette application de gestion hospitalière présente plusieurs vulnérabilités critiques qui pourraient compromettre gravement la confidentialité et l'intégrité des données médicales sensibles. En suivant le plan de remédiation détaillé dans ce rapport, l'organisation peut considérablement améliorer la posture de sécurité de l'application.

**Recommandations générales** :

1. **Adopter une approche de "sécurité dès la conception"** pour tous les nouveaux développements
2. **Former régulièrement les développeurs** aux meilleures pratiques de sécurité
3. **Mettre en place un programme de tests de pénétration réguliers**
4. **Utiliser des outils d'analyse de code statique** dans le pipeline de développement
5. **Mettre en œuvre un processus d'examen de code** axé sur la sécurité

L'implémentation de ces recommandations permettra non seulement de sécuriser l'application actuelle, mais également d'établir une base solide pour le développement sécurisé de futures fonctionnalités et applications.

---

### Annexes

#### Annexe A : Outils Utilisés pour l'Audit

- Analyse statique : ESLint avec règles de sécurité, npm audit
- Tests dynamiques : OWASP ZAP, Burp Suite (édition communautaire), SQLmap
- Tests manuels : Firefox avec extensions de développement, Postman

#### Annexe B : Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [RGPD](https://gdpr.eu/)